import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/primitives";
import { TrackOrderForm } from "./track-form";

export const metadata = buildMetadata({
  title: "Track Your Order",
  description: "Track your MALAKAND THREADS order with your order number and email address.",
  path: "/track-order",
});

export default function TrackOrderPage() {
  return (
    <div className="container-luxe max-w-xl pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Track Order", path: "/track-order" }]} />
      <header className="py-12 text-center">
        <p className="eyebrow mb-3">Order Status</p>
        <h1 className="text-4xl">Track your order</h1>
        <p className="mt-3 text-[15px] text-muted">Enter the order number from your confirmation email (e.g. MT-251126-ABCDE) and the email you used at checkout.</p>
      </header>
      <TrackOrderForm />
    </div>
  );
}
