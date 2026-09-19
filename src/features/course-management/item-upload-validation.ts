export type UploadType = "video" | "document"

export type UploadValidationError =
  | "invalid_video"
  | "video_too_large"
  | "invalid_document"

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024

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
