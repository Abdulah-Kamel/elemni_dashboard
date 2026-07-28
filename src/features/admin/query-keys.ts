export const adminKeys = {
  all: ["admin"] as const,
  teachers: ["admin", "teachers"] as const,
  taxonomy: (kind: string) => ["admin", kind] as const,
};
