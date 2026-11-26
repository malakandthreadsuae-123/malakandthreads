import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getPage } from "@/lib/services/content";
import { buildMetadata, webPageLd } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import { Breadcrumbs, JsonLd } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactForm } from "./contact-form";

export async function generateMetadata() {
  const page = await getPage("contact");
  return buildMetadata({
    title: page?.seoTitle || "Contact MALAKAND THREADS – WhatsApp, Phone & Email",
    description: page?.seoDescription || "Contact MALAKAND THREADS in the UAE by WhatsApp, phone or email for help with orders, sizing and styling.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [s, page] = await Promise.all([getSettings(), getPage("contact")]);
  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <header className="mx-auto max-w-2xl py-12 text-center">
        <p className="eyebrow mb-3">Customer Care</p>
        <h1 className="text-4xl sm:text-5xl">Contact us</h1>
        <p className="mt-4 text-[15px] text-muted">{page?.content || "We are happy to help with sizing, styling, orders and delivery."}</p>
      </header>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <a href={whatsappLink(s.whatsappNumber, s.whatsappWelcomeMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 border border-line bg-white p-6 hover:border-[#1f8f4e]">
            <WhatsAppIcon className="h-7 w-7 text-[#1f8f4e]" />
            <div>
              <p className="font-medium">WhatsApp (fastest)</p>
              <p className="text-[14px] text-muted">{s.contactPhone}</p>
            </div>
          </a>
          <a href={`tel:${s.contactPhone}`} className="flex items-center gap-4 border border-line bg-white p-6 hover:border-charcoal">
            <Phone className="h-6 w-6 text-gold-dark" aria-hidden />
            <div>
              <p className="font-medium">Call us</p>
              <p className="text-[14px] text-muted">{s.contactPhone}</p>
            </div>
          </a>
          <a href={`mailto:${s.contactEmail}`} className="flex items-center gap-4 border border-line bg-white p-6 hover:border-charcoal">
            <Mail className="h-6 w-6 text-gold-dark" aria-hidden />
            <div className="min-w-0">
              <p className="font-medium">Email</p>
              <p className="break-all text-[14px] text-muted">{s.contactEmail}</p>
            </div>
          </a>
          {s.businessHours && (
            <div className="flex items-center gap-4 border border-line bg-white p-6">
              <Clock className="h-6 w-6 text-gold-dark" aria-hidden />
              <div>
                <p className="font-medium">Hours</p>
                <p className="text-[14px] text-muted">{s.businessHours}</p>
              </div>
            </div>
          )}
          {s.businessAddress && (
            <div className="flex items-center gap-4 border border-line bg-white p-6">
              <MapPin className="h-6 w-6 text-gold-dark" aria-hidden />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-[14px] text-muted">{s.businessAddress}</p>
              </div>
            </div>
          )}
          {s.whatsappChannelUrl && (
            <a href={s.whatsappChannelUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
              <WhatsAppIcon className="h-4 w-4" /> Follow our WhatsApp Channel
            </a>
          )}
        </div>
        <ContactForm />
      </div>
      <JsonLd data={{ ...webPageLd("Contact MALAKAND THREADS", "/contact", "Contact details for MALAKAND THREADS"), "@type": "ContactPage" }} />
    </div>
  );
}
