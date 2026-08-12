import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "next/navigation",
        replacement: path.resolve(__dirname, "node_modules/next/navigation.js"),
      },
      {
        find: "@/lib/utils",
        replacement: path.resolve(__dirname, "lib/utils.ts"),
      },
      {
        find: "server-only",
        replacement: path.resolve(__dirname, "tests/mocks/empty.ts"),
      },
      {
        find: "@/tests",
        replacement: path.resolve(__dirname, "tests"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    env: {
      API_URL: "http://localhost:3000",
      SESSION_SECRET: "test-session-secret-at-least-32-characters",
      NODE_ENV: "test",
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
})
