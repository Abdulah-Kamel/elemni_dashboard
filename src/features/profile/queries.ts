import "server-only";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  publicTeacherProfileSchema,
  teacherProfileSchema,
  type PublicTeacherProfile,
  type TeacherProfile,
} from "@/features/profile/schema";

export async function getTeacherProfile(): Promise<TeacherProfile> {
  return apiFetch(endpoints.teachers.me, teacherProfileSchema, {
    tags: ["teacher-profile"],
  });
}

export async function getPublicTeacherProfile(slug: string): Promise<PublicTeacherProfile> {
  return apiFetch(endpoints.teachers.publicDetail(slug), publicTeacherProfileSchema, {
    tags: ["teacher-profile"],
  });
}
