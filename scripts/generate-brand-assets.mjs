// Regenerates raster brand assets (PNG) from the SVG sources. Run: node scripts/generate-brand-assets.mjs
import sharp from "sharp";
import fs from "node:fs";

const mono = fs.readFileSync("public/brand/monogram.svg");
await sharp(mono, { density: 300 }).resize(512, 512).png().toFile("public/brand/logo-square.png");
await sharp(mono, { density: 300 }).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp(mono, { density: 300 }).resize(192, 192).png().toFile("public/brand/icon-192.png");
await sharp(mono, { density: 300 }).resize(512, 512).png().toFile("public/brand/icon-512.png");
await sharp(mono, { density: 300 }).resize(48, 48).png().toFile("public/brand/favicon-48.png");

// Social sharing image 1200x630: editorial photo + dark overlay + wordmark
const photo = await sharp("public/images/demo/dress-09.webp").resize(1200, 630, { fit: "cover", position: "attention" }).toBuffer();
const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#171717" stop-opacity="0.92"/><stop offset="0.65" stop-color="#171717" stop-opacity="0.55"/><stop offset="1" stop-color="#171717" stop-opacity="0.15"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="78" letter-spacing="12" fill="#F8F5F0">MALAKAND</text>
  <line x1="84" y1="306" x2="160" y2="306" stroke="#C5A46D" stroke-width="2"/>
  <text x="180" y="314" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="14" fill="#C5A46D">THREADS</text>
  <text x="84" y="400" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#E9E1D6">Premium Women's Fashion in the UAE</text>
  <text x="84" y="446" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#bfb5a6">Dresses · Shawls · Bags · Cash on Delivery</text>
</svg>`);
await sharp(photo).composite([{ input: overlay }]).jpeg({ quality: 82, mozjpeg: true }).toFile("public/brand/og-image.jpg");

// Hero poster for the video (first paint / mobile)
await sharp("public/images/demo/dress-09.webp").resize(1600, 900, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile("public/images/hero-poster.webp");
console.log("brand assets generated");
