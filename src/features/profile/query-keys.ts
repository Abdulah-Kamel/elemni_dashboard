export const profileKeys = {
  all: ["profile"] as const,
  me: ["profile", "me"] as const,
  public: (slug: string) => ["profile", "public", slug] as const,
} as const
