export type ActionError = {
  type: string
  message: string
  fields?: string[]
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }

export function getActionError(error: unknown): ActionError | null {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error &&
    typeof error.type === "string" &&
    typeof error.message === "string"
  ) {
    return {
      type: error.type,
      message: error.message,
      fields:
        "fields" in error && Array.isArray(error.fields)
          ? error.fields.filter(
              (field): field is string => typeof field === "string"
            )
          : undefined,
    }
  }

  return null
}

/**
 * Server actions in this codebase return a discriminated result instead of
 * throwing. TanStack Query needs rejected promises to enter its error state,
 * so unwrap the result at the query/mutation boundary.
 */
export function unwrapActionResult<T>(result: ActionResult<T>): T {
  if (result.success) return result.data

  const error = new Error(result.error.message)
  Object.assign(error, result.error)
  throw error
}
