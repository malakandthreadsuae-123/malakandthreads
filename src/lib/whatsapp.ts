export function whatsappLink(number: string, message?: string) {
  const n = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function productInquiryMessage(p: { name: string; sku: string; url: string; size?: string | null; color?: string | null; price?: string }) {
  return [
    `Hello MALAKAND THREADS, I'm interested in this product:`,
    `${p.name} (SKU: ${p.sku})`,
    p.size ? `Size: ${p.size}` : null,
    p.color ? `Colour: ${p.color}` : null,
    p.price ? `Price: ${p.price}` : null,
    p.url,
  ]
    .filter(Boolean)
    .join("\n");
}

export function orderInquiryMessage(orderNumber: string) {
  return `Hello MALAKAND THREADS, I have a question about my order ${orderNumber}.`;
}
