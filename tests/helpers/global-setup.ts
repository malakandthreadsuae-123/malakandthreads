import { execSync } from "node:child_process";
import "dotenv/config";

/**
 * Applies the project migrations to the TEST database (non-destructive `migrate deploy`).
 * Tests create uniquely-named fixtures, so they do not require an empty database.
 * To wipe the test database manually: DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate reset
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL must be set");
  if (!/test/i.test(new URL(url).pathname)) throw new Error("Refusing to use a database whose name does not contain 'test'");
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } });
}
