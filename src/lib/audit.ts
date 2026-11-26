import "server-only";
import { prisma } from "./db";
import { requestMeta } from "./auth/session";

export async function audit(userId: string | null, action: string, entity: string, entityId?: string | null, details?: Record<string, unknown>) {
  try {
    const meta = await requestMeta().catch(() => ({ ip: null as string | null }));
    await prisma.adminAuditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ip: meta.ip,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log", e);
  }
}
