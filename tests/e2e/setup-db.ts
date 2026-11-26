/**
 * Prepares the TEST database for end-to-end tests:
 * applies migrations (non-destructive), seeds catalogue data and creates a QA admin.
 * Run by Playwright's global setup — never against the development or production database.
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../../src/generated/prisma/client";

const url = process.env.TEST_DATABASE_URL!;
if (!url || !/test/i.test(new URL(url).pathname)) throw new Error("TEST_DATABASE_URL must point to a *test* database");
const env = { ...process.env, DATABASE_URL: url };
execSync("npx prisma migrate deploy", { stdio: "inherit", env });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });

const u = new URL(url.replace(/^mysql:/, "mariadb:"));
u.searchParams.set("allowPublicKeyRetrieval", "true");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(u.toString()) });
const email = "e2e-admin@example.test";
const password = process.env.E2E_ADMIN_PASSWORD!;
(async () => {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "E2E Admin", passwordHash, roleId: role.id, emailVerifiedAt: new Date(), mustChangePassword: false },
    update: { passwordHash, mustChangePassword: false, isActive: true, failedLoginCount: 0, lockedUntil: null },
  });
  // keep demo stock topped up so repeated runs can always check out
  await prisma.productVariant.updateMany({ where: { product: { isDemo: true } }, data: { stock: 25 } });
  await prisma.$disconnect();
})();
