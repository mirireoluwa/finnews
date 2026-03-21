/**
 * Renders client/public/og-image.png using the exact FinNews mark from
 * src/assets/finnews-logo.svg (embedded as data-URI so paths match the file 1:1).
 * Run: npm run build:og   (also runs before vite build)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const W = 1200;
const H = 630;

const logoPath = join(root, "src/assets/finnews-logo.svg");
let logoSvg = readFileSync(logoPath, "utf8").trim();
// Dark brand fill → white so the mark reads on the navy OG background
logoSvg = logoSvg.replace(/#201B21/gi, "#ffffff");
// Drop XML declaration if present (keeps data-URI clean)
logoSvg = logoSvg.replace(/<\?xml[^?]*\?>\s*/i, "");

const logoB64 = Buffer.from(logoSvg, "utf8").toString("base64");
const logoDataUri = `data:image/svg+xml;base64,${logoB64}`;

// Native size 35×52 — scale to ~220px tall, preserve aspect
const logoH = 220;
const logoW = Math.round((35 / 52) * logoH);
const padX = 72;
const padY = Math.round((H - logoH) / 2);
const textX = padX + logoW + 36;

const compositeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#152a42"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <image
    xlink:href="${logoDataUri}"
    href="${logoDataUri}"
    x="${padX}"
    y="${padY}"
    width="${logoW}"
    height="${logoH}"
    preserveAspectRatio="xMidYMid meet"
  />
  <text
    x="${textX}"
    y="${Math.round(H / 2 - 18)}"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="68"
    font-weight="800"
    fill="#ffffff"
  >FinNews</text>
  <text
    x="${textX}"
    y="${Math.round(H / 2 + 38)}"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="26"
    font-weight="500"
    fill="#94a3b8"
  >Global &amp; NGX market briefings</text>
  <line
    x1="${textX}"
    y1="${Math.round(H / 2 + 58)}"
    x2="${textX + 240}"
    y2="${Math.round(H / 2 + 58)}"
    stroke="#22d3ee"
    stroke-width="3"
    stroke-opacity="0.85"
  />
</svg>
`;

const out = join(root, "public", "og-image.png");
await sharp(Buffer.from(compositeSvg)).png({ compressionLevel: 9 }).toFile(out);
console.log("Wrote", out, "(mark from", logoPath + ")");
