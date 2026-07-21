import { z } from "zod";

const envSchema = z.object({
  API_URL: z
    .string()
    .url("API_URL must be a valid URL")
    .refine((val) => !val.startsWith("NEXT_PUBLIC_"), {
      message: "API_URL must NOT be a NEXT_PUBLIC_ variable (Article IX)",
    }),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters (contracts/session.md)"),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

function loadEnv(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Environment variable validation failed (Article IX — app refuses to start):\n${errors}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();