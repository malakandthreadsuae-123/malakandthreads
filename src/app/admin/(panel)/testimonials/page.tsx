import Link from "next/link";
import { BadgeCheck, ImagePlus, PenLine, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { FEEDBACK_TYPE_LABEL, feedbackDisplayName, feedbackImages } from "@/lib/feedback";
import { getFeedbackStats } from "@/lib/services/feedback";
import { formatDateTime } from "@/lib/utils";
import { AdminPagination, adminBtn, adminBtnOutline, adminInput, Card, NoAccess, PageHeader, StatTile } from "@/components/admin/ui";
import { ActionButton, DeleteButton } from "@/components/admin/forms";
import { Stars } from "@/components/ui/primitives";

export const metadata = { title: "Customer feedback" };

const PER_PAGE = 20;
const TABS = {
  all: { label: "All feedback", where: {} },
  pending: { label: "Pending", where: { status: "PENDING" } },
  published: { label: "Published", where: { status: "APPROVED", isActive: true } },
  screenshots: { label: "WhatsApp screenshots", where: { type: "WHATSAPP_SCREENSHOT" } },
  rejected: { label: "Rejected", where: { status: "REJECTED" } },
  samples: { label: "Samples", where: { type: "SAMPLE" } },
} satisfies Record<string, { label: string; where: Prisma.TestimonialWhereInput }>;
type TabKey = keyof typeof TABS;

const bulk = "/api/admin/testimonials/bulk";
const smallBtn = "inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium hover:border-charcoal disabled:opacity-50";
const goodBtn = "inline-flex items-center gap-1.5 rounded bg-charcoal px-3 py-1.5 text-[12.5px] font-medium text-ivory hover:bg-gold hover:text-charcoal disabled:opacity-50";

export default async function FeedbackAdminPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const tab: TabKey = sp.tab && sp.tab in TABS ? (sp.tab as TabKey) : "all";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);

  const search: Prisma.TestimonialWhereInput = q ? { OR: [{ name: { contains: q } }, { text: { contains: q } }, { title: { contains: q } }, { email: { contains: q } }, { location: { contains: q } }] } : {};
  const where: Prisma.TestimonialWhereInput = { AND: [TABS[tab].where, search] };

  const [rows, total, counts, stats, screenshots] = await Promise.all([
    prisma.testimonial.findMany({ where, orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.testimonial.count({ where }),
    Promise.all((Object.keys(TABS) as TabKey[]).map(async (k) => [k, await prisma.testimonial.count({ where: TABS[k].where })] as const)),
    getFeedbackStats(),
    prisma.testimonial.count({ where: { type: "WHATSAPP_SCREENSHOT", status: "APPROVED", isActive: true } }),
  ]);
  const count = Object.fromEntries(counts) as Record<TabKey, number>;
  const href = (t: TabKey) => `/admin/testimonials?${new URLSearchParams({ ...(t !== "all" ? { tab: t } : {}), ...(q ? { q } : {}) })}`;

  return (
    <div>
      <PageHeader
        title="Customer feedback"
        description="Reviews customers write on the website (with their photos) go live on the homepage instantly — unpublish or delete any review you don't want. Upload WhatsApp screenshots or type in genuine feedback yourself; everything published appears in the Customer Feedback section."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/testimonials/new?type=WHATSAPP_SCREENSHOT" className={adminBtn}>
              <ImagePlus className="h-4 w-4" aria-hidden /> Upload WhatsApp screenshot
            </Link>
            <Link href="/admin/testimonials/new?type=ADMIN_REVIEW" className={adminBtnOutline}>
              <PenLine className="h-4 w-4" aria-hidden /> Add review
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Waiting for approval" value={count.pending} tone={count.pending ? "warning" : undefined} hint={count.pending ? "Open the Pending tab" : "All caught up"} />
        <StatTile label="Published reviews" value={stats.count} hint="Shown on the website (samples not counted)" />
        <StatTile label="Average rating" value={stats.average != null ? `${stats.average.toFixed(1)} / 5` : "—"} hint={`From ${stats.rated} rated ${stats.rated === 1 ? "review" : "reviews"}`} />
        <StatTile label="WhatsApp screenshots live" value={screenshots} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2 text-[13px]" aria-label="Filter feedback">
          {(Object.keys(TABS) as TabKey[]).map((t) => (
            <Link key={t} href={href(t)} className={`rounded border px-3 py-1.5 ${tab === t ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal"}`} aria-current={tab === t ? "page" : undefined}>
              {TABS[t].label} <span className={tab === t ? "text-gold" : "text-muted"}>({count[t]})</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" action="/admin/testimonials">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <label htmlFor="fb-q" className="sr-only">Search feedback</label>
          <input id="fb-q" name="q" defaultValue={q} placeholder="Search name, text, email…" className={`${adminInput} w-56`} />
          <button className={adminBtnOutline} aria-label="Search">
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>

      {tab === "samples" && count.samples > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-sand px-4 py-3 text-[13px]">
          <span>Sample reviews are labelled “Sample review” on the website and never count towards your rating. Remove them once real feedback starts coming in.</span>
          <ActionButton endpoint={bulk} method="POST" body={{ action: "delete_samples" }} label="Delete all sample reviews" confirmText={`Delete all ${count.samples} sample reviews? This cannot be undone.`} className="inline-flex items-center gap-1.5 rounded border border-danger/40 bg-white px-3 py-2 text-[13px] text-danger hover:bg-danger hover:text-white" />
        </div>
      )}

      <div className="space-y-3">
        {!rows.length && <p className="rounded border border-dashed border-line bg-white px-4 py-10 text-center text-muted">{q ? `No feedback matches “${q}”.` : `Nothing in “${TABS[tab].label}” yet.`}</p>}
        {rows.map((t) => {
          const images = feedbackImages(t.images);
          const live = t.status === "APPROVED" && t.isActive;
          const one = { ids: [t.id] };
          return (
            <Card key={t.id}>
              <div className="flex flex-col gap-4 md:flex-row">
                {images.length > 0 && (
                  <Link href={`/admin/testimonials/${t.id}`} className="relative block h-28 w-24 shrink-0 overflow-hidden rounded border border-line bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0]} alt="" className="h-full w-full object-cover object-top" />
                    {images.length > 1 && <span className="absolute bottom-1 right-1 rounded bg-charcoal/85 px-1.5 text-[10px] text-ivory">+{images.length - 1}</span>}
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`rounded-full px-2.5 py-0.5 font-medium ${t.status === "PENDING" ? "bg-amber-100 text-amber-800" : t.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {t.status === "PENDING" ? "Pending approval" : t.status === "REJECTED" ? "Rejected" : "Approved"}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 font-medium ${live ? "bg-charcoal text-gold" : "bg-sand text-muted"}`}>{live ? "Live on website" : "Not published"}</span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-muted">{FEEDBACK_TYPE_LABEL[t.type]}</span>
                    {t.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified purchase
                      </span>
                    )}
                    {!t.permissionConfirmed && t.type !== "CUSTOMER_TEXT" && <span className="text-amber-700">Permission not confirmed</span>}
                  </div>
                  <p className="mt-2 font-medium">
                    <Link href={`/admin/testimonials/${t.id}`} className="hover:underline">{feedbackDisplayName(t)}</Link>
                    {t.location && <span className="font-normal text-muted"> · {t.location}</span>}
                  </p>
                  {t.rating ? <Stars rating={t.rating} className="mt-1" /> : null}
                  {t.title && <p className="mt-1.5 font-medium">{t.title}</p>}
                  {t.text && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13.5px] text-charcoal/85">{t.text}</p>}
                  <p className="mt-2 text-[11.5px] text-muted">
                    Submitted {formatDateTime(t.createdAt)}
                    {t.updatedAt.getTime() - t.createdAt.getTime() > 60_000 ? ` · updated ${formatDateTime(t.updatedAt)}` : ""}
                    {t.email ? ` · ${t.email} (private)` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap content-start gap-2 md:w-56 md:justify-end">
                  {t.status !== "APPROVED" && <ActionButton endpoint={bulk} method="POST" body={{ action: "approve", ...one }} label="Approve & publish" className={goodBtn} />}
                  {t.status === "APPROVED" && !t.isActive && <ActionButton endpoint={bulk} method="POST" body={{ action: "publish", ...one }} label="Publish" className={goodBtn} />}
                  {live && <ActionButton endpoint={bulk} method="POST" body={{ action: "unpublish", ...one }} label="Unpublish" className={smallBtn} />}
                  {t.status !== "REJECTED" && t.type === "CUSTOMER_TEXT" && <ActionButton endpoint={bulk} method="POST" body={{ action: "reject", ...one }} label="Reject" className={smallBtn} confirmText="Reject this review? It will not be shown on the website." />}
                  <Link href={`/admin/testimonials/${t.id}`} className={smallBtn}>Edit</Link>
                  <DeleteButton endpoint={`/api/admin/testimonials/${t.id}`} confirmText={`Delete this feedback from ${feedbackDisplayName(t)}${images.length ? " and its screenshots" : ""}? This cannot be undone.`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <AdminPagination basePath="/admin/testimonials" params={{ tab: tab !== "all" ? tab : undefined, q: q || undefined }} page={page} totalPages={Math.ceil(total / PER_PAGE)} />
    </div>
  );
}
