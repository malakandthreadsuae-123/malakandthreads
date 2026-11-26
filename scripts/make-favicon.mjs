// Builds src/app/favicon.ico (PNG-in-ICO, 16/32/48 px) from the monogram SVG.
import sharp from "sharp";
import fs from "node:fs";
const svg = fs.readFileSync("public/brand/monogram.svg");
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => sharp(svg, { density: 300 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log("favicon.ico written");
