import "server-only";
import { apiFetch } from "@/lib/api/client";
import { publicTeacherOutSchema, adminTeacherListItemSchema, type PublicTeacherOut, type AdminTeacherListItem } from "@/features/admin/schema";

export async function listTeachers(): Promise<PublicTeacherOut[]> {
  return apiFetch("/api/v1/teachers", publicTeacherOutSchema.array(), {
    noAuth: true,
    tags: ["teachers:all"],
    revalidate: 60,
  });
}

export async function listAdminTeachers(): Promise<AdminTeacherListItem[]> {
  return apiFetch("/api/v1/admin/teachers", adminTeacherListItemSchema.array(), {
    tags: ["admin:teachers"],
  });
}
