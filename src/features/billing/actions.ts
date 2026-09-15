"use server"

import { headers } from "next/headers"
import { redirectToAuth } from "@/lib/auth/redirect"
import { apiFetch } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import {
  adminRecordTeacherPaymentRequestSchema,
  teacherPaymentLogSchema,
  type AdminRecordTeacherPaymentRequest,
} from "@/features/billing/schema"
import {
  getAdminTeacherPayments as getAdminTeacherPaymentsQuery,
  getTeacherPayments as getTeacherPaymentsQuery,
  type TeacherPaymentFilters,
} from "./queries"

async function redirectToSignIn(nextPath: string): Promise<never> {
  const requestHeaders = await headers()
  const locale = requestHeaders.get("Accept-Language")?.startsWith("en")
    ? "en"
    : "ar"
  return redirectToAuth(locale, nextPath)
}

export async function getTeacherPaymentsAction(
  filters: TeacherPaymentFilters
) {
  try {
    return await getTeacherPaymentsQuery(filters)
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn("/billing")
    }
    throw error
  }
}

export async function listAdminTeacherPaymentsAction(
  teacherProfileId: number,
  filters: TeacherPaymentFilters = {}
) {
  try {
    return await getAdminTeacherPaymentsQuery(teacherProfileId, filters)
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "Unauthorized"
    ) {
      await redirectToSignIn("/admin/teachers")
    }
    throw error
  }
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } }

export async function recordTeacherPaymentAction(
  teacherProfileId: number,
  input: unknown
): Promise<
  ActionResult<{ id: number; amount: number; note: string | null }>
> {
  try {
    const parsed: AdminRecordTeacherPaymentRequest =
      adminRecordTeacherPaymentRequestSchema.parse(input)
    const result = await apiFetch(
      endpoints.admin.teacherPayments(teacherProfileId),
      teacherPaymentLogSchema,
      {
        method: "POST",
        body: JSON.stringify(parsed),
      }
    )
    return {
      success: true,
      data: { id: result.id, amount: result.amount, note: result.note },
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "type" in err) {
      const apiErr = err as { type: string; message: string }
      if (apiErr.type === "Unauthorized") {
        await redirectToSignIn("/admin/teachers")
      }
      return { success: false, error: apiErr }
    }
    if (err instanceof Error) {
      return {
        success: false,
        error: { type: "Validation", message: err.message },
      }
    }
    return {
      success: false,
      error: { type: "Upstream", message: "Network error" },
    }
  }
}
