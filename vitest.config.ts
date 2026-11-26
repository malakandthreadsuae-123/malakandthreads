import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/helpers/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/helpers/setup-env.ts"],
    globalSetup: ["tests/helpers/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false, // integration tests share one test database
  },
});
