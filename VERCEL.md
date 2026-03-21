# Deploy FinNews on Vercel

**Full stack (API on Render + UI here):** see **`DEPLOY.md`**.

Vercel hosts the **React (Vite) app** in `client/`. The **Django API** must run on another host (e.g. **Render** — see `render.yaml`) and be reachable over HTTPS.

## Option A — Import from GitHub (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import **`mirireoluwa/finnews`** (or your repo).
2. Leave **Root Directory** as the **repository root** (do not set it to `client` unless you use Option B below).
3. Vercel will read the root **`vercel.json`**: install and build run inside `client/`, output is `client/dist`.
4. **Environment variables** → **Production** (and Preview if you want):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your Django base URL, **no** trailing slash, e.g. `https://finnews-api.onrender.com` |
   | `VITE_SITE_URL` (recommended) | Your **public site URL** with `https://`, **no** trailing slash, e.g. `https://fin-news.xyz` — used so `og:image` and Twitter cards use an **absolute** URL (Slack, LinkedIn, iMessage often ignore relative image URLs). |

   Without `VITE_API_URL`, the built app calls `/api/...` on the Vercel domain and those routes will **not** reach Django.

5. Click **Deploy**.

### Link preview (Open Graph) image not showing?

1. Set **`VITE_SITE_URL`** to the **same origin** people use when sharing the link (your custom domain if you use one), then **redeploy** the frontend (Vite bakes this in at build time).
2. After deploy, confirm the image is real PNG, not HTML:  
   `curl -sI "https://YOUR_DOMAIN/og-image.png"` → should show `content-type: image/png`.
3. Refresh cached metadata: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (also helps other networks that cache OG tags).

## Option B — Root directory = `client`

1. In the project settings, set **Root Directory** to `client`.
2. Vercel uses **`client/vercel.json`** instead. Same env var: `VITE_API_URL`.
3. Build command defaults to `npm run build`, output `dist`.

## Backend checklist (not on Vercel)

- Set **`CORS_ALLOWED_ORIGINS`** on the API to include your public site, e.g. `https://fin-news.xyz`.
- Production: `DEBUG=False`, `ALLOWED_HOSTS`, `DJANGO_SECRET_KEY`, Postgres (or similar), `NEWSAPI_API_KEY` in the host env.

See **`backend/.env.example`** and the main **`README.md`**.

## CLI (optional)

```bash
npm i -g vercel   # or: npx vercel
cd /path/to/finnews
vercel            # link project, preview
vercel --prod     # production
```

Set `VITE_API_URL` in the Vercel dashboard under **Settings → Environment Variables**.
