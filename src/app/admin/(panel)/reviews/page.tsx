import Link from "next/link";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, NoAccess, PageHeader, StatusBadge } from "@/components/admin/ui";
import { ActionButton, DeleteButton } from "@/components/admin/forms";
import { Stars } from "@/components/ui/primitives";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.REVIEWS_WRITE);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const status = sp.status === "APPROVED" || sp.status === "REJECTED" ? sp.status : "PENDING";
  const reviews = await prisma.review.findMany({ where: { status }, include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <PageHeader title="Reviews" description="Only approved reviews appear on product pages and in Google rich results. Never edit or invent reviews." />
      <nav className="mb-4 flex gap-2 text-[13px]">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} className={`rounded border px-3 py-1.5 ${status === s ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>{s.toLowerCase()}</Link>
        ))}
      </nav>
      <div className="space-y-3">
        {!reviews.length && <p className="text-muted">No {status.toLowerCase()} reviews.</p>}
        {reviews.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><Stars rating={r.rating} /> <StatusBadge status={r.status} /> {r.isVerifiedPurchase && <span className="text-[11px] text-success">Verified purchase</span>}</div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 whitespace-pre-wrap text-[14px]">{r.body}</p>
                <p className="mt-2 text-[12px] text-muted">{r.user.name} ({r.user.email}) on <a href={`/product/${r.product.slug}`} target="_blank" rel="noopener" className="underline">{r.product.name}</a> · {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                {r.status !== "APPROVED" && <ActionButton endpoint={`/api/admin/reviews/${r.id}`} body={{ status: "APPROVED" }} label="Approve" />}
                {r.status !== "REJECTED" && <ActionButton endpoint={`/api/admin/reviews/${r.id}`} body={{ status: "REJECTED" }} label="Reject" />}
                <DeleteButton endpoint={`/api/admin/reviews/${r.id}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
