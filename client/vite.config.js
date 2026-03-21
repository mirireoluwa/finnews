import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Base URL for Open Graph / Twitter cards (no trailing slash). */
function publicSiteOrigin() {
  const fromEnv = (process.env.VITE_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = (process.env.VERCEL_URL || "").trim();
  if (vercel) return `https://${vercel}`;
  return "";
}

function htmlSocialMetaTags() {
  const origin = publicSiteOrigin();
  const ogImage = origin ? `${origin}/og-image.png` : "/og-image.png";
  const ogUrl = origin ? `${origin}/` : "/";
  const canonical = origin ? `\n    <link rel="canonical" href="${ogUrl}" />` : "";
  return { ogImage, ogUrl, canonical };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "finnews-social-meta",
      transformIndexHtml(html) {
        const { ogImage, ogUrl, canonical } = htmlSocialMetaTags();
        return html
          .replaceAll("%OG_IMAGE%", ogImage)
          .replaceAll("%OG_URL%", ogUrl)
          .replaceAll("%FINNEWS_CANONICAL%", canonical);
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
