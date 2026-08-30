"use server";

import { revalidateTag } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  profileImageUploadSchema,
  teacherProfileOutSchema,
  updateProfileRequestSchema,
  type ProfileImageUpload,
  type TeacherProfileOut,
  type TeacherProfile,
  type UpdateProfileRequest,
} from "@/features/profile/schema";
import { getTeacherProfile as getTeacherProfileQuery } from "@/features/profile/queries";

type ProfileActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };

function actionError(error: unknown): { success: false; error: { type: string; message: string } } {
  if (error && typeof error === "object" && "type" in error && "message" in error) {
    const apiError = error as { type: string; message: string };
    return { success: false, error: apiError };
  }
  return { success: false, error: { type: "Upstream", message: "Profile request failed" } };
}

export async function updateTeacherProfile(
  input: UpdateProfileRequest,
): Promise<ProfileActionResult<TeacherProfileOut>> {
  try {
    const body = updateProfileRequestSchema.parse(input);
    const profile = await apiFetch(endpoints.teachers.me, teacherProfileOutSchema, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    revalidateTag("teacher-profile", "default");
    return { success: true, data: profile };
  } catch (error) {
    return actionError(error);
  }
}

export async function requestProfileImageUpload(
  filename: string,
): Promise<ProfileActionResult<ProfileImageUpload>> {
  try {
    const path = `${endpoints.teachers.requestImageUpload}?filename=${encodeURIComponent(filename)}`;
    const upload = await apiFetch(path, profileImageUploadSchema, { method: "POST" });
    return { success: true, data: upload };
  } catch (error) {
    return actionError(error);
  }
}

export async function getTeacherProfileAction(): Promise<TeacherProfile> {
  return getTeacherProfileQuery();
}
