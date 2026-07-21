import { z } from "zod";

export const apiErrorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Unauthorized"),
    status: z.literal(401),
    message: z.string(),
    requestId: z.string().optional(),
  }),
  z.object({
    type: z.literal("Forbidden"),
    status: z.literal(403),
    message: z.string(),
    requestId: z.string().optional(),
  }),
  z.object({
    type: z.literal("NotFound"),
    status: z.literal(404),
    message: z.string(),
    requestId: z.string().optional(),
  }),
  z.object({
    type: z.literal("Validation"),
    status: z.literal(422),
    message: z.string(),
    requestId: z.string().optional(),
    fields: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal("RateLimited"),
    status: z.literal(429),
    message: z.string(),
    requestId: z.string().optional(),
    retryAfter: z.number().optional(),
  }),
  z.object({
    type: z.literal("Conflict"),
    status: z.literal(409),
    message: z.string(),
    requestId: z.string().optional(),
  }),
  z.object({
    type: z.literal("Upstream"),
    status: z.number(),
    message: z.string(),
    requestId: z.string().optional(),
    cause: z.enum(["timeout", "network", "5xx"]).optional(),
  }),
]);

export type ApiError = z.infer<typeof apiErrorSchema>;

export class ApiErrorImpl extends Error {
  readonly type: ApiError["type"];
  readonly status: number;
  readonly message: string;
  readonly requestId?: string;
  readonly retryAfter?: number;
  readonly fields?: string[];
  readonly causeTag?: "timeout" | "network" | "5xx";

  constructor(err: ApiError) {
    super(err.message);
    this.name = `ApiError:${err.type}`;
    this.type = err.type;
    this.status = err.status;
    this.message = err.message;
    this.requestId = err.requestId;
    if ("retryAfter" in err) this.retryAfter = err.retryAfter;
    if ("fields" in err) this.fields = err.fields;
    if ("cause" in err) this.causeTag = err.cause;
  }
}

export async function toApiError(res: Response): Promise<ApiErrorImpl> {
  const requestId = res.headers.get("X-Request-ID") ?? undefined;
  const retryAfterHeader = res.headers.get("Retry-After");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  let message = `HTTP ${res.status}`;
  let fields: string[] | undefined;

  try {
    const body = await res.json();
    if (body?.detail) {
      if (Array.isArray(body.detail)) {
        message = body.detail.map((d: { msg?: string }) => d.msg).join("; ");
        fields = body.detail
          .map((d: { loc?: string[] }) => (d.loc ? d.loc.join(".") : ""))
          .filter(Boolean);
      } else if (typeof body.detail === "string") {
        message = body.detail;
      }
    }
  } catch {
    // body may be empty for 204 or non-JSON
  }

  let err: ApiError;
  switch (res.status) {
    case 401:
      err = { type: "Unauthorized", status: 401, message, requestId };
      break;
    case 403:
      err = { type: "Forbidden", status: 403, message, requestId };
      break;
    case 404:
      err = { type: "NotFound", status: 404, message, requestId };
      break;
    case 422:
      err = { type: "Validation", status: 422, message, requestId, fields };
      break;
    case 429:
      err = { type: "RateLimited", status: 429, message, requestId, retryAfter };
      break;
    case 409:
      err = { type: "Conflict", status: 409, message, requestId };
      break;
    default:
      err = {
        type: "Upstream",
        status: res.status,
        message,
        requestId,
        cause: res.status >= 500 ? "5xx" : "network",
      };
      break;
  }

  return new ApiErrorImpl(err);
}