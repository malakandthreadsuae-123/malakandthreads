# Media Credits & Licensing

## Demo product & editorial photography — Unsplash

All files in `public/images/demo/` were downloaded from **Unsplash** (images.unsplash.com) under the [Unsplash License](https://unsplash.com/license): free for commercial use, no permission required, attribution appreciated but not required. Unsplash+ (paid) images were excluded. Images were resized and converted to WebP.

The Unsplash License does **not** grant trademark or model/property releases. Items showing recognisable designer branding were rejected. Because these photos do not show MALAKAND THREADS' actual stock, every product using them is flagged `isDemo` and labelled "Demo product". **Replace them with your own product photography before launch.**

| File | Unsplash photo ID |
|---|---|
| dress-02 | photo-1786865573488-220ead0edf93 |
| dress-03 | photo-1733731402537-1b4d678f1191 |
| dress-05 | photo-1756483510837-83203eba47e9 |
| dress-06 | photo-1789111161016-795db6925e99 |
| dress-07 | photo-1772474500365-c2c520545f44 |
| dress-08 | photo-1760083545495-b297b1690672 |
| dress-09 | photo-1762605135326-5c4bcc5ef006 |
| dress-10 | photo-1772474578035-bebcd90b355d |
| dress-11 | photo-1752794673269-dc356838c5fd |
| dress-12 | photo-1721990336298-90832e791b5a |
| shawl-01 … shawl-08 | 1510574457807-3d9bf494ff6b · 1539346471381-191ffce95e06 · 1547465055-b4273a4f3c10 · 1545153252-0e2e698f0330 · 1758549854398-52b8809aa526 · 1771978537603-1a8283bdab89 · 1693382288218-2ce85aa26974 · 1613909707776-098e961198dc |
| bag-01 … bag-08, bag-10 | 1598532163257-ae3c6b2524b6 · 1584917865442-de89df76afd3 · 1614179689702-355944cd0918 · 1600857062241-98e5dba7f214 · 1590874103328-eac38a683ce7 · 1774702535771-eec0c74d6cb9 · 1705909237050-7a7625b47fac · 1605733513597-a8f8341084e6 · 1594223274512-ad4803739b7c |
| editorial-02 … editorial-06 | 1441984904996-e0b6ba687e04 · 1603400521630-9f2de124b33b · 1612423284934-2850a4ea6b0f · 1546213290-e1b492ab3eee · 1718985342149-7178154e0aee |

URL format: `https://images.unsplash.com/<photo ID>`.

## Homepage videos — Mixkit

Both clips are from [Mixkit](https://mixkit.co/) under the [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree) (free for commercial use, no attribution required; no endorsement implied by people shown). 720p H.264 downloads, muted loops.

| File | Source |
|---|---|
| `public/videos/hero-embroidered.mp4` (5.6 MB, 15 s) | Mixkit #50785 "A young woman in traditional Indian attire and jewelry strikes a pose" |
| `public/videos/story-embroidered.mp4` (3.1 MB, 9 s) | Mixkit #50790 "A young woman in a traditional Indian costume moves gracefully" |
| `public/images/hero-embroidered.webp`, `public/images/story-embroidered.webp` | First frames of the clips above (posters / LCP image) |

Replace them any time via Admin → Banners → Hero (*Background video*) and Admin → Homepage → *The Embroidered Edit* (config `video` / `poster`). Keep clips ≤ 6 MB, 1280–1920 px wide, 8–20 s.

## Brand assets

`public/brand/logo-original.png` — the official MALAKAND THREADS brush-script logo supplied by the store owner. Every other brand file (`logo-black.png`, `logo-white.png`, `mark-white.png`, icons, `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`, `og-image.jpg`, `logo-square.png`) is generated from it with `node scripts/generate-brand-assets.mjs`. Fonts: Cormorant Garamond and Jost (SIL Open Font License, self-hosted via `next/font`).
