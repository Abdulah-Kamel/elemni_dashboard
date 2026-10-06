import { ApiErrorImpl } from "@/lib/api/errors"

export type GrantErrorCode = "not_enrolled" | "not_owner" | "not_found" | "conflict" | "invalid" | "unknown"

// Backend detail strings: elemni/src/video_analytics/service.py grant_video_exception.
export function mapGrantError(err: unknown): GrantErrorCode {
  if (!(err instanceof ApiErrorImpl)) return "unknown"
  if (err.status === 400 && /active(ly enrolled| student)/.test(err.message)) return "not_enrolled"
  if (err.type === "Forbidden") return "not_owner"
  if (err.type === "NotFound") return "not_found"
  if (err.type === "Conflict") return "conflict"
  if (err.type === "Validation" || err.status === 400) return "invalid"
  return "unknown"
}
