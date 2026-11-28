import { z } from "zod";
import { EMIRATE_VALUES, ORDER_STATUSES } from "./constants";

// ── primitives ──
export const zEmail = z.string().trim().toLowerCase().max(191).email("Enter a valid email address");
export const zName = z.string().trim().min(2, "Please enter your name").max(120);
/** UAE mobile/landline. Accepts +971 5X XXX XXXX, 05X XXX XXXX, 9715XXXXXXXX; normalises to +9715XXXXXXXX */
export const zUaePhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^(?:\+?971|00971|0)?(?:5[0-9]{8}|[2-9][0-9]{7})$/.test(v), "Enter a valid UAE phone number")
  .transform((v) => "+971" + v.replace(/^(?:\+?971|00971|0)/, ""));
export const zPassword = z.string().min(10, "Password must be at least 10 characters").max(128);
export const zEmirate = z.enum(EMIRATE_VALUES);
export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");
const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
export const zOptStr = optStr;
/** URL or site-relative path. Rejects javascript:/data: URLs. */
export const zUrlOrPath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//i.test(v) || /^http:\/\/localhost/i.test(v), "Must be an https:// URL or a /path")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));
/** Money input in AED (e.g. 199.5) → integer fils */
export const zAedToFils = z.coerce
  .number()
  .min(0, "Must be zero or more")
  .max(10_000_000)
  .transform((n) => Math.round(n * 100));

// ── auth ──
export const registerSchema = z.object({
  name: zName,
  email: zEmail,
  phone: zUaePhone.optional().or(z.literal("").transform(() => undefined)),
  password: zPassword,
  marketingOptIn: z.boolean().optional().default(false),
});
export const loginSchema = z.object({ email: zEmail, password: z.string().min(1).max(128) });
export const forgotSchema = z.object({ email: zEmail });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: zPassword });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: zPassword });

// ── address / checkout ──
export const addressSchema = z.object({
  label: optStr(50),
  fullName: zName,
  phone: zUaePhone,
  emirate: zEmirate,
  city: z.string().trim().min(2, "City is required").max(100),
  area: z.string().trim().min(2, "Area is required").max(120),
  street: z.string().trim().min(2, "Street is required").max(160),
  building: z.string().trim().min(1, "Building / villa is required").max(160),
  apartment: optStr(60),
  landmark: optStr(160),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = z.object({
  email: zEmail,
  fullName: zName,
  phone: zUaePhone,
  emirate: zEmirate,
  city: z.string().trim().min(2, "City is required").max(100),
  area: z.string().trim().min(2, "Area is required").max(120),
  street: z.string().trim().min(2, "Street is required").max(160),
  building: z.string().trim().min(1, "Building / villa is required").max(160),
  apartment: optStr(60),
  landmark: optStr(160),
  deliveryInstructions: optStr(500),
  paymentMethod: z.enum(["COD", "STRIPE"]),
  couponCode: optStr(50),
  saveAddress: z.boolean().optional().default(false),
  acceptTerms: z.literal(true, { message: "Please accept the terms and conditions" }),
});

// ── cart ──
export const cartAddSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(20),
});
export const cartUpdateSchema = z.object({ quantity: z.coerce.number().int().min(0).max(20) });
export const couponApplySchema = z.object({ code: z.string().trim().toUpperCase().min(2).max(50) });

// ── catalogue query ──
export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(140).optional(),
  brand: z.string().max(500).optional(), // comma separated slugs
  size: z.string().max(200).optional(),
  color: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["1", "true"]).optional(),
  sale: z.enum(["1", "true"]).optional(),
  flag: z.enum(["new", "best", "featured", "trending", "sale"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "best_selling", "popular", "featured"]).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  pageSize: z.coerce.number().int().min(1).max(48).optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

// ── reviews / newsletter / contact ──
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: optStr(160),
  body: z.string().trim().min(10, "Please write at least 10 characters").max(3000),
});
export const newsletterSchema = z.object({ email: zEmail, source: z.string().max(60).optional() });
export const contactSchema = z.object({
  name: zName,
  email: zEmail,
  phone: z.string().trim().max(30).optional().nullable(),
  subject: optStr(200),
  message: z.string().trim().min(10, "Please write a little more detail").max(5000),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});

