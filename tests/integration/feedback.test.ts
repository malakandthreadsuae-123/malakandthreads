import { jsonRequest, resetCookies } from "../helpers/request-context";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { baseSeed, makeUser } from "../helpers/fixtures";
import * as feedbackRoute from "@/app/api/feedback/route";
import * as adminLoginRoute from "@/app/api/admin/auth/login/route";
import * as adminFeedback from "@/app/api/admin/testimonials/route";
import * as adminFeedbackItem from "@/app/api/admin/testimonials/[id]/route";
import * as adminBulk from "@/app/api/admin/testimonials/bulk/route";
import { getFeedbackStats, getPublishedFeedback } from "@/lib/services/feedback";
import { resetRateLimit } from "@/lib/rate-limit";

const ctx = { params: Promise.resolve({}) } as never;
const itemCtx = (id: string) => ({ params: Promise.resolve({ id }) }) as never;
const json = async (r: Response) => (await r.json()) as { ok: boolean; data: never; error?: { code: string; fields?: Record<string, string> } };
const tag = () => `T${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
const review = (t: string, extra: Record<string, unknown> = {}) => ({ name: "Hina Test", location: "Dubai", email: "", rating: 5, text: `${t} the shawl is beautiful and soft`, consent: true, website: "", ...extra });

async function loginAdmin() {
  const a = await makeUser("super_admin", "Password123x");
  const r = await adminLoginRoute.POST(jsonRequest("/api/admin/auth/login", "POST", { email: a.email, password: "Password123x" }), ctx);
  expect(r.status).toBe(200);
}

beforeAll(async () => {
  await baseSeed();
});
beforeEach(() => {
  resetCookies();
  for (const k of ["feedback:unknown", "feedback-attempt:unknown", "admin-login:unknown", "feedback-list:unknown"]) resetRateLimit(k);
});

describe("customer feedback", () => {
  it("publishes a website review instantly (private email never shown)", async () => {
    const t = tag();
    const r = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(t, { email: `${t}@example.test` })), ctx);
    expect(r.status).toBe(201);
    const row = await prisma.testimonial.findFirstOrThrow({ where: { text: { startsWith: t } } });
    expect(row).toMatchObject({ type: "CUSTOMER_TEXT", status: "APPROVED", isActive: true, rating: 5, isVerifiedPurchase: false, email: `${t.toLowerCase()}@example.test` });
    const { items } = await getPublishedFeedback(1, 500);
    const pub = items.find((i) => i.id === row.id);
    expect(pub).toBeTruthy();
    expect(JSON.stringify(pub)).not.toContain("@example.test");
    // the response returns the public review so the page can show it immediately
    expect(((await json(r)).data as { review: { id: string } }).review.id).toBe(row.id);
  });

  it("validates input, blocks links, duplicates and requires consent", async () => {
    const bad = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", { name: "A", rating: 0, text: "short", consent: false }), ctx);
    expect(bad.status).toBe(422);
    expect(Object.keys((await json(bad)).error?.fields ?? {})).toEqual(expect.arrayContaining(["name", "rating", "text", "consent"]));

    const badPhoto = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(tag(), { images: ["https://evil.example/x.jpg"] })), ctx);
    expect(badPhoto.status).toBe(422);
    const tooMany = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(tag(), { images: Array.from({ length: 5 }, (_, i) => `/media/2026/11/abcdefgh${i}xyz.webp`) })), ctx);
    expect(tooMany.status).toBe(422);

    const link = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(tag(), { text: "great deals at www.spam-example.com now" })), ctx);
    expect(link.status).toBe(422);

    const t = tag();
    expect((await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(t)), ctx)).status).toBe(201);
    const dup = await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(t)), ctx);
    expect(dup.status).toBe(409);
  });

  it("rate limits repeated submissions", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(tag())), ctx)).status);
    expect(codes.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(codes[5]).toBe(429);
  });
});

describe("admin feedback management", () => {
  it("requires an admin session", async () => {
    const r = await adminBulk.POST(jsonRequest("/api/admin/testimonials/bulk", "POST", { action: "delete_samples" }), ctx);
    expect([401, 403]).toContain(r.status);
  });

  it("counts customer reviews in stats; admin can unpublish, re-approve, reject and delete them", async () => {
    const before = await getFeedbackStats();
    const t = tag();
    await feedbackRoute.POST(jsonRequest("/api/feedback", "POST", review(t, { email: `${t}@example.test`, rating: 4, images: ["/media/2026/11/testphoto123.webp"] })), ctx);
    const row = await prisma.testimonial.findFirstOrThrow({ where: { text: { startsWith: t } } });
    const after = await getFeedbackStats();
    expect(after.count).toBe(before.count + 1);
    expect(after.rated).toBe(before.rated + 1);
    expect(after.breakdown[1]).toBe(before.breakdown[1] + 1); // one more 4-star review
    expect((await getPublishedFeedback(1, 500)).items.find((i) => i.id === row.id)?.images).toEqual(["/media/2026/11/testphoto123.webp"]);
    await loginAdmin();
    expect((await adminBulk.POST(jsonRequest("/api/admin/testimonials/bulk", "POST", { action: "unpublish", ids: [row.id] }), ctx)).status).toBe(200);
    expect((await getPublishedFeedback(1, 500)).items.some((i) => i.id === row.id)).toBe(false);
    expect((await adminBulk.POST(jsonRequest("/api/admin/testimonials/bulk", "POST", { action: "approve", ids: [row.id] }), ctx)).status).toBe(200);
    expect((await getPublishedFeedback(1, 500)).items.some((i) => i.id === row.id)).toBe(true);

    // customer words cannot be edited by the store
    const patch = await adminFeedbackItem.PATCH(jsonRequest(`/api/admin/testimonials/${row.id}`, "PATCH", { type: "CUSTOMER_TEXT", name: "Hina T.", text: "edited words", rating: 1, status: "APPROVED", isActive: true }), itemCtx(row.id));
    expect(patch.status).toBe(200);
    const saved = await prisma.testimonial.findUniqueOrThrow({ where: { id: row.id } });
    expect(saved.name).toBe("Hina T.");
    expect(saved.text.startsWith(t)).toBe(true);
    expect(saved.rating).toBe(4);
    expect(saved.images).toEqual(["/media/2026/11/testphoto123.webp"]);

    // unpublish + reject remove it from the website
    await adminBulk.POST(jsonRequest("/api/admin/testimonials/bulk", "POST", { action: "reject", ids: [row.id] }), ctx);
    expect((await getPublishedFeedback(1, 500)).items.some((i) => i.id === row.id)).toBe(false);

    // admin can delete any review
    expect((await adminFeedbackItem.DELETE(jsonRequest(`/api/admin/testimonials/${row.id}`, "DELETE"), itemCtx(row.id))).status).toBe(200);
    expect(await prisma.testimonial.findUnique({ where: { id: row.id } })).toBeNull();
  });

  it("publishes a WhatsApp screenshot only with images and confirmed permission", async () => {
    await loginAdmin();
    const base = { type: "WHATSAPP_SCREENSHOT", name: "", text: "", images: [] as string[], status: "APPROVED", isActive: true, permissionConfirmed: true };
    const noImg = await adminFeedback.POST(jsonRequest("/api/admin/testimonials", "POST", base), ctx);
    expect(noImg.status).toBe(422);
    const noPerm = await adminFeedback.POST(jsonRequest("/api/admin/testimonials", "POST", { ...base, images: ["/images/demo/editorial-04.webp"], permissionConfirmed: false }), ctx);
    expect(noPerm.status).toBe(422);
    expect((await json(noPerm)).error?.fields).toHaveProperty("permissionConfirmed");
    const ok = await adminFeedback.POST(jsonRequest("/api/admin/testimonials", "POST", { ...base, images: ["/images/demo/editorial-04.webp", "/images/demo/dress-03.webp"], title: "WhatsApp love", rating: 5 }), ctx);
    expect(ok.status).toBe(201);
    const id = ((await json(ok)).data as { id: string }).id;
    const pub = (await getPublishedFeedback(1, 500)).items.find((i) => i.id === id);
    expect(pub).toMatchObject({ type: "WHATSAPP_SCREENSHOT", images: ["/images/demo/editorial-04.webp", "/images/demo/dress-03.webp"] });

    // admin cannot create a fake "website review"
    const fake = await adminFeedback.POST(jsonRequest("/api/admin/testimonials", "POST", { ...base, type: "CUSTOMER_TEXT", name: "X", text: "hello there", images: [] }), ctx);
    expect(fake.status).toBe(422);

    expect((await adminFeedbackItem.DELETE(jsonRequest(`/api/admin/testimonials/${id}`, "DELETE"), itemCtx(id))).status).toBe(200);
    expect(await prisma.testimonial.findUnique({ where: { id } })).toBeNull();
  });

  it("never counts samples and deletes them all in one action", async () => {
    await loginAdmin();
    const before = await getFeedbackStats();
    await prisma.testimonial.create({ data: { type: "SAMPLE", name: "Sample S.", text: "Sample text for the test", rating: 1, status: "APPROVED", isActive: true, permissionConfirmed: true } });
    const mid = await getFeedbackStats();
    expect(mid).toEqual(before);
    expect((await getPublishedFeedback(1, 500)).items.some((i) => i.type === "SAMPLE")).toBe(true);
    expect((await adminBulk.POST(jsonRequest("/api/admin/testimonials/bulk", "POST", { action: "delete_samples" }), ctx)).status).toBe(200);
    expect(await prisma.testimonial.count({ where: { type: "SAMPLE" } })).toBe(0);
  });
});
