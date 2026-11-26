import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ActionButton, DeleteButton } from "@/components/admin/forms";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const admin = await pageAdmin(PERMISSIONS.CUSTOMERS_READ);
  if (!admin) return <NoAccess />;
  const msgs = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <PageHeader title="Contact messages" description={`${msgs.filter((m) => !m.isRead).length} unread`} />
      <div className="space-y-3">
        {!msgs.length && <p className="text-muted">No messages yet.</p>}
        {msgs.map((m) => (
          <Card key={m.id} className={m.isRead ? "opacity-75" : ""}>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="min-w-0 flex-1 text-[14px]">
                <p className="font-medium">{!m.isRead && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold" aria-label="Unread" />}{m.subject || "No subject"}</p>
                <p className="text-[12px] text-muted">{m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a>{m.phone ? ` · ${m.phone}` : ""} · {formatDateTime(m.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap">{m.message}</p>
              </div>
              <div className="flex gap-2">
                <ActionButton endpoint={`/api/admin/messages/${m.id}`} body={{ isRead: !m.isRead }} label={m.isRead ? "Mark unread" : "Mark read"} />
                <DeleteButton endpoint={`/api/admin/messages/${m.id}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
