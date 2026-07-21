"use server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { apiFetch } from "@/lib/api/client";
import { env } from "@/env";
import { endpoints } from "@/lib/api/endpoints";
import { itemOutSchema, itemCreateSchema, itemUpdateSchema, uploadUrlResponseSchema } from "@/features/course-management/items-schema";
import { reorderItemSchema } from "@/features/course-management/chapters-schema";
import type { ItemOut, ItemCreate, ItemUpdate } from "@/features/course-management/items-schema";
import type { ReorderItem } from "@/features/course-management/chapters-schema";
import { logger } from "@/lib/logger";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string; fields?: string[] } };

async function redirectToSignIn(nextPath: string): Promise<never> {
  const h = await headers();
  const locale = h.get("Accept-Language")?.startsWith("en") ? "en" : "ar";
  redirect(`/${locale}/sign-out?next=${encodeURIComponent(nextPath)}`);
}

export async function getItems(
  courseId: number,
  lessonId: number,
): Promise<ItemOut[]> {
  return apiFetch(endpoints.courses.items.list(courseId, lessonId), itemOutSchema.array(), {
    tags: [`items:${courseId}:${lessonId}`],
  });
}

export async function createItem(
  courseId: number,
  lessonId: number,
  data: ItemCreate,
): Promise<ActionResult<ItemOut>> {
  const body = itemCreateSchema.parse(data);

  logger.action("createItem", { courseId, lessonId, title: body.title });
  const start = performance.now();

  try {
    const item = await apiFetch(
      endpoints.courses.items.list(courseId, lessonId),
      itemOutSchema,
      { method: "POST", body: JSON.stringify(body) },
    );
    revalidateTag(`items:${courseId}:${lessonId}`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("createItem", { itemId: item.id }, elapsed);
    return { success: true, data: item };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] };
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("createItem", { unauthorized: true }, elapsed);
        await redirectToSignIn(`/courses/${courseId}`);
      }
      logger.actionError("createItem", apiErr, elapsed);
      return { success: false, error: apiErr };
    }
    logger.actionError("createItem", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function updateItem(
  courseId: number,
  itemId: number,
  data: ItemUpdate,
): Promise<ActionResult<ItemOut>> {
  const body = itemUpdateSchema.parse(data);

  logger.action("updateItem", { courseId, itemId });
  const start = performance.now();

  try {
    const item = await apiFetch(
      endpoints.courses.items.detail(courseId, itemId),
      itemOutSchema,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    revalidateTag(`items:${courseId}:*`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("updateItem", { itemId: item.id }, elapsed);
    return { success: true, data: item };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] };
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("updateItem", { unauthorized: true }, elapsed);
        await redirectToSignIn(`/courses/${courseId}`);
      }
      logger.actionError("updateItem", apiErr, elapsed);
      return { success: false, error: apiErr };
    }
    logger.actionError("updateItem", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function deleteItem(
  courseId: number,
  itemId: number,
  lessonId: number,
): Promise<ActionResult<void>> {
  logger.action("deleteItem", { courseId, itemId });
  const start = performance.now();

  try {
    await apiFetch(
      endpoints.courses.items.detail(courseId, itemId),
      itemOutSchema,
      { method: "DELETE" },
    );
    revalidateTag(`items:${courseId}:${lessonId}`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("deleteItem", { itemId }, elapsed);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] };
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("deleteItem", { unauthorized: true }, elapsed);
        await redirectToSignIn(`/courses/${courseId}`);
      }
      logger.actionError("deleteItem", apiErr, elapsed);
      return { success: false, error: apiErr };
    }
    logger.actionError("deleteItem", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function reorderItems(
  courseId: number,
  lessonId: number,
  items: ReorderItem[],
): Promise<ActionResult<ItemOut[]>> {
  const body = reorderItemSchema.array().parse(items);

  logger.action("reorderItems", { courseId, lessonId, itemCount: body.length });
  const start = performance.now();

  try {
    const result = await apiFetch(
      endpoints.courses.items.reorder(courseId, lessonId),
      itemOutSchema.array(),
      { method: "PUT", body: JSON.stringify({ items: body }) },
    );
    revalidateTag(`items:${courseId}:${lessonId}`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("reorderItems", { itemIds: result.map((i) => i.id) }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string; fields?: string[] };
      if (apiErr.type === "Unauthorized") {
        logger.actionDone("reorderItems", { unauthorized: true }, elapsed);
        await redirectToSignIn(`/courses/${courseId}`);
      }
      logger.actionError("reorderItems", apiErr, elapsed);
      return { success: false, error: apiErr };
    }
    logger.actionError("reorderItems", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function uploadItemVideo(
  courseId: number,
  lessonId: number,
  itemId: number,
  formData: FormData,
): Promise<ActionResult<ItemOut>> {
  logger.action("uploadItemVideo", { courseId, lessonId, itemId });
  const start = performance.now();

  try {
    const { getSession } = await import("@/lib/auth/session");
    const session = await getSession();
    const token = session?.access_token;
    const url = `${env.API_URL}${endpoints.courses.items.uploadVideo(courseId, lessonId, itemId)}`;

    const res = await fetch(url, {
      method: "POST",
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: { type: "Upstream", message: text || "Upload failed" } };
    }

    const data: ItemOut = await res.json();
    revalidateTag(`items:${courseId}:${lessonId}`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("uploadItemVideo", { itemId: data.id }, elapsed);
    return { success: true, data };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    logger.actionError("uploadItemVideo", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function requestUploadUrl(
  courseId: number,
  lessonId: number,
  itemId: number,
  filename: string,
): Promise<ActionResult<{ url: string; key: string }>> {
  logger.action("requestUploadUrl", { courseId, lessonId, itemId, filename });
  const start = performance.now();

  try {
    const result = await apiFetch(
      endpoints.courses.items.requestUploadUrl(courseId, lessonId, itemId) + `?filename=${encodeURIComponent(filename)}`,
      uploadUrlResponseSchema,
    );
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("requestUploadUrl", { key: result.key }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      logger.actionError("requestUploadUrl", err, elapsed);
      return { success: false, error: err as { type: string; message: string; fields?: string[] } };
    }
    logger.actionError("requestUploadUrl", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}

export async function confirmUpload(
  courseId: number,
  lessonId: number,
  itemId: number,
  key: string,
): Promise<ActionResult<ItemOut>> {
  logger.action("confirmUpload", { courseId, lessonId, itemId, key });
  const start = performance.now();

  try {
    const result = await apiFetch(
      endpoints.courses.items.confirmUpload(courseId, lessonId, itemId),
      itemOutSchema,
      { method: "POST", body: JSON.stringify({ key }) },
    );
    revalidateTag(`items:${courseId}:${lessonId}`, "default");
    const elapsed = Math.round(performance.now() - start);
    logger.actionDone("confirmUpload", { itemId: result.id }, elapsed);
    return { success: true, data: result };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    if (err && typeof err === "object" && "type" in err) {
      logger.actionError("confirmUpload", err, elapsed);
      return { success: false, error: err as { type: string; message: string; fields?: string[] } };
    }
    logger.actionError("confirmUpload", err, elapsed);
    return { success: false, error: { type: "Upstream", message: "Network error" } };
  }
}
