# Deploy FinNews on Vercel

Vercel hosts the **React (Vite) app** in `client/`. The **Django API** must run on another host (Render, Railway, Fly.io, etc.) and be reachable over HTTPS.

## Option A — Import from GitHub (recommended)

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import **`mirireoluwa/finnews`** (or your repo).
2. Leave **Root Directory** as the **repository root** (do not set it to `client` unless you use Option B below).
3. Vercel will read the root **`vercel.json`**: install and build run inside `client/`, output is `client/dist`.
4. **Environment variables** → **Production** (and Preview if you want):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your Django base URL, **no** trailing slash, e.g. `https://finnews-api.onrender.com` |

   Without `VITE_API_URL`, the built app calls `/api/...` on the Vercel domain and those routes will **not** reach Django.

5. Click **Deploy**.

## Option B — Root directory = `client`

1. In the project settings, set **Root Directory** to `client`.
2. Vercel uses **`client/vercel.json`** instead. Same env var: `VITE_API_URL`.
3. Build command defaults to `npm run build`, output `dist`.

## Backend checklist (not on Vercel)

- Set **`CORS_ALLOWED_ORIGINS`** (or your project’s equivalent) to include your Vercel URL, e.g. `https://finnews.vercel.app`.
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
