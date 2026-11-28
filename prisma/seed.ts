/**
 * Seed script — `npm run db:seed`
 * Idempotent: safe to run more than once. Existing records edited in the admin
 * panel are NOT overwritten (create-if-missing semantics).
 *
 * Demo products use licensed Unsplash photography and are flagged isDemo=true.
 * They are clearly labelled on the storefront and are NOT linked to any real brand.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedRoles, seedShipping } from "./seed-lib";
import { BLOG_CATEGORIES, BLOG_POSTS, PAGES } from "./seed-content";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const driverUrl = new URL(url.replace(/^mysql:/, "mariadb:"));
driverUrl.searchParams.set("allowPublicKeyRetrieval", "true");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(driverUrl.toString()) });

const AED = (n: number) => Math.round(n * 100);

// ───────────── Categories ─────────────
const CATEGORIES: {
  name: string;
  slug: string;
  image?: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  content?: string;
  children?: { name: string; slug: string; description: string; image?: string }[];
}[] = [
  {
    name: "Women's Dresses",
    slug: "womens-dresses",
    image: "/images/demo/dress-12.webp",
    description: "Elegant maxi dresses, abayas, festive and everyday dresses curated for women in the UAE.",
    seoTitle: "Women's Dresses Online in the UAE",
    seoDescription: "Shop women's dresses online in the UAE – maxi dresses, abayas, festive and casual dresses in AED with Cash on Delivery across all emirates.",
    content: `## Women's dresses for every occasion in the UAE

From breathable everyday dresses for warm days to embellished pieces for Eid, weddings and evening events, our dress edit is chosen for the UAE lifestyle. Prices are in AED, Cash on Delivery is available, and we deliver to all seven emirates.

### How to choose
- **Maxi and midi lengths** are comfortable, elegant and easy to style modestly.
- **Light fabrics** such as viscose, cotton and lawn are ideal for warmer months.
- Not sure about sizing? Message us on WhatsApp before you order.`,
    children: [
      { name: "Maxi Dresses", slug: "maxi-dresses", image: "/images/demo/dress-12.webp", description: "Flowing long dresses for day and evening." },
      { name: "Abayas & Kaftans", slug: "abayas-kaftans", image: "/images/demo/dress-07.webp", description: "Elegant abayas and kaftans with refined detailing." },
      { name: "Party & Festive Wear", slug: "party-festive-wear", image: "/images/demo/dress-05.webp", description: "Embellished dresses for Eid, weddings and celebrations." },
      { name: "Casual Dresses", slug: "casual-dresses", image: "/images/demo/dress-02.webp", description: "Easy everyday dresses in comfortable fabrics." },
    ],
  },
  {
    name: "Shawls",
    slug: "shawls",
    image: "/images/demo/shawl-07.webp",
    description: "Soft premium shawls, pashmina-style wraps, printed scarves and hijabs.",
    seoTitle: "Women's Shawls & Scarves Online in the UAE",
    seoDescription: "Buy premium women's shawls, pashmina-style wraps, scarves and hijabs online in the UAE. Prices in AED, Cash on Delivery available.",
    content: `## Premium shawls for the UAE

A shawl is the most useful layer in the Emirates — perfect for air-conditioned offices and malls, winter evenings and travel. Explore soft wool-blend wraps, printed scarves and lightweight hijabs.

Read our guide: [How to style a shawl](/blog/how-to-style-a-shawl).`,
    children: [
      { name: "Pashmina-Style Shawls", slug: "pashmina-shawls", image: "/images/demo/shawl-02.webp", description: "Soft, warm wraps for winter evenings and travel." },
      { name: "Scarves & Hijabs", slug: "scarves-hijabs", image: "/images/demo/shawl-05.webp", description: "Lightweight printed scarves and everyday hijabs." },
      { name: "Random Shawls", slug: "random-shawls", image: "/images/demo/shawl-04.webp", description: "Surprise-style shawls selected by our team." },
    ],
  },
  {
    name: "Bags",
    slug: "bags",
    image: "/images/demo/bag-02.webp",
    description: "Fashion handbags, crossbody bags, totes and surprise-style random bags.",
    seoTitle: "Fashion Bags & Handbags Online in the UAE",
    seoDescription: "Shop women's fashion bags in the UAE – handbags, crossbody bags, totes and random surprise bags. Prices in AED with delivery across all emirates.",
    content: `## Fashion bags for every day

From structured top-handle bags for the office to hands-free crossbody bags for the mall, find a bag that fits your routine. New to choosing bags online? Read our [fashion bag buying guide](/blog/fashion-bag-buying-guide).`,
    children: [
      { name: "Handbags", slug: "handbags", image: "/images/demo/bag-10.webp", description: "Top-handle bags and structured handbags." },
      { name: "Crossbody & Shoulder Bags", slug: "crossbody-bags", image: "/images/demo/bag-04.webp", description: "Hands-free crossbody and shoulder bags." },
      { name: "Random Fashion Bags", slug: "random-bags", image: "/images/demo/bag-06.webp", description: "Surprise-style bags selected by our team." },
    ],
  },
  {
    name: "Women's Clothing",
    slug: "womens-clothing",
    image: "/images/demo/editorial-04.webp",
    description: "Women's clothing including co-ords, tops and modest everyday wear.",
    seoTitle: "Women's Clothing Online in the UAE",
    seoDescription: "Shop women's clothing online in the UAE: dresses, co-ords and modest everyday wear with Cash on Delivery.",
  },
  {
    name: "Branded Collections",
    slug: "branded-collections",
    image: "/images/demo/editorial-02.webp",
    description: "Collections organised by label. MALAKAND THREADS is an independent retailer.",
    seoTitle: "Branded Fashion Collections in the UAE",
    seoDescription: "Explore branded women's fashion collections available from MALAKAND THREADS in the UAE.",
  },
  {
    name: "Random Collections",
    slug: "random-collections",
    image: "/images/demo/shawl-04.webp",
    description: "Surprise-style shawls and bags — you choose the product, we choose the print or colour.",
    seoTitle: "Random Shawls & Bags – Surprise Style Collections",
    seoDescription: "Random (surprise style) shawls and fashion bags selected by the MALAKAND THREADS team – great value and perfect for gifting in the UAE.",
  },
  {
    name: "Seasonal Collections",
    slug: "seasonal-collections",
    image: "/images/demo/dress-05.webp",
    description: "Edits for winter, Eid and festive seasons in the UAE.",
    seoTitle: "Seasonal Fashion Collections – Winter & Festive Edits",
    seoDescription: "Seasonal women's fashion collections for the UAE: winter layers, Eid and festive outfits, shawls and bags.",
  },
];

const BRANDS = [
  { name: "Khaadi", slug: "khaadi", image: "/images/demo/dress-05.webp" },
  { name: "Beechtree", slug: "beechtree", image: "/images/demo/dress-03.webp" },
  { name: "Sapphire", slug: "sapphire", image: "/images/demo/dress-08.webp" },
  { name: "Kayseria", slug: "kayseria", image: "/images/demo/dress-07.webp" },
  { name: "Zellbury", slug: "zellbury", image: "/images/demo/shawl-07.webp" },
  { name: "Edenrobe", slug: "edenrobe", image: "/images/demo/dress-10.webp" },
  { name: "Alkaram Studio", slug: "alkaram-studio", image: "/images/demo/dress-09.webp" },
  { name: "Bonanza Satrangi", slug: "bonanza-satrangi", image: "/images/demo/shawl-04.webp" },
];

// ───────────── Demo products ─────────────
type DemoProduct = {
  name: string;
  slug: string;
  sku: string;
  cat: string;
  extraCats?: string[];
  img: string;
  alt: string;
  price: number;
  sale?: number;
  short: string;
  desc: string;
  material: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  flags?: { featured?: boolean; best?: boolean; isNew?: boolean; trending?: boolean };
  stock?: number;
};

const DRESS_SIZES = ["S", "M", "L", "XL"];
const ABAYA_SIZES = ["52", "54", "56", "58"];

const PRODUCTS: DemoProduct[] = [
  { name: "Red Polka Dot Midi Dress", slug: "red-polka-dot-midi-dress", sku: "MT-DR-001", cat: "casual-dresses", img: "dress-02", alt: "Woman wearing a red polka dot sleeveless midi dress", price: 229, sale: 189, short: "A playful red polka dot midi with a flattering V-neckline.", desc: "A timeless polka dot print on a rich red base. The sleeveless midi silhouette and V-neckline make it an easy choice for brunch, shopping and casual evenings. Layer with a light shawl for air-conditioned spaces.", material: "Viscose blend", sizes: DRESS_SIZES, colors: [{ name: "Red", hex: "#B3202A" }], flags: { trending: true, isNew: true } },
  { name: "Gold Embroidered Black Ensemble", slug: "gold-embroidered-black-ensemble", sku: "MT-DR-002", cat: "party-festive-wear", extraCats: ["seasonal-collections"], img: "dress-03", alt: "Woman in a black outfit with ornate gold embroidered jacket", price: 649, short: "Black ensemble with an ornate gold-embroidered jacket.", desc: "Statement gold embroidery on a tailored black jacket, paired with a fluid black skirt. A striking choice for weddings, Eid gatherings and evening events.", material: "Crepe with metallic embroidery", sizes: DRESS_SIZES, colors: [{ name: "Black & Gold", hex: "#1c1a17" }], flags: { featured: true, best: true } },
  { name: "Gold Embellished Festive Gown", slug: "gold-embellished-festive-gown", sku: "MT-DR-003", cat: "party-festive-wear", extraCats: ["seasonal-collections"], img: "dress-05", alt: "Models wearing embellished gold festive gowns", price: 599, sale: 529, short: "Floor-length gold gown with floral embellishment.", desc: "A flowing, floor-length festive gown in warm gold tones with delicate floral embellishment and sheer sleeves. Designed for celebrations, weddings and Eid.", material: "Organza with embellishment", sizes: DRESS_SIZES, colors: [{ name: "Gold", hex: "#C5A46D" }], flags: { featured: true } },
  { name: "Mustard Belted Shirt Dress", slug: "mustard-belted-shirt-dress", sku: "MT-DR-004", cat: "casual-dresses", img: "dress-06", alt: "Woman wearing a sleeveless mustard yellow button-down dress with tie waist", price: 199, short: "Sleeveless button-down dress with a tie waist.", desc: "A cheerful mustard shirt dress with a button-down front and self-tie belt that defines the waist. Lightweight and easy for warm UAE days.", material: "Cotton blend", sizes: DRESS_SIZES, colors: [{ name: "Mustard", hex: "#D8A21F" }], flags: { isNew: true } },
  { name: "Floral Embellished Black Abaya", slug: "floral-embellished-black-abaya", sku: "MT-AB-001", cat: "abayas-kaftans", img: "dress-07", alt: "Black abaya with floral embellishments and lace cuffs", price: 449, short: "Black abaya with floral appliqué and lace cuffs.", desc: "A refined black abaya featuring floral embellishment along the front and delicate lace cuffs. Elegant for occasions yet comfortable for everyday wear.", material: "Nida fabric", sizes: ABAYA_SIZES, colors: [{ name: "Black", hex: "#111111" }], flags: { featured: true, best: true } },
  { name: "Beige Embroidered Abaya", slug: "beige-embroidered-abaya", sku: "MT-AB-002", cat: "abayas-kaftans", img: "dress-08", alt: "Woman in an elegant beige abaya with intricate embroidery", price: 489, sale: 429, short: "Soft beige abaya with intricate embroidery.", desc: "A graceful beige abaya with intricate tonal embroidery and a softly flared hem. Neutral, elegant and easy to style with gold accessories.", material: "Crepe", sizes: ABAYA_SIZES, colors: [{ name: "Beige", hex: "#D9C6AE" }], flags: { best: true, trending: true } },
  { name: "Navy Open Abaya & Beige Dress Set", slug: "navy-open-abaya-beige-dress-set", sku: "MT-AB-003", cat: "abayas-kaftans", extraCats: ["womens-clothing"], img: "dress-09", alt: "Woman wearing a navy blue open abaya over a beige dress", price: 529, short: "Navy open abaya layered over a beige inner dress.", desc: "A modern two-piece look: a navy open-front abaya layered over a soft beige inner dress. Wear together or style separately.", material: "Crepe and viscose", sizes: ABAYA_SIZES, colors: [{ name: "Navy & Beige", hex: "#1F2A44" }], flags: { featured: true, isNew: true } },
  { name: "Pearl Sleeve Black Abaya", slug: "pearl-sleeve-black-abaya", sku: "MT-AB-004", cat: "abayas-kaftans", img: "dress-10", alt: "Black abaya with pearl and bead embellishments on the sleeves", price: 399, short: "Classic black abaya with pearl-beaded sleeves.", desc: "Understated elegance with hand-finished pearl and bead detailing on the sleeves. A classic piece for evenings and special occasions.", material: "Nida fabric", sizes: ABAYA_SIZES, colors: [{ name: "Black", hex: "#111111" }], flags: { best: true } },
  { name: "Stone Hooded Abaya", slug: "stone-hooded-abaya", sku: "MT-AB-005", cat: "abayas-kaftans", img: "dress-11", alt: "Woman wearing a neutral stone-coloured abaya", price: 349, short: "Relaxed stone-coloured abaya with soft drape.", desc: "A relaxed, softly draped abaya in a versatile stone shade. Easy everyday modest wear that pairs with any shawl.", material: "Crepe", sizes: ABAYA_SIZES, colors: [{ name: "Stone", hex: "#CFC6BA" }], flags: { isNew: true } },
  { name: "Cream Flared Day Dress", slug: "cream-flared-day-dress", sku: "MT-DR-005", cat: "maxi-dresses", extraCats: ["womens-clothing"], img: "dress-12", alt: "Woman in a cream long-sleeve flared dress walking outdoors", price: 259, short: "Long-sleeve cream dress with a flared skirt.", desc: "A feminine long-sleeve dress in soft cream with a swingy flared skirt. Perfect for brunches, garden events and spring days.", material: "Cotton voile", sizes: DRESS_SIZES, colors: [{ name: "Cream", hex: "#EFE6D8" }], flags: { trending: true } },
  // Shawls
  { name: "Crimson Soft Scarf", slug: "crimson-soft-scarf", sku: "MT-SH-001", cat: "scarves-hijabs", img: "shawl-01", alt: "Woman wearing a long crimson red scarf", price: 79, short: "Long, soft scarf in a rich crimson red.", desc: "A long, lightweight scarf in rich crimson that adds instant colour to neutral outfits. Wear around the neck or drape loosely over the shoulders.", material: "Viscose", sizes: ["Free Size"], colors: [{ name: "Crimson", hex: "#A3141F" }], flags: { isNew: true } },
  { name: "Tartan Wool-Blend Shawl", slug: "tartan-wool-blend-shawl", sku: "MT-SH-002", cat: "pashmina-shawls", extraCats: ["seasonal-collections"], img: "shawl-02", alt: "Woman wearing a red, blue and white tartan blanket scarf", price: 149, sale: 119, short: "Oversized tartan shawl for winter evenings and travel.", desc: "A cosy oversized tartan shawl in a soft wool blend. Ideal for desert evenings, winter travel and chilly air-conditioning.", material: "Wool blend", sizes: ["Free Size"], colors: [{ name: "Red Tartan", hex: "#8E2B2B" }], flags: { best: true, trending: true } },
  { name: "Black Knit Winter Scarf", slug: "black-knit-winter-scarf", sku: "MT-SH-003", cat: "pashmina-shawls", img: "shawl-03", alt: "Woman wearing a black knit scarf with a black jacket", price: 99, short: "Warm black knit scarf for travel and cooler months.", desc: "A warm, chunky black knit scarf. A practical essential for winter travel and cool evenings.", material: "Acrylic wool blend", sizes: ["Free Size"], colors: [{ name: "Black", hex: "#141414" }] },
  { name: "Random Printed Scarf (Surprise Colour)", slug: "random-printed-scarf-surprise-colour", sku: "MT-SH-004", cat: "random-shawls", extraCats: ["random-collections"], img: "shawl-04", alt: "Stack of colourful printed scarves in assorted designs", price: 59, short: "One printed scarf — colour and print chosen by our team.", desc: "A surprise-style printed scarf selected by our team from our current assortment. You choose the product; we pick the print and colour. Great value and perfect for gifting. Image shows examples of the range.", material: "Viscose / chiffon (varies)", sizes: ["Free Size"], flags: { best: true }, stock: 40 },
  { name: "Printed Silk-Feel Hijab Scarf", slug: "printed-silk-feel-hijab-scarf", sku: "MT-SH-005", cat: "scarves-hijabs", img: "shawl-05", alt: "Printed headscarves displayed on mannequin heads", price: 69, short: "Smooth printed scarf, ideal as a hijab or neck scarf.", desc: "A smooth, silk-feel printed scarf that drapes beautifully as a hijab or neck scarf. Available in several prints.", material: "Satin polyester", sizes: ["Free Size"], colors: [{ name: "Red Print", hex: "#C2333B" }, { name: "Mauve", hex: "#8C6D7B" }, { name: "Blush", hex: "#E6C8C0" }] },
  { name: "Pink Striped Statement Shawl", slug: "pink-striped-statement-shawl", sku: "MT-SH-006", cat: "scarves-hijabs", img: "shawl-06", alt: "Woman wearing a pink and white striped scarf over her head", price: 89, short: "Bold pink-and-white striped shawl.", desc: "A bold, joyful pink and white striped shawl that can be worn over the head or draped around the shoulders.", material: "Cotton blend", sizes: ["Free Size"], colors: [{ name: "Pink", hex: "#E0407B" }], flags: { trending: true } },
  { name: "Paisley Pashmina-Style Shawl", slug: "paisley-pashmina-style-shawl", sku: "MT-SH-007", cat: "pashmina-shawls", extraCats: ["seasonal-collections"], img: "shawl-07", alt: "Colourful paisley print shawls hanging in a row", price: 189, sale: 159, short: "Soft paisley shawl in rich, warm colours.", desc: "A generous pashmina-style shawl with a traditional paisley print in warm, rich colours. Soft, light and warm — a beautiful gift.", material: "Viscose wool blend", sizes: ["Free Size"], colors: [{ name: "Saffron", hex: "#D9922B" }, { name: "Emerald", hex: "#3B7D5B" }], flags: { featured: true, best: true } },
  { name: "Soft Grey Jersey Hijab", slug: "soft-grey-jersey-hijab", sku: "MT-SH-008", cat: "scarves-hijabs", img: "shawl-08", alt: "Woman wearing a soft grey hijab", price: 49, short: "Stretchy, breathable everyday jersey hijab.", desc: "A breathable, stretchy jersey hijab in soft grey. Stays in place comfortably all day.", material: "Cotton jersey", sizes: ["Free Size"], colors: [{ name: "Grey", hex: "#9A9A9A" }], flags: { isNew: true } },
  // Bags
  { name: "Woven Leather Chain Tote", slug: "woven-leather-chain-tote", sku: "MT-BG-001", cat: "handbags", img: "bag-01", alt: "Tan woven leather tote bag with a gold chain strap", price: 349, sale: 299, short: "Tan woven tote with a gold-tone chain.", desc: "A spacious woven tote in warm tan with a gold-tone chain detail. Fits a tablet, purse and daily essentials.", material: "Faux leather", colors: [{ name: "Tan", hex: "#A0612F" }], flags: { featured: true, best: true } },
  { name: "Scarlet Top-Handle Bag", slug: "scarlet-top-handle-bag", sku: "MT-BG-002", cat: "handbags", img: "bag-02", alt: "Red structured top-handle handbag with silver clasp", price: 299, short: "Structured red top-handle bag with silver clasp.", desc: "A structured scarlet handbag with a polished silver-tone clasp. Adds a confident pop of colour to evening and office outfits.", material: "Faux leather", colors: [{ name: "Scarlet", hex: "#C8231E" }], flags: { trending: true, featured: true } },
  { name: "Classic Black Work Tote", slug: "classic-black-work-tote", sku: "MT-BG-003", cat: "handbags", img: "bag-03", alt: "Black leather tote bag with silver hardware", price: 279, short: "Clean black tote — the everyday workhorse.", desc: "A minimal black tote with silver-tone hardware and twin handles. Roomy enough for a laptop sleeve and your daily essentials.", material: "Faux leather", colors: [{ name: "Black", hex: "#141414" }], flags: { best: true } },
  { name: "Tan Saddle Crossbody Bag", slug: "tan-saddle-crossbody-bag", sku: "MT-BG-004", cat: "crossbody-bags", img: "bag-04", alt: "Tan leather crossbody sling bag on a white background", price: 199, short: "Compact tan crossbody with adjustable strap.", desc: "A compact saddle-shaped crossbody bag in tan with an adjustable strap — hands-free for malls, travel and busy days.", material: "Faux leather", colors: [{ name: "Tan", hex: "#A35A2A" }], flags: { isNew: true } },
  { name: "Woven Orange Top-Handle Bag", slug: "woven-orange-top-handle-bag", sku: "MT-BG-005", cat: "handbags", img: "bag-05", alt: "Orange woven top-handle handbag", price: 259, short: "Summery woven top-handle bag in orange.", desc: "A summery woven bag with a structured orange flap and top handle. Bright, light and perfect for weekend outings.", material: "Woven fibre with faux leather trim", colors: [{ name: "Orange", hex: "#E07A2E" }], flags: { isNew: true, trending: true } },
  { name: "Random Fashion Bag (Surprise Style)", slug: "random-fashion-bag-surprise-style", sku: "MT-BG-006", cat: "random-bags", extraCats: ["random-collections"], img: "bag-06", alt: "Close-up of a brown handbag with gold hardware", price: 149, short: "One fashion bag — style and colour chosen by our team.", desc: "A surprise-style fashion bag selected by our team from our current range. You choose the product; we choose the style and colour. Image shows an example from the range.", material: "Varies by style", flags: { best: true }, stock: 30 },
  { name: "Black Barrel Handbag", slug: "black-barrel-handbag", sku: "MT-BG-007", cat: "handbags", img: "bag-07", alt: "Black leather barrel-shaped handbag with buckle straps", price: 239, short: "Black barrel bag with buckle-strap handles.", desc: "A structured barrel-shaped handbag with buckle-strap handles and a pebbled finish.", material: "Faux leather", colors: [{ name: "Black", hex: "#141414" }] },
  { name: "Grey Buckle Satchel", slug: "grey-buckle-satchel", sku: "MT-BG-008", cat: "crossbody-bags", img: "bag-08", alt: "Grey leather satchel with gold buckles", price: 229, sale: 189, short: "Grey satchel with gold-tone buckles.", desc: "A smart grey satchel with gold-tone buckles, top handle and detachable shoulder strap.", material: "Faux leather", colors: [{ name: "Grey", hex: "#8E8A8C" }], flags: { trending: true } },
  { name: "Teal Top-Handle Bag", slug: "teal-top-handle-bag", sku: "MT-BG-009", cat: "handbags", img: "bag-10", alt: "Teal leather top-handle handbag with gold clasp", price: 269, short: "Rich teal handbag with a gold push-lock.", desc: "A rich teal top-handle bag with a gold-tone push-lock and detachable strap.", material: "Faux leather", colors: [{ name: "Teal", hex: "#127C8A" }], flags: { featured: true } },
];

const HOMEPAGE_SECTIONS: { key: string; title: string; subtitle?: string; sortOrder: number; isEnabled?: boolean; config?: object }[] = [
  { key: "hero", title: "Hero", sortOrder: 0 },
  { key: "categories", title: "Shop by Category", sortOrder: 2, config: { slugs: ["bags", "womens-dresses", "shawls", "random-collections"], labels: { "womens-dresses": "Girl Dress", "random-collections": "Random Collection" } } },
  { key: "trust_strip", title: "Why shop with us", sortOrder: 40, isEnabled: false },
  { key: "product_tabs", title: "Shop the Latest", subtitle: "New arrivals, customer favourites and what's trending now", sortOrder: 3, config: { limit: 8 } },
  { key: "video_story", title: "The Embroidered Edit", subtitle: "Hand-finished embroidery, soft drape and heirloom detail — pieces made to be noticed.", sortOrder: 5, config: { video: "/videos/story-embroidered.mp4", poster: "/images/story-embroidered.webp", href: "/category/womens-clothing", cta: "Discover the edit" } },
  { key: "promo_banners", title: "Promotions", sortOrder: 30, isEnabled: false },
  { key: "dresses", title: "Women's Dresses", subtitle: "Maxi, festive and everyday dresses", sortOrder: 4, config: { category: "womens-dresses" } },
  { key: "shop_by_price", title: "Shop by Budget", sortOrder: 31, isEnabled: false },
  { key: "shawls", title: "Premium Shawls", subtitle: "Soft layers for cool evenings", sortOrder: 6, config: { category: "shawls" } },
  { key: "brands", title: "Brand Collections", subtitle: "Explore collections by label", sortOrder: 1 },
  { key: "bags", title: "Fashion Bags", subtitle: "From desk to dinner", sortOrder: 8, config: { category: "bags" } },
  { key: "seasonal", title: "Seasonal Collections", sortOrder: 32, isEnabled: false },
  { key: "featured", title: "Featured Pieces", subtitle: "Hand-picked by our stylists", sortOrder: 33, isEnabled: false, config: { limit: 8 } },
  { key: "testimonials", title: "Customer Feedback", subtitle: "Real words from our customers — on the website and on WhatsApp.", sortOrder: 11 },
  { key: "faq", title: "Frequently Asked Questions", subtitle: "Delivery, payment, wholesale and more — quick answers to what customers ask us most.", sortOrder: 10, config: { limit: 6 } },
  { key: "gallery", title: "Style Inspiration", subtitle: "Follow us for daily styling ideas", sortOrder: 34, isEnabled: false, config: { images: ["/images/demo/dress-09.webp", "/images/demo/shawl-07.webp", "/images/demo/bag-02.webp", "/images/demo/dress-03.webp", "/images/demo/editorial-04.webp", "/images/demo/shawl-06.webp"] } },
  { key: "whatsapp", title: "Shop with WhatsApp", subtitle: "Personal styling help, sizing advice and order support — just message us.", sortOrder: 35, isEnabled: false },
  // The footer already carries a newsletter sign-up, so this band is off by default.
  { key: "newsletter", title: "Join the List", subtitle: "Be first to hear about new arrivals and private offers.", sortOrder: 15, isEnabled: false },
  { key: "trust", title: "Why Shop With Us", sortOrder: 36, isEnabled: false },
  // Individual carousels (replaced by product_tabs by default — enable in Admin → Homepage if preferred)
  { key: "new_arrivals", title: "New Arrivals", subtitle: "Fresh pieces, just landed", sortOrder: 20, isEnabled: false, config: { limit: 8 } },
  { key: "best_sellers", title: "Best Sellers", subtitle: "Most loved by our customers", sortOrder: 21, isEnabled: false, config: { limit: 8 } },
  { key: "trending", title: "Trending Now", subtitle: "What's catching eyes this week", sortOrder: 22, isEnabled: false, config: { limit: 8 } },
];

async function main() {
  console.log("Seeding roles & permissions…");
  await seedRoles(prisma);

  // ── Super admin (password from env, never hardcoded) ──
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || "malakandthreadsuae@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const superRole = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    if (!adminPassword || adminPassword.length < 10) {
      console.warn("⚠ ADMIN_INITIAL_PASSWORD not set (or < 10 chars) — skipping admin creation. Run `npm run admin:create` later.");
    } else {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Store Administrator",
          passwordHash: await hash(adminPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
          roleId: superRole.id,
          emailVerifiedAt: new Date(),
          mustChangePassword: true,
        },
      });
      console.log(`✔ Super admin created: ${adminEmail} (must change password on first login)`);
    }
  } else {
    console.log(`• Admin ${adminEmail} already exists — left unchanged`);
  }

  console.log("Seeding shipping rates…");
  await seedShipping(prisma);

  console.log("Seeding categories…");
  let order = 0;
  for (const c of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, image: c.image, description: c.description, content: c.content, seoTitle: c.seoTitle, seoDescription: c.seoDescription, sortOrder: order++ },
      update: {},
    });
    let childOrder = 0;
    for (const ch of c.children ?? []) {
      await prisma.category.upsert({
        where: { slug: ch.slug },
        create: { name: ch.name, slug: ch.slug, image: ch.image, description: ch.description, parentId: parent.id, sortOrder: childOrder++, seoTitle: `${ch.name} Online in the UAE`, seoDescription: `${ch.description} Shop ${ch.name.toLowerCase()} online in the UAE with prices in AED and Cash on Delivery.` },
        update: {},
      });
    }
  }

  console.log("Seeding brands…");
  for (const [i, b] of BRANDS.entries()) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      create: {
        name: b.name,
        slug: b.slug,
        image: b.image, // licensed Unsplash stand-in (docs/MEDIA_CREDITS.md) — replace in Admin → Brands
        sortOrder: i,
        isFeatured: true,
        description: `Browse ${b.name} label pieces available from MALAKAND THREADS in the UAE. MALAKAND THREADS is an independent retailer and is not an official ${b.name} store or authorised distributor unless stated on the product page.`,
        seoTitle: `${b.name} Collection UAE`,
        seoDescription: `Shop ${b.name} label women's fashion available from MALAKAND THREADS in the UAE. Prices in AED with Cash on Delivery.`,
      },
      update: {},
    });
  }

  console.log("Seeding demo products…");
  const cats = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  const parentOf = new Map(
    (await prisma.category.findMany({ select: { id: true, parentId: true } })).map((c) => [c.id, c.parentId]),
  );
  let created = 0;
  for (const [idx, p] of PRODUCTS.entries()) {
    if (await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } })) continue;
    const catId = cats.get(p.cat)!;
    const catIds = new Set<string>([catId]);
    const parentId = parentOf.get(catId);
    if (parentId) catIds.add(parentId);
    for (const extra of p.extraCats ?? []) catIds.add(cats.get(extra)!);
    const sizes = p.sizes ?? [null];
    const colors = p.colors?.length ? p.colors : [null];
    const variants: { sku: string; size: string | null; color: string | null; colorHex: string | null; stock: number; sortOrder: number }[] = [];
    let vi = 0;
    for (const color of colors) {
      for (const size of sizes) {
        variants.push({
          sku: `${p.sku}${color && colors.length > 1 ? "-" + color.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() : ""}${size ? "-" + size.replace(/\s+/g, "").toUpperCase() : ""}`,
          size,
          color: color?.name ?? null,
          colorHex: color?.hex ?? null,
          stock: p.stock ?? 4 + ((idx * 7 + vi * 3) % 9),
          sortOrder: vi++,
        });
      }
    }
    const regular = AED(p.price);
    const sale = p.sale ? AED(p.sale) : null;
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.short,
        description: `${p.desc}\n\n**Please note:** this is a demonstration product shown with licensed stock photography while our catalogue is being set up.`,
        categoryId: catId,
        regularPrice: regular,
        salePrice: sale,
        price: sale ?? regular,
        isOnSale: Boolean(sale),
        material: p.material,
        careInstructions: "Gentle hand wash or dry clean. Do not bleach. Iron on low heat.",
        status: "ACTIVE",
        isDemo: true,
        isFeatured: Boolean(p.flags?.featured),
        isBestSeller: Boolean(p.flags?.best),
        isNewArrival: Boolean(p.flags?.isNew),
        isTrending: Boolean(p.flags?.trending),
        salesCount: p.flags?.best ? 20 - (idx % 7) : idx % 5,
        viewCount: 50 + ((idx * 37) % 200),
        seoDescription: `${p.short} Shop online at MALAKAND THREADS with prices in AED, Cash on Delivery and delivery across the UAE.`.slice(0, 300),
        images: { create: [{ url: `/images/demo/${p.img}.webp`, alt: p.alt, sortOrder: 0 }] },
        categories: { create: [...catIds].map((categoryId) => ({ categoryId })) },
        variants: { create: variants },
      },
      include: { variants: true },
    });
    await prisma.inventoryTransaction.createMany({
      data: product.variants.map((v) => ({ variantId: v.id, change: v.stock, stockAfter: v.stock, reason: "INITIAL" as const, note: "Seed stock (demo)" })),
    });
    created++;
  }
  console.log(`✔ ${created} demo products created`);

  console.log("Seeding homepage, banners & settings…");
  for (const s of HOMEPAGE_SECTIONS) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      create: { key: s.key, title: s.title, subtitle: s.subtitle, sortOrder: s.sortOrder, isEnabled: s.isEnabled ?? true, config: s.config },
      update: {},
    });
  }
  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        {
          placement: "HERO",
          eyebrow: "The Embroidered Edit · UAE",
          title: "Elegance, Woven for the Emirates",
          subtitle: "Designer dresses, premium shawls and statement bags from the labels you love — delivered across all seven emirates with Cash on Delivery.",
          videoUrl: "/videos/hero-embroidered.mp4",
          imageUrl: "/images/hero-embroidered.webp",
          mobileImageUrl: null,
          imageAlt: "Model in an embroidered teal outfit with traditional gold jewellery",
          ctaLabel: "Shop Now",
          ctaHref: "/shop",
          cta2Label: "Explore Collections",
          cta2Href: "/collections",
          sortOrder: 0,
        },
        { placement: "PROMO", eyebrow: "The Shawl Edit", title: "Soft Layers for Cool Evenings", subtitle: "Pashmina-style wraps, printed scarves and everyday hijabs.", imageUrl: "/images/demo/shawl-07.webp", imageAlt: "Colourful paisley shawls hanging in a row", ctaLabel: "Shop Shawls", ctaHref: "/category/shawls", sortOrder: 0 },
        { placement: "PROMO", eyebrow: "Bags of the Season", title: "Carry It Beautifully", subtitle: "Structured top-handles, totes and crossbody bags.", imageUrl: "/images/demo/bag-02.webp", imageAlt: "Red structured top-handle handbag", ctaLabel: "Shop Bags", ctaHref: "/category/bags", sortOrder: 1 },
        { placement: "SEASONAL", eyebrow: "Festive Edit", title: "Celebrate in Gold", subtitle: "Embellished gowns and statement ensembles for Eid and weddings.", imageUrl: "/images/demo/dress-05.webp", imageAlt: "Models in embellished gold festive gowns", ctaLabel: "Shop Festive", ctaHref: "/category/party-festive-wear", sortOrder: 0 },
        { placement: "SEASONAL", eyebrow: "Winter Layers", title: "Wrapped in Warmth", subtitle: "Tartan and paisley shawls for desert nights.", imageUrl: "/images/demo/shawl-02.webp", imageAlt: "Woman wearing a tartan shawl", ctaLabel: "Shop Winter Edit", ctaHref: "/category/seasonal-collections", sortOrder: 1 },
      ],
    });
  }

  console.log("Seeding pages & blog…");
  for (const p of PAGES) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, title: p.title, content: p.content, seoTitle: p.seoTitle, seoDescription: p.seoDescription, needsReview: p.needsReview, showInFooter: p.showInFooter },
      update: {},
    });
  }
  for (const c of BLOG_CATEGORIES) {
    await prisma.blogCategory.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }
  const blogCats = new Map((await prisma.blogCategory.findMany()).map((c) => [c.slug, c.id]));
  for (const b of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      create: {
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        content: b.content,
        coverImage: b.coverImage,
        coverAlt: b.coverAlt,
        tags: b.tags,
        seoTitle: b.seoTitle,
        seoDescription: b.seoDescription,
        categoryId: blogCats.get(b.category),
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - b.daysAgo * 86400000),
      },
      update: {},
    });
  }

  // Example coupon — created INACTIVE so no discount goes live without the owner's decision.
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: { code: "WELCOME10", description: "10% off first order (example — activate in admin if wanted)", type: "PERCENTAGE", value: 10, minSubtotal: AED(150), maxDiscount: AED(100), perCustomerLimit: 1, isActive: false },
    update: {},
  });

  console.log("✔ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