const NO_LINKS = /(https?:\/\/|www\.|\.(com|net|org|ru|xyz|info|top|io))/i;

/** Public "Write a review" form. Published straight away; admins can unpublish or delete any review. */
export const feedbackSchema = z.object({
  name: zName,
  location: optStr(120),
  email: zEmail.optional().or(z.literal("").transform(() => undefined)).transform((v) => v ?? null),
  rating: z.coerce.number({ message: "Please choose a rating" }).int().min(1, "Please choose a rating").max(5),
  text: z
    .string()
    .trim()
    .min(10, "Please write a little more (at least 10 characters)")
    .max(1000)
    .refine((v) => !NO_LINKS.test(v), "Please remove links from your feedback"),
  /** Photos the customer attached — only files uploaded through /api/feedback/upload. */
  images: z
    .array(z.string().regex(/^\/media\/\d{4}\/\d{2}\/[A-Za-z0-9_-]{8,40}\.webp$/, "Invalid photo"))
    .max(4, "You can attach up to 4 photos")
    .default([]),
  consent: z.literal(true, { message: "Please allow us to show your feedback" }),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});

/** Admin create/edit of a feedback entry (Admin → Customer feedback). */
export const feedbackAdminSchema = z
  .object({
    type: z.enum(["CUSTOMER_TEXT", "WHATSAPP_SCREENSHOT", "ADMIN_REVIEW", "SAMPLE"]),
    name: z.string().trim().max(120).default(""),
    location: optStr(120),
    title: optStr(160),
    text: z.string().trim().max(2000).default(""),
    rating: z.union([z.coerce.number().int().min(1).max(5), z.literal("").transform(() => null), z.null()]).optional().transform((v) => v ?? null),
    images: z.array(z.string().trim().max(500).refine((v) => v.startsWith("/") || /^https:\/\//i.test(v), "Invalid image URL")).max(10).default([]),
    avatar: zUrlOrPath,
    isVerifiedPurchase: z.boolean().default(false),
    permissionConfirmed: z.boolean().default(false),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    isActive: z.boolean().default(false),
    sortOrder: z.coerce.number().int().min(-1000).max(1000).default(0),
  })
  .superRefine((d, ctx) => {
    if (d.type === "WHATSAPP_SCREENSHOT" && !d.images.length) ctx.addIssue({ code: "custom", path: ["images"], message: "Upload at least one screenshot" });
    if (d.type !== "WHATSAPP_SCREENSHOT" && d.text.length < 5 && !d.images.length) ctx.addIssue({ code: "custom", path: ["text"], message: "Write the feedback text (at least 5 characters)" });
    if (d.type !== "WHATSAPP_SCREENSHOT" && !d.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter the customer's name" });
    if (d.isActive && d.status !== "APPROVED") ctx.addIssue({ code: "custom", path: ["isActive"], message: "Approve this feedback before publishing it" });
    if (d.isActive && (d.type === "WHATSAPP_SCREENSHOT" || d.type === "ADMIN_REVIEW") && !d.permissionConfirmed)
      ctx.addIssue({ code: "custom", path: ["permissionConfirmed"], message: "Confirm you have the customer's permission before publishing" });
  });

// ── admin: catalogue ──
export const variantInputSchema = z.object({
  id: z.string().max(40).optional(),
  sku: z.string().trim().min(1).max(100),
  size: optStr(40),
  color: optStr(60),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  priceOverride: zAedToFils.optional().nullable(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(3),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: zSlug.optional().or(z.literal("").transform(() => undefined)),
    sku: z.string().trim().min(1).max(80),
    shortDescription: optStr(500),
    description: z.string().max(20000).optional().nullable(),
    brandId: z.string().max(40).optional().nullable().transform((v) => v || null),
    categoryId: z.string().max(40).optional().nullable().transform((v) => v || null),
    categoryIds: z.array(z.string().max(40)).max(20).default([]),
    regularPrice: zAedToFils,
    salePrice: zAedToFils.optional().nullable(),
    costPrice: zAedToFils.optional().nullable(),
    material: optStr(160),
    careInstructions: optStr(500),
    weightGrams: z.coerce.number().int().min(0).max(100000).optional().nullable(),
    videoUrl: zUrlOrPath,
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("ACTIVE"),
    isFeatured: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isOnSale: z.boolean().default(false),
    isTrending: z.boolean().default(false),
    isDemo: z.boolean().default(false),
    seoTitle: optStr(160),
    seoDescription: optStr(320),
    seoKeywords: optStr(255),
    images: z
      .array(z.object({ url: z.string().trim().min(1).max(500), alt: optStr(255) }))
      .max(15)
      .default([]),
    variants: z.array(variantInputSchema).min(1, "Add at least one variant (stock line)").max(100),
  })
  .refine((p) => p.salePrice == null || p.salePrice === 0 || p.salePrice < p.regularPrice, {
    message: "Sale price must be lower than the regular price",
    path: ["salePrice"],
  });
export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: zSlug.optional().or(z.literal("").transform(() => undefined)),
  description: z.string().max(5000).optional().nullable(),
  content: z.string().max(20000).optional().nullable(),
  image: zUrlOrPath,
  parentId: z.string().max(40).optional().nullable().transform((v) => v || null),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  seoTitle: optStr(160),
  seoDescription: optStr(320),
});

export const brandInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: zSlug.optional().or(z.literal("").transform(() => undefined)),
  logo: zUrlOrPath,
  image: zUrlOrPath,
  description: z.string().max(5000).optional().nullable(),
  content: z.string().max(20000).optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  seoTitle: optStr(160),
  seoDescription: optStr(320),
});

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, - and _ only"),
    description: optStr(255),
    type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().min(0).max(1_000_000),
    minSubtotal: zAedToFils.optional().nullable(),
    maxDiscount: zAedToFils.optional().nullable(),
    usageLimit: z.coerce.number().int().min(1).optional().nullable(),
    perCustomerLimit: z.coerce.number().int().min(1).optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "PERCENTAGE" || (c.value > 0 && c.value <= 100), {
    message: "Percentage must be between 1 and 100",
    path: ["value"],
  });

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: optStr(500),
  notifyCustomer: z.boolean().default(true),
  shipment: z
    .object({
      courier: optStr(100),
      trackingNumber: optStr(120),
      trackingUrl: zUrlOrPath,
      estimatedDelivery: optStr(120),
    })
    .optional(),
});

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1).max(40),
  mode: z.enum(["set", "delta"]),
  value: z.coerce.number().int().min(-1_000_000).max(1_000_000),
  note: optStr(255),
});

