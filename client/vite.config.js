import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Normalize to https origin with no trailing slash. */
function normalizeOrigin(raw) {
  const s = (raw || "").trim().replace(/\/$/, "");
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/**
 * Base URL for Open Graph / Twitter cards (no trailing slash).
 * Many crawlers (Slack, LinkedIn, iMessage) require an absolute https og:image URL.
 * Order: VITE_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL (custom domain) → VERCEL_URL.
 */
function publicSiteOrigin() {
  const explicit = normalizeOrigin(process.env.VITE_SITE_URL);
  if (explicit) return explicit;
  const production = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (production) return production;
  const vercel = (process.env.VERCEL_URL || "").trim();
  if (vercel) return `https://${vercel}`;
  return "";
}

function htmlSocialMetaTags() {
  const origin = publicSiteOrigin();
  const ogImage = origin ? `${origin}/og-image.png` : "/og-image.png";
  const ogUrl = origin ? `${origin}/` : "/";
  const canonical = origin ? `\n    <link rel="canonical" href="${ogUrl}" />` : "";
  const secureMeta =
    typeof ogImage === "string" && ogImage.startsWith("https://")
      ? `\n    <meta property="og:image:secure_url" content="${ogImage}" />`
      : "";
  // Help debug production previews in Vercel build logs
  console.log(
    "[finnews-social-meta] og:image =",
    ogImage,
    origin ? `(origin from env)` : `(relative — set VITE_SITE_URL on Vercel for reliable previews)`
  );
  return { ogImage, ogUrl, canonical, secureMeta };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "finnews-social-meta",
      transformIndexHtml(html) {
        const { ogImage, ogUrl, canonical, secureMeta } = htmlSocialMetaTags();
        return html
          .replaceAll("%OG_IMAGE%", ogImage)
          .replaceAll("%OG_URL%", ogUrl)
          .replaceAll("%FINNEWS_CANONICAL%", canonical)
          .replaceAll("%OG_IMAGE_SECURE_META%", secureMeta);
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
