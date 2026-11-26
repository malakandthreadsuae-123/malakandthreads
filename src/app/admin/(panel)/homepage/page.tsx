import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { adminBtn, Card, NoAccess, PageHeader, StatusBadge } from "@/components/admin/ui";
import { SectionEditor } from "@/components/admin/section-editor";

export const metadata = { title: "Homepage" };

export default async function HomepageAdmin() {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const [sections, banners, categories] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="Homepage" description="Turn sections on/off, reorder them and edit their headings. Changes appear on the live homepage immediately." actions={<a href="/" target="_blank" rel="noopener" className="text-[13px] underline">View homepage</a>} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Sections">
          <ul className="space-y-2">
            {sections.map((s) => (
              <SectionEditor key={s.key} section={{ key: s.key, title: s.title, subtitle: s.subtitle, isEnabled: s.isEnabled, sortOrder: s.sortOrder, config: s.config as never }} categories={categories} />
            ))}
          </ul>
        </Card>
        <Card title="Banners (hero, promotions, seasonal)" actions={<Link href="/admin/banners/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> New</Link>}>
          <ul className="space-y-3">
            {banners.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/banners/${b.id}`} className="flex items-center gap-3 rounded border border-line p-2 hover:border-charcoal">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-sand">{b.imageUrl && <Image src={b.imageUrl} alt="" fill sizes="80px" className="object-cover" unoptimized={!b.imageUrl.startsWith("/")} />}</div>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{b.placement}{b.videoUrl ? " · video" : ""}</p>
                    <p className="truncate font-medium">{b.title}</p>
                  </div>
                  <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
