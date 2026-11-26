export const BRAND_NAME = "MALAKAND THREADS";
export const PRODUCTION_URL = "https://malakandthreadsuae.com";
export const CONTACT_EMAIL = "malakantradesuae@gmail.com";
export const CONTACT_PHONE = "+971559912484";
export const WHATSAPP_NUMBER = "971559912484";

export const EMIRATES = [
  { value: "ABU_DHABI", label: "Abu Dhabi" },
  { value: "DUBAI", label: "Dubai" },
  { value: "SHARJAH", label: "Sharjah" },
  { value: "AJMAN", label: "Ajman" },
  { value: "UMM_AL_QUWAIN", label: "Umm Al Quwain" },
  { value: "RAS_AL_KHAIMAH", label: "Ras Al Khaimah" },
  { value: "FUJAIRAH", label: "Fujairah" },
] as const;

export type EmirateValue = (typeof EMIRATES)[number]["value"];
export const EMIRATE_VALUES = EMIRATES.map((e) => e.value) as [EmirateValue, ...EmirateValue[]];

export function emirateLabel(v: string): string {
  return EMIRATES.find((e) => e.value === v)?.label ?? v;
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  STRIPE: "Card payment (online)",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Sellers" },
  { value: "popular", label: "Popularity" },
  { value: "featured", label: "Featured" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;
