const isDev = process.env.NODE_ENV !== "production";

function ts(): string {
  return new Date().toISOString();
}

function trunc(v: unknown, max = 500): unknown {
  if (typeof v === "string") return v.length > max ? v.slice(0, max) + "..." : v;
  if (typeof v === "object" && v !== null) {
    const s = JSON.stringify(v);
    return s.length > max ? JSON.stringify(v, null, 2).slice(0, max) + "..." : s;
  }
  return v;
}

export const logger = {
  action(name: string, meta?: Record<string, unknown>) {
    if (!isDev) return;
    console.log(`[action:${name}]`, ts(), meta ? trunc(meta) : "");
  },

  actionDone(name: string, result?: unknown, durationMs?: number) {
    if (!isDev) return;
    console.log(`[action:${name}:done]`, ts(), `(${durationMs}ms)`, result !== undefined ? trunc(result) : "");
  },

  actionError(name: string, error: unknown, durationMs?: number) {
    if (!isDev) return;
    console.error(`[action:${name}:error]`, ts(), `(${durationMs}ms)`, trunc(error));
  },

  api(method: string, path: string, requestId: string, meta?: Record<string, unknown>) {
    if (!isDev) return;
    console.log(`[api]`, ts(), method, path, `rid=${requestId}`, meta ? trunc(meta) : "");
  },

  apiOk(method: string, path: string, requestId: string, status: number, durationMs: number, data?: unknown) {
    if (!isDev) return;
    console.log(`[api:ok]`, ts(), method, path, status, `rid=${requestId}`, `(${durationMs}ms)`, data !== undefined ? trunc(data) : "");
  },

  apiError(method: string, path: string, requestId: string, status: number, durationMs: number, error?: unknown) {
    if (!isDev) return;
    console.error(`[api:error]`, ts(), method, path, status, `rid=${requestId}`, `(${durationMs}ms)`, error ? trunc(error) : "");
  },

  warn(msg: string, meta?: unknown) {
    if (!isDev) return;
    console.warn(`[warn]`, ts(), msg, meta ? trunc(meta) : "");
  },

  error(msg: string, error?: unknown) {
    console.error(`[error]`, ts(), msg, error ? trunc(error) : "");
  },
};
