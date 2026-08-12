import { requestCourseImageUpload } from "@/features/course-management/actions"
import { uploadToPresignedUrl } from "@/lib/upload"

export async function uploadCourseCover(
  courseId: number,
  file: File
): Promise<string> {
  const upload = await requestCourseImageUpload(courseId, file.name)
  if (!upload.success) throw new Error(upload.error.message)

  const response = await uploadToPresignedUrl(upload.data.upload_url, file)
  if (!response.ok) throw new Error("Course cover upload failed")

  return upload.data.path
}
