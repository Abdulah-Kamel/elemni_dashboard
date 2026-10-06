import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiErrorImpl } from "@/lib/api/errors"

const m = vi.hoisted(() => ({ apiFetch: vi.fn(), listLessons: vi.fn(), listItems: vi.fn(), redirect: vi.fn(), revalidateTag: vi.fn(), headers: vi.fn() }))
vi.mock("@/lib/api/client", () => ({ apiFetch: m.apiFetch }))
vi.mock("@/features/course-management/lessons-queries", () => ({ listLessons: m.listLessons }))
vi.mock("@/features/course-management/items-queries", () => ({ listItems: m.listItems }))
vi.mock("@/lib/auth/redirect", () => ({ redirectToAuth: m.redirect }))
vi.mock("next/headers", () => ({ headers: m.headers }))
vi.mock("next/cache", () => ({ revalidateTag: m.revalidateTag }))
vi.mock("@/lib/logger", () => ({ logger: { action: vi.fn(), actionDone: vi.fn(), actionError: vi.fn() } }))

import { createGrant, listCourseVideos, listStudentGrants, revokeGrant } from "./actions"

const err = (type: string, status: number, message: string) => new ApiErrorImpl({ type, status, message } as never)

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset())
  m.headers.mockResolvedValue(new Headers())
})

