"use server";
import { revalidateTag } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { z } from "zod";
import { teacherProfileSchema, updateProfileRequestSchema, type UpdateProfileRequest } from "@/features/profile/schema";
import { logger } from "@/lib/logger";

const imageUploadResponseSchema = z.object({
  upload_url: z.string(),
  path: z.string(),
});

export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<
  { success: true; data: { name: string; description: string | null; img: string | null } }
  | { success: false; error: { type: string; message: string } }
> {
  const start = performance.now();
  logger.action("updateProfile", { name: data.name });

  try {
    const parsed = updateProfileRequestSchema.parse(data);
    const result = await apiFetch(endpoints.teachers.me, teacherProfileSchema, {
      method: "PATCH",
      body: JSON.stringify(parsed),
    });

    revalidateTag("profile", "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("updateProfile", { name: result.name }, elapsed);

    return {
      success: true,
      data: { name: result.name, description: result.description, img: result.img },
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string };
      logger.actionError("updateProfile", apiErr, elapsed);
      return { success: false, error: { type: apiErr.type, message: apiErr.message } };
    }
    logger.actionError("updateProfile", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function requestProfileImageUpload(
  filename: string,
): Promise<
  { success: true; uploadUrl: string; path: string }
  | { success: false; error: { type: string; message: string } }
> {
  const start = performance.now();
  logger.action("requestProfileImageUpload", { filename });

  try {
    const path = `${endpoints.teachers.requestImageUpload}?filename=${encodeURIComponent(filename)}`;
    const result = await apiFetch(path, imageUploadResponseSchema, {
      method: "POST",
    });

    revalidateTag("profile", "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("requestProfileImageUpload", { filename }, elapsed);

    return { success: true, uploadUrl: result.upload_url, path: result.path };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string };
      logger.actionError("requestProfileImageUpload", apiErr, elapsed);
      return { success: false, error: { type: apiErr.type, message: apiErr.message } };
    }
    logger.actionError("requestProfileImageUpload", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}
