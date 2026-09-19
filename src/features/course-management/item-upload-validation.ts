export type UploadType = "video" | "document"

export type UploadValidationError =
  | "invalid_video"
  | "video_too_large"
  | "invalid_document"

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024

export type ItemAttachmentSelection = {
  videoFile: File | null
  documentFile: File | null
}

export type ItemAttachmentSelectionError =
  | UploadValidationError
  | "too_many_attachments"
  | "duplicate_video"
  | "duplicate_document"
  | "unsupported_attachment"

export function validateItemUploadFile(
  file: File,
  type: UploadType
): UploadValidationError | null {
  if (type === "video") {
    if (!file.type.startsWith("video/")) return "invalid_video"
    if (file.size > MAX_VIDEO_SIZE) return "video_too_large"
    return null
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "invalid_document"
  }

  return null
}

export function getItemAttachmentType(file: File): UploadType | null {
  if (file.type.startsWith("video/")) return "video"
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "document"
  }
  return null
}

export function mergeItemAttachmentFiles(
  current: ItemAttachmentSelection,
  selected: File[]
): {
  selection: ItemAttachmentSelection
  error: ItemAttachmentSelectionError | null
} {
  if (selected.length === 0) return { selection: current, error: null }

  if (selected.length > 2)
    return { selection: current, error: "too_many_attachments" }

  const incoming: Array<{ file: File; type: UploadType }> = []
  for (const file of selected) {
    const type = getItemAttachmentType(file)
    if (!type) return { selection: current, error: "unsupported_attachment" }
    incoming.push({ file, type })
  }

  const types = incoming.map((i) => i.type)
  if (types.includes("video") && types.filter((t) => t === "video").length > 1)
    return { selection: current, error: "duplicate_video" }
  if (
    types.includes("document") &&
    types.filter((t) => t === "document").length > 1
  )
    return { selection: current, error: "duplicate_document" }

  for (const { file, type } of incoming) {
    const err = validateItemUploadFile(file, type)
    if (err) return { selection: current, error: err }
  }

  const selection = { ...current }
  for (const { file, type } of incoming) {
    if (type === "video") selection.videoFile = file
    else selection.documentFile = file
  }

  return { selection, error: null }
}
