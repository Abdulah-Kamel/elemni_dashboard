import { useRef, useState, useCallback } from "react"
import type { ItemCreate, ItemOut } from "../items-schema"
import type { CreateItemPayload, AttachmentUploadStatus } from "../components/create-item-dialog"
import {
  requestVideoUpload,
  confirmVideoUpload,
  requestUploadUrl,
  confirmUpload,
  updateItem,
} from "../items-actions"
import { uploadToPresignedUrl } from "@/lib/upload"

export type UseCreateItemFlowOptions = {
  courseId: number
  lessonId: number
  createItem: (data: ItemCreate) => Promise<ItemOut>
  onItemUpdated: (item: ItemOut) => void
  onCurriculumCommitted: () => void | Promise<void>
  onComplete: () => void
  uploadErrorMessage: string
}

type CreateItemFlow = {
  submit: (payload: CreateItemPayload) => Promise<void>
  reset: () => void
  uploading: boolean
  videoStatus: AttachmentUploadStatus
  documentStatus: AttachmentUploadStatus
  videoProgress: number
  error: string | null
}

export function useCreateItemFlow(options: UseCreateItemFlowOptions): CreateItemFlow {
  const {
    courseId,
    lessonId,
    createItem,
    onItemUpdated,
    onCurriculumCommitted,
    onComplete,
    uploadErrorMessage,
  } = options

  const [uploading, setUploading] = useState(false)
  const [videoStatus, setVideoStatus] = useState<AttachmentUploadStatus>("idle")
  const [documentStatus, setDocumentStatus] = useState<AttachmentUploadStatus>("idle")
  const [videoProgress, setVideoProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const itemRef = useRef<ItemOut | null>(null)
  const videoCompletedRef = useRef(false)
  const documentCompletedRef = useRef(false)
  const uploadingRef = useRef(false)
  const activeAttachmentRef = useRef<"video" | "document" | null>(null)

  const reset = useCallback(() => {
    if (uploadingRef.current) return
    itemRef.current = null
    videoCompletedRef.current = false
    documentCompletedRef.current = false
    setVideoStatus("idle")
    setDocumentStatus("idle")
    setVideoProgress(0)
    setError(null)
  }, [])

  const submit = useCallback(
    async (payload: CreateItemPayload) => {
      if (uploadingRef.current) return
      uploadingRef.current = true
      setUploading(true)
      setError(null)

      try {
        if (!itemRef.current) {
          const item = await createItem({
            title: payload.title,
            ...(payload.max_watch_count !== undefined
              ? { max_watch_count: payload.max_watch_count }
              : {}),
          })
          itemRef.current = item
          await onCurriculumCommitted()
        } else {
          const maxWatchCount = payload.max_watch_count ?? null
          if (maxWatchCount !== itemRef.current.max_watch_count) {
            const updateResult = await updateItem(courseId, itemRef.current.id, {
              max_watch_count: maxWatchCount,
            })
            if (!updateResult.success) {
              throw new Error(updateResult.error.message || uploadErrorMessage)
            }
            itemRef.current = updateResult.data
            onItemUpdated(updateResult.data)
            await onCurriculumCommitted()
          }
        }

        if (payload.videoFile && !videoCompletedRef.current) {
          activeAttachmentRef.current = "video"
          setVideoStatus("uploading")
          const videoResult = await requestVideoUpload(
            courseId,
            lessonId,
            itemRef.current.id,
            payload.videoFile.name
          )
          if (!videoResult.success) {
            throw new Error(videoResult.error.message || uploadErrorMessage)
          }
          const { uploadVideoToBunnyTus } = await import("@/lib/tus-upload")
          await uploadVideoToBunnyTus(
            payload.videoFile,
            videoResult.data,
            setVideoProgress
          )
          const confirmResult = await confirmVideoUpload(
            courseId,
            lessonId,
            itemRef.current.id,
            videoResult.data.video_id
          )
          if (!confirmResult.success) {
            throw new Error(confirmResult.error.message || uploadErrorMessage)
          }
          itemRef.current = confirmResult.data
          videoCompletedRef.current = true
          onItemUpdated(confirmResult.data)
          setVideoStatus("uploaded")
          await onCurriculumCommitted()
        }

        if (payload.documentFile && !documentCompletedRef.current) {
          activeAttachmentRef.current = "document"
          setDocumentStatus("uploading")
          const docUrlResult = await requestUploadUrl(
            courseId,
            lessonId,
            itemRef.current.id,
            payload.documentFile.name
          )
          if (!docUrlResult.success) {
            throw new Error(docUrlResult.error.message || uploadErrorMessage)
          }
          const uploadResponse = await uploadToPresignedUrl(
            docUrlResult.data.upload_url,
            payload.documentFile
          )
          if (!uploadResponse.ok) {
            throw new Error(uploadErrorMessage)
          }
          const confirmDocResult = await confirmUpload(
            courseId,
            lessonId,
            itemRef.current.id,
            docUrlResult.data.key
          )
          if (!confirmDocResult.success) {
            throw new Error(confirmDocResult.error.message || uploadErrorMessage)
          }
          itemRef.current = confirmDocResult.data
          documentCompletedRef.current = true
          onItemUpdated(confirmDocResult.data)
          setDocumentStatus("uploaded")
          await onCurriculumCommitted()
        }

        const videoDone = !payload.videoFile || videoCompletedRef.current
        const docDone = !payload.documentFile || documentCompletedRef.current
        if (videoDone && docDone) {
          onComplete()
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : uploadErrorMessage
        setError(message)
        if (activeAttachmentRef.current === "video" && !videoCompletedRef.current) {
          setVideoStatus("failed")
        } else if (activeAttachmentRef.current === "document" && !documentCompletedRef.current) {
          setDocumentStatus("failed")
        }
      } finally {
        activeAttachmentRef.current = null
        uploadingRef.current = false
        setUploading(false)
      }
    },
    [
      courseId,
      lessonId,
      createItem,
      onItemUpdated,
      onCurriculumCommitted,
      onComplete,
      uploadErrorMessage,
    ]
  )

  return {
    submit,
    reset,
    uploading,
    videoStatus,
    documentStatus,
    videoProgress,
    error,
  }
}
