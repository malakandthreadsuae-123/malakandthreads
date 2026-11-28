import { notFound } from "next/navigation";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { feedbackDisplayName, feedbackImages, type FeedbackTypeKey } from "@/lib/feedback";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/forms";
import { FeedbackEditor, type FeedbackFormValues } from "@/components/admin/feedback-editor";

export const metadata = { title: "Customer feedback" };

export default async function FeedbackEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const t = isNew ? null : await prisma.testimonial.findUnique({ where: { id } });
  if (!isNew && !t) notFound();

  const newType: FeedbackTypeKey = sp.type === "ADMIN_REVIEW" || sp.type === "SAMPLE" ? sp.type : "WHATSAPP_SCREENSHOT";
  const initial: FeedbackFormValues = t
    ? {
        type: t.type,
        name: t.name,
        location: t.location ?? "",
        title: t.title ?? "",
        text: t.text,
        rating: t.rating,
        images: feedbackImages(t.images),
        avatar: t.avatar ?? "",
        isVerifiedPurchase: t.isVerifiedPurchase,
        permissionConfirmed: t.permissionConfirmed,
        status: t.status,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
      }
    : { type: newType, name: "", location: "", title: "", text: "", rating: null, images: [], avatar: "", isVerifiedPurchase: false, permissionConfirmed: false, status: "APPROVED", isActive: false, sortOrder: 0 };

  return (
    <div>
      <PageHeader
        title={t ? feedbackDisplayName(t) : newType === "WHATSAPP_SCREENSHOT" ? "Upload WhatsApp feedback" : "Add review"}
        description={isNew ? "Only publish genuine feedback you have permission to share. Screenshots are shown exactly as uploaded — use “Hide info” to cover phone numbers first." : undefined}
        back={{ href: "/admin/testimonials", label: "Customer feedback" }}
        actions={t ? <DeleteButton endpoint={`/api/admin/testimonials/${t.id}`} redirectTo="/admin/testimonials" confirmText="Delete this feedback and its screenshots? This cannot be undone." /> : undefined}
      />
      <FeedbackEditor id={t?.id} initial={initial} createdAt={t?.createdAt.toISOString()} email={t?.email} />
    </div>
  );
}
