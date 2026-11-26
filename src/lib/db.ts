// Note: no "server-only" import here because the proxy (non-RSC server context) also uses this module.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";

/**
 * Prisma client singleton (Prisma 7 + MariaDB/MySQL driver adapter — pure JS, no native engine).
 * DATABASE_URL uses the mysql:// scheme for the Prisma CLI; the mariadb driver expects mariadb://.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaMariaDb(toDriverUrl(url));
  return new PrismaClient({ adapter });
}

export function toDriverUrl(url: string) {
  const u = new URL(url.replace(/^mysql:/, "mariadb:"));
  if (!u.searchParams.has("connectionLimit")) u.searchParams.set("connectionLimit", "10");
  // MySQL 8 servers using caching_sha2_password over non-TLS local sockets need this
  if (!u.searchParams.has("allowPublicKeyRetrieval")) u.searchParams.set("allowPublicKeyRetrieval", "true");
  return u.toString();
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Either the root client or an interactive-transaction client. */
export type Tx = Prisma.TransactionClient | PrismaClient;
