"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { apiFetch } from "@/lib/api/client";
import { z } from "zod";
import {
  adminCreateTeacherRequestSchema,
  adminCreateTeacherResponseSchema,
  adminTeacherListItemSchema,
  adminStudentCreateSchema,
  adminStudentCreateResponseSchema,
  adminStudentSchema,
  adminStudentUpdateSchema,
  adminLibrarySettingsSchema,
  adminUpdateTeacherSchema,
  setPasswordResponseSchema,
  taxonomyUpdateSchema,
  gradeCreateSchema,
  streamCreateSchema,
  subjectCreateSchema,
} from "@/features/admin/schema";
import type { AdminStudentCreateResponse, AdminTeacherPage } from "@/features/admin/schema";
import {
  listAdminStudents,
  listAdminSubscriptions,
  listAdminTeachers as listTeachersQuery,
  type PageParams,
} from "@/features/admin/queries";
import { gradeOutSchema, streamOutSchema, subjectOutSchema } from "@/features/course-management/schema";
import { logger } from "@/lib/logger";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };

async function redirectToSignIn(nextPath: string): Promise<never> {
  const h = await headers();
  const locale = h.get("Accept-Language")?.startsWith("en") ? "en" : "ar";
  redirect(`/${locale}/sign-out?next=${encodeURIComponent(nextPath)}`);
}

function handleActionResultErr(err: unknown, elapsed: number, action: string): { success: false; error: { type: string; message: string } } {
  if (err && typeof err === "object" && "type" in err) {
    const apiErr = err as { type: string; message: string };
    logger.actionError(action, apiErr, elapsed);
    if (apiErr.type === "Unauthorized") {
      return { success: false, error: apiErr };
    }
    return { success: false, error: apiErr };
  }
  logger.actionError(action, err, elapsed);
  return { success: false, error: { type: "Upstream", message: "Network error" } };
}

export async function createTeacher(data: unknown): Promise<
  ActionResult<{ id: number; name: string; slug: string; email: string; invitation_sent: boolean }>
> {
  const start = performance.now();
  logger.action("createTeacher", { name: (data as Record<string, unknown>)?.name });
  try {
    const parsed = adminCreateTeacherRequestSchema.parse(data);
    const result = await apiFetch("/api/v1/admin/teachers", adminCreateTeacherResponseSchema, {
      method: "POST",
      body: JSON.stringify(parsed),
    });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("createTeacher", { id: result.id }, elapsed);
    return { success: true, data: { id: result.id, name: result.name, slug: result.slug, email: result.email, invitation_sent: result.invitation_sent } };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string };
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("createTeacher", { unauthorized: true }, elapsed);
        await redirectToSignIn("/admin/teachers");
      }
    }
    return handleActionResultErr(err, elapsed, "createTeacher");
  }
}

export async function sendSetPasswordEmail(userId: number): Promise<
  ActionResult<{ detail: string }>