export const pageInputSchema = z.object({
  slug: zSlug,
  title: z.string().trim().min(2).max(200),
  content: z.string().max(200000),
  seoTitle: optStr(160),
  seoDescription: optStr(320),
  isPublished: z.boolean().default(true),
  showInFooter: z.boolean().default(true),
  needsReview: z.boolean().default(false),
});

export const blogInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: zSlug.optional().or(z.literal("").transform(() => undefined)),
  excerpt: optStr(500),
  content: z.string().max(200000),
  coverImage: zUrlOrPath,
  coverAlt: optStr(255),
  categoryId: z.string().max(40).optional().nullable().transform((v) => v || null),
  tags: optStr(500),
  authorName: z.string().trim().max(120).default("MALAKAND THREADS Team"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.coerce.date().optional().nullable(),
  seoTitle: optStr(160),
  seoDescription: optStr(320),
  canonicalUrl: zUrlOrPath,
});

export const bannerInputSchema = z.object({
  placement: z.enum(["HERO", "PROMO", "SEASONAL"]),
  eyebrow: optStr(120),
  title: z.string().trim().min(1).max(200),
  subtitle: optStr(500),
  imageUrl: zUrlOrPath,
  mobileImageUrl: zUrlOrPath,
  videoUrl: zUrlOrPath,
  imageAlt: optStr(255),
  ctaLabel: optStr(60),
  ctaHref: zUrlOrPath,
  cta2Label: optStr(60),
  cta2Href: zUrlOrPath,
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const adminUserInputSchema = z.object({
  name: zName,
  email: zEmail,
  roleKey: z.enum(["super_admin", "manager", "order_manager", "product_manager"]),
  password: zPassword.optional(),
  isActive: z.boolean().default(true),
});
