"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import type { CourseTest, GradingQueueItem, TestQuestion, TestStats } from "./types";

const unknownSchema = z.unknown();

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  return apiFetch(path, unknownSchema, { method: init?.method, body: init?.body === undefined ? undefined : JSON.stringify(init.body) }) as Promise<T>;
}

export async function listCourseTests(courseId: number) {
  return request<CourseTest[]>(`/api/v1/courses/${courseId}/tests`);
}

export async function getCourseTestStats(courseId: number) {
  return request<TestStats>(`/api/v1/courses/${courseId}/tests/stats`);
}

export async function getCourseTest(testId: number) {
  return request<CourseTest>(`/api/v1/tests/${testId}`);
}

export async function createCourseTest(courseId: number, title = "اختبار جديد") {
  return request<{ id: number; title: string; status: string }>(`/api/v1/courses/${courseId}/tests`, {
    method: "POST",
    body: { title, status: "draft", pass_percent: 60, grading_policy: "highest", placement: "standalone_item" },
  });
}

export async function updateCourseTest(testId: number, body: Partial<CourseTest>) {
  const result = await request<{ id: number; title: string; status: string }>(`/api/v1/tests/${testId}`, { method: "PATCH", body });
  revalidatePath("/courses");
  return result;
}

export async function addTestQuestion(testId: number, body: Omit<TestQuestion, "id"> & { save_to_bank?: boolean }) {
  return request<TestQuestion>(`/api/v1/tests/${testId}/questions`, { method: "POST", body });
}

export async function updateTestQuestion(questionId: number, body: Omit<TestQuestion, "id"> & { save_to_bank?: boolean }) {
  return request<TestQuestion>(`/api/v1/questions/${questionId}`, { method: "PATCH", body });
}

export async function deleteTestQuestion(questionId: number) {
  return request<void>(`/api/v1/questions/${questionId}`, { method: "DELETE" });
}

export async function reorderTestQuestions(testId: number, questionIds: number[]) {
  return request<{ question_ids: number[] }>(`/api/v1/tests/${testId}/questions/reorder`, { method: "POST", body: questionIds });
}

export async function publishCourseTest(testId: number) {
  return request<{ id: number; status: string }>(`/api/v1/tests/${testId}/publish`, { method: "POST" });
}

export async function getGradingQueue(testId?: number, status = "pending") {
  const query = new URLSearchParams({ status });
  if (testId) query.set("testId", String(testId));
  return request<GradingQueueItem[]>(`/api/v1/grading/queue?${query}`);
}

export async function getPendingGradingCount() {
  return request<{ count: number }>("/api/v1/grading/queue/count");
}

export async function gradeEssay(answerId: number, points: number, feedback: string) {
  return request<{ attempt_id: number; status: string; score_total: number | null; max_score: number; percent: number | null; passed: boolean | null }>(`/api/v1/attempt-answers/${answerId}/grade`, { method: "PUT", body: { points, feedback } });
}
