export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  teachers: (params?: unknown) => ["admin", "teachers", params ?? {}] as const,
  teacher: (id: number) => ["admin", "teacher", id] as const,
  students: (params?: unknown) => ["admin", "students", params ?? {}] as const,
  subscriptions: (params?: unknown) => ["admin", "subscriptions", params ?? {}] as const,
  taxonomy: (kind: string) => ["admin", kind] as const,
};