describe("video grant actions", () => {
  it("sends the Idempotency-Key header and the exact body", async () => {
    m.apiFetch.mockResolvedValue({})
    await createGrant({ user_id: 5, item_id: 319, granted_views: 2, reason: "lost views" }, "key-1")
    expect(m.apiFetch).toHaveBeenCalledWith("/api/v1/video-analytics/grants", expect.anything(), expect.objectContaining({
      method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "key-1" }),
      refreshOnUnauthorized: false,
      body: JSON.stringify({ user_id: 5, item_id: 319, granted_views: 2, reason: "lost views" }) }))
    expect(m.apiFetch).toHaveBeenCalledTimes(1)
    expect(m.revalidateTag).toHaveBeenCalledWith("grants:5", "default")
  })
  it("maps the enrolment error", async () => {
    m.apiFetch.mockRejectedValue(err("Upstream", 400, "Grant target is not actively enrolled"))
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).toEqual({ success: false, code: "not_enrolled" })
  })
  it.each([
    [err("Upstream", 400, "Grant target is not an active student"), "not_enrolled"],
    [err("Upstream", 400, "Invalid grant"), "invalid"],
    [err("Forbidden", 403, "Not authorized to grant access to this video"), "not_owner"],
    [err("NotFound", 404, "Video not found"), "not_found"],
    [err("Conflict", 409, "Idempotency key reused with different payload"), "conflict"],
    [err("Validation", 422, "granted_views must be <= 1000"), "invalid"],
    [new Error("boom"), "unknown"],
  ])("maps %s", async (e, code) => {
    m.apiFetch.mockRejectedValue(e)
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).toEqual({ success: false, code })
  })
  it("lists a student's grants and revokes one", async () => {
    m.apiFetch.mockResolvedValueOnce([]).mockResolvedValueOnce({ status: "revoked" })
    expect(await listStudentGrants(5)).toEqual({ success: true, data: [] })
    expect(m.apiFetch.mock.calls[0][0]).toBe("/api/v1/video-analytics/grants?user_id=5")
    expect(m.apiFetch.mock.calls[0][2]).toEqual({ tags: ["grants:5"] })
    expect(await revokeGrant(9, 5)).toEqual({ success: true, data: null })
    expect(m.apiFetch.mock.calls[1][0]).toBe("/api/v1/video-analytics/grants/9")
    expect(m.apiFetch.mock.calls[1][2]).toMatchObject({ method: "DELETE" })
    expect(m.revalidateTag).toHaveBeenCalledWith("grants:5", "default")
  })
  it("lists only video items, lesson then item order", async () => {
    m.listLessons.mockResolvedValue([{ id: 2, title: "B", order: 2 }, { id: 1, title: "A", order: 1 }])
    m.listItems.mockImplementation(async (_c: number, lessonId: number) => lessonId === 1
      ? [{ id: 13, title: "v3", bunny_stream_id: "j", order: 3, max_watch_count: 1 }, { id: 11, title: "doc", bunny_stream_id: null, order: 1, max_watch_count: null }, { id: 12, title: "v1", bunny_stream_id: "g", order: 2, max_watch_count: 3 }]
      : [{ id: 21, title: "v2", bunny_stream_id: "h", order: 1, max_watch_count: null }])
    expect(await listCourseVideos(57)).toEqual({ success: true, data: [
      { item_id: 12, title: "v1", lesson_title: "A", max_watch_count: 3 },
      { item_id: 13, title: "v3", lesson_title: "A", max_watch_count: 1 },
      { item_id: 21, title: "v2", lesson_title: "B", max_watch_count: null } ] })
  })
  it.each(["ar", "en"])("redirects to sign-in on Unauthorized with locale %s", async (locale) => {
    m.headers.mockResolvedValue(new Headers({ "Accept-Language": locale }))
    m.apiFetch.mockRejectedValue(err("Unauthorized", 401, "expired"))
    await listStudentGrants(5)
    expect(m.redirect).toHaveBeenCalledWith(locale, "/students")
  })

  it.each([0, 1001, 1.5])("rejects invalid views %s before calling the API", async (granted_views) => {
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views }, "k")).toEqual({ success: false, code: "invalid" })
    expect(m.apiFetch).not.toHaveBeenCalled()
    expect(m.revalidateTag).not.toHaveBeenCalled()
  })

  it("sends the parsed, trimmed reason and returns the created grant", async () => {
    m.apiFetch.mockResolvedValue({ id: 9 })
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1, reason: "  lost views  " }, "k")).toEqual({ success: true, data: { id: 9 } })
    expect(JSON.parse(m.apiFetch.mock.calls[0][2].body)).toEqual({ user_id: 5, item_id: 319, granted_views: 1, reason: "lost views" })
  })

  it("does not retry or invalidate after a failed grant", async () => {
    m.apiFetch.mockRejectedValue(new Error("network"))
    expect(await createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).toEqual({ success: false, code: "unknown" })
    expect(m.apiFetch).toHaveBeenCalledTimes(1)
    expect(m.revalidateTag).not.toHaveBeenCalled()
  })

  it("maps list, revoke and course query failures", async () => {
    m.apiFetch.mockRejectedValue(err("NotFound", 404, "Grant not found"))
    expect(await listStudentGrants(5)).toEqual({ success: false, code: "not_found" })
    expect(await revokeGrant(9, 5)).toEqual({ success: false, code: "not_found" })
    expect(m.revalidateTag).not.toHaveBeenCalled()
    m.listLessons.mockRejectedValue(err("Forbidden", 403, "Forbidden"))
    expect(await listCourseVideos(57)).toEqual({ success: false, code: "not_owner" })
    m.listLessons.mockResolvedValue([{ id: 1, title: "A", order: 1 }])
    m.listItems.mockRejectedValue(new Error("network"))
    expect(await listCourseVideos(57)).toEqual({ success: false, code: "unknown" })
  })

  it("preserves Unauthorized redirects thrown by the auth helper", async () => {
    const redirectError = new Error("NEXT_REDIRECT")
    m.redirect.mockRejectedValue(redirectError)
    m.apiFetch.mockRejectedValue(err("Unauthorized", 401, "expired"))
    await expect(createGrant({ user_id: 5, item_id: 319, granted_views: 1 }, "k")).rejects.toBe(redirectError)
    await expect(revokeGrant(9, 5)).rejects.toBe(redirectError)
    m.listLessons.mockRejectedValue(err("Unauthorized", 401, "expired"))
    await expect(listCourseVideos(57)).rejects.toBe(redirectError)
  })
})
