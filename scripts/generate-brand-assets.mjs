// Regenerates every brand asset from the official logo artwork: public/brand/logo-original.png
// Run: node scripts/generate-brand-assets.mjs
//
// Outputs
//   public/brand/logo-black.png / logo-white.png  transparent logo (light / dark backgrounds)
//   public/brand/mark-white.png                   the logo's "M", used for square icons
//   src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico, public/brand/icon-*.png, favicon-48.png
//   public/brand/logo-square.png                  full logo on white (structured-data logo)
//   public/brand/og-image.jpg                     1200x630 social sharing image
import sharp from "sharp";
import fs from "node:fs";

const SRC = "public/brand/logo-original.png";
const INK = "#0a0a0a";

// 1) Transparent logos: luminance → alpha, so the brush-stroke edges stay soft.
const grey = await sharp(SRC).flatten({ background: "#fff" }).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
const { width, height } = grey.info;
const alpha = Buffer.alloc(width * height);
for (let i = 0; i < alpha.length; i++) {
  const v = grey.data[i];
  alpha[i] = v > 235 ? 0 : v < 40 ? 255 : Math.round(((235 - v) / 195) * 255);
}
async function tinted(rgb, file) {
  const px = Buffer.alloc(width * height * 4);
  for (let i = 0; i < alpha.length; i++) px.set([rgb[0], rgb[1], rgb[2], alpha[i]], i * 4);
  const trimmed = await sharp(px, { raw: { width, height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  await sharp(trimmed).resize({ width: 1400 }).png({ compressionLevel: 9 }).toFile(file);
}
await tinted([10, 10, 10], "public/brand/logo-black.png");
await tinted([255, 255, 255], "public/brand/logo-white.png");

// 2) The "M": top-left of the white logo, cut along the gap before the "A" (the strokes slant).
{
  const W = 320, H = 300;
  const { data } = await sharp("public/brand/logo-white.png").extract({ left: 0, top: 0, width: W, height: H }).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x > 272 - 0.24 * y) data[(y * W + x) * 4 + 3] = 0;
  const m = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  fs.writeFileSync("public/brand/mark-white.png", m);
}

// 3) Square icons: white "M" centred on black.
async function icon(size, file) {
  const inner = await sharp("public/brand/mark-white.png").resize({ width: Math.round(size * 0.66), height: Math.round(size * 0.66), fit: "inside" }).toBuffer();
  const buf = await sharp({ create: { width: size, height: size, channels: 4, background: INK } }).composite([{ input: inner, gravity: "center" }]).png().toBuffer();
  if (file) await sharp(buf).toFile(file);
  return buf;
}
await icon(512, "src/app/icon.png");
await icon(180, "src/app/apple-icon.png");
await icon(512, "public/brand/icon-512.png");
await icon(192, "public/brand/icon-192.png");
await icon(48, "public/brand/favicon-48.png");

// favicon.ico (PNG-in-ICO, 16/32/48)
{
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => icon(s)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = pngs.map((p, i) => {
    const e = Buffer.alloc(16);
    e[0] = sizes[i];
    e[1] = sizes[i];
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(p.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += p.length;
    return e;
  });
  fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
}

// 4) Square logo on white (Organization logo for search engines).
{
  const inner = await sharp("public/brand/logo-black.png").resize({ width: 440 }).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } }).composite([{ input: inner, gravity: "center" }]).png().toFile("public/brand/logo-square.png");
}

// 5) Social sharing image 1200x630: editorial photo + dark overlay + white logo.
{
  const photo = await sharp("public/images/demo/dress-09.webp").resize(1200, 630, { fit: "cover", position: "attention" }).toBuffer();
  const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0.92"/><stop offset="0.65" stop-color="${INK}" stop-opacity="0.6"/><stop offset="1" stop-color="${INK}" stop-opacity="0.2"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="84" y="430" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#FFFFFF">Premium Women's Fashion in the UAE</text>
  <text x="84" y="476" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#C6A15B">Dresses · Shawls · Bags · Cash on Delivery</text>
</svg>`);
  const logo = await sharp("public/brand/logo-white.png").resize({ width: 560 }).toBuffer();
  await sharp(photo).composite([{ input: overlay }, { input: logo, left: 80, top: 190 }]).jpeg({ quality: 82, mozjpeg: true }).toFile("public/brand/og-image.jpg");
}

console.log("brand assets generated from", SRC);
