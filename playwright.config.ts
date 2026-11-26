import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";
import "dotenv/config";

// Random QA admin password per run (only ever stored in the TEST database).
process.env.E2E_ADMIN_PASSWORD ||= `E2e-${randomBytes(9).toString("base64url")}9a`;
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile.spec.ts/ },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  // Production build served against the TEST database (run `npm run build` first).
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...(process.env as Record<string, string>), DATABASE_URL: process.env.TEST_DATABASE_URL!, NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});
