/**
 * Create or reset a Super Admin account.
 *
 *   npm run admin:create                      → uses ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD from .env
 *   npm run admin:create -- email@x.com "Name" → password taken from ADMIN_INITIAL_PASSWORD
 *
 * The password is never printed. The account must change its password at next sign-in.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedRoles } from "../prisma/seed-lib";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const u = new URL(url.replace(/^mysql:/, "mariadb:"));
  u.searchParams.set("allowPublicKeyRetrieval", "true");
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(u.toString()) });
  try {
    const email = (process.argv[2] || process.env.ADMIN_INITIAL_EMAIL || "").toLowerCase().trim();
    const name = process.argv[3] || "Store Administrator";
    const password = process.env.ADMIN_INITIAL_PASSWORD || "";
    if (!email) throw new Error("Provide an email (argument or ADMIN_INITIAL_EMAIL)");
    if (password.length < 12) throw new Error("ADMIN_INITIAL_PASSWORD must be set and at least 12 characters");
    await seedRoles(prisma);
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
    const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, roleId: role.id, isActive: true, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      console.log(`✔ Reset ${email} as Super Admin (must change password at next sign-in).`);
    } else {
      await prisma.user.create({ data: { email, name, passwordHash, roleId: role.id, emailVerifiedAt: new Date(), mustChangePassword: true } });
      console.log(`✔ Created Super Admin ${email} (must change password at first sign-in).`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("✖", e instanceof Error ? e.message : e);
  process.exit(1);
});