> {
  const start = performance.now();
  logger.action("sendSetPasswordEmail", { userId });
  try {
    const result = await apiFetch(`/api/v1/admin/teachers/${userId}/set-password`, setPasswordResponseSchema, {
      method: "POST",
    });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("sendSetPasswordEmail", { userId }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    return handleActionResultErr(err, elapsed, "sendSetPasswordEmail");
  }
}

export async function listTeachersAction(params: PageParams = {}): Promise<AdminTeacherPage> {
  return listTeachersQuery(params);
}

export async function updateTeacher(id: number, data: unknown): Promise<ActionResult<unknown>> {
  try {
    const parsed = adminUpdateTeacherSchema.parse(data)
    const result = await apiFetch(`/api/v1/admin/teachers/${id}`, adminTeacherListItemSchema, {
      method: "PATCH",
      body: JSON.stringify(parsed),
    })
    return { success: true, data: result }
  } catch (err) {
    return handleActionResultErr(err, 0, "updateTeacher")
  }
}

export async function listStudentsAction(params: PageParams = {}) {
  return listAdminStudents(params)
}

export async function listSubscriptionsAction(params: PageParams = {}) {
  return listAdminSubscriptions(params)
}

export async function createStudent(data: unknown): Promise<ActionResult<AdminStudentCreateResponse>> {
  try {
    const parsed = adminStudentCreateSchema.parse(data)
    const result = await apiFetch("/api/v1/admin/students", adminStudentCreateResponseSchema, {
      method: "POST",
      body: JSON.stringify(parsed),
    })
    return { success: true, data: result }
  } catch (err) {
    return handleActionResultErr(err, 0, "createStudent")
  }
}

export async function updateStudent(id: number, data: unknown): Promise<ActionResult<unknown>> {
  try {
    const parsed = adminStudentUpdateSchema.parse(data)
    const result = await apiFetch(`/api/v1/admin/students/${id}`, adminStudentSchema, {
      method: "PATCH",
      body: JSON.stringify(parsed),
    })
    return { success: true, data: result }
  } catch (err) {
    return handleActionResultErr(err, 0, "updateStudent")
  }
}

export async function deleteStudent(id: number): Promise<ActionResult<void>> {
  try {
    await apiFetch(`/api/v1/admin/students/${id}`, z.void(), { method: "DELETE" })
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionResultErr(err, 0, "deleteStudent")
  }
}

export async function createTeacherLibrary(id: number): Promise<ActionResult<{ detail: string }>> {
  try {
    const result = await apiFetch(`/api/v1/admin/teachers/${id}/library`, setPasswordResponseSchema, { method: "POST" })
    return { success: true, data: result }
  } catch (err) {
    return handleActionResultErr(err, 0, "createTeacherLibrary")
  }
}

export async function updateTeacherLibrarySettings(id: number, data: unknown): Promise<ActionResult<{ detail: string }>> {
  try {
    const parsed = adminLibrarySettingsSchema.parse(data)
    const result = await apiFetch(`/api/v1/admin/teachers/${id}/library/settings`, setPasswordResponseSchema, { method: "PATCH", body: JSON.stringify(parsed) })
    return { success: true, data: result }
  } catch (err) {
    return handleActionResultErr(err, 0, "updateTeacherLibrarySettings")
  }
}

type TaxonomyKind = "grades" | "streams" | "subjects";

function taxonomyOutSchema(kind: TaxonomyKind): z.ZodType<unknown> {
  if (kind === "grades") return gradeOutSchema;
  if (kind === "streams") return streamOutSchema;
  return subjectOutSchema;
}

function taxonomyPath(kind: TaxonomyKind): string {
  return `/api/v1/admin/${kind}`;
}

export async function createTaxonomyItem(kind: TaxonomyKind, data: unknown): Promise<ActionResult<unknown>> {
  const start = performance.now();
  logger.action("createTaxonomyItem", { kind, name: (data as Record<string, unknown>)?.name });
  try {
    const parsed = kind === "grades" ? gradeCreateSchema.parse(data) : kind === "streams" ? streamCreateSchema.parse(data) : subjectCreateSchema.parse(data);
    const result = await apiFetch(taxonomyPath(kind), taxonomyOutSchema(kind), { method: "POST", body: JSON.stringify(parsed) });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("createTaxonomyItem", { kind }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    return handleActionResultErr(err, elapsed, "createTaxonomyItem");
  }
}

export async function updateTaxonomyItem(kind: TaxonomyKind, id: number, data: unknown): Promise<ActionResult<unknown>> {
  const start = performance.now();
  logger.action("updateTaxonomyItem", { kind, id });
  try {
    const parsed = taxonomyUpdateSchema.parse(data);
    const result = await apiFetch(`${taxonomyPath(kind)}/${id}`, taxonomyOutSchema(kind), { method: "PATCH", body: JSON.stringify(parsed) });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("updateTaxonomyItem", { kind, id }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    return handleActionResultErr(err, elapsed, "updateTaxonomyItem");
  }
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, id: number): Promise<ActionResult<void>> {
  const start = performance.now();
  logger.action("deleteTaxonomyItem", { kind, id });
  try {
    await apiFetch(`${taxonomyPath(kind)}/${id}`, z.void(), { method: "DELETE" });
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("deleteTaxonomyItem", { kind, id }, elapsed);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    return handleActionResultErr(err, elapsed, "deleteTaxonomyItem");
  }
}
