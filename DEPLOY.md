# Deploy FinNews: **Render** (API) + **Vercel** (UI)

The **Django API** runs on [Render](https://render.com). The **React (Vite) app** runs on [Vercel](https://vercel.com). The browser talks to your Render URL via `VITE_API_URL` (set on Vercel at build time).

## 1. Push the repo to GitHub

Vercel and Render both deploy from Git.

## 2. Deploy the backend on Render

### Option A — Blueprint (`render.yaml`)

1. In Render: **New** → **Blueprint** → connect the repo.
2. Apply the blueprint. It creates:
   - **PostgreSQL** (`finnews-db`)
   - **Web service** `finnews-api` (`backend/`, gunicorn, migrations, collectstatic)
3. In the **web service** → **Environment**, set (or confirm):

   | Variable | Notes |
   |----------|--------|
   | `NEWSAPI_API_KEY` | Required for live headlines (production use may need a paid NewsAPI plan). |
   | `CORS_ALLOWED_ORIGINS` | Your Vercel URLs, comma-separated, **no trailing slashes**, e.g. `https://finnews.vercel.app,https://finnews-xxx.vercel.app` |
   | `ALPHAVANTAGE_API_KEY` | Optional (company search). |

   Generated / wired by the blueprint: `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DEBUG=False`, `PYTHON_VERSION`.

4. Wait for the first deploy. Copy the service URL, e.g. `https://finnews-api.onrender.com`.

### Option B — Manual web service

- **Root directory:** `backend`
- **Build:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start:** `gunicorn finnews_backend.wsgi:application --bind 0.0.0.0:$PORT`
- **Health check path:** `/health/`
- Add **PostgreSQL** and set `DATABASE_URL` (or use Render’s managed DB link).

Render sets `RENDER=true` automatically; `ALLOWED_HOSTS` includes `.onrender.com`.

## 3. Deploy the frontend on Vercel

1. **New Project** → import the same GitHub repo.
2. **Root Directory:** leave as **repository root** (uses root `vercel.json`, which builds `client/` → `client/dist`).
   - *Or* set root to **`client`** and rely on `client/vercel.json` instead.
3. **Environment variables** → **Production** (and **Preview** if you use previews):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your Render API origin, **no** trailing slash, e.g. `https://finnews-api.onrender.com` |

   `VITE_*` is inlined at **build** time. After changing it, **redeploy** the Vercel project.

4. Deploy.

## 4. CORS checklist

- `CORS_ALLOWED_ORIGINS` on Render must include **exactly** the Vercel origin(s) you use (`https://…`), e.g. `https://finnews.vercel.app`.
- For **Vercel preview** URLs (`https://*-git-*-*.vercel.app`), either:
  - add each preview origin to `CORS_ALLOWED_ORIGINS`, **or**
  - on Render set **`CORS_ALLOW_VERCEL_PREVIEWS=true`** (allows any `https://*.vercel.app`). Use only if you’re OK with that scope.

## 5. Verify

- Open `https://<your-render-service>/health/` → JSON `{"status":"ok"}`.
- Open the Vercel site, sign up / log in, load the dashboard. If the UI calls the wrong host, check `VITE_API_URL` and redeploy Vercel.

## 6. Optional env (Render)

| Variable | Purpose |
|----------|--------|
| `ALLOWED_HOSTS` | Comma-separated; override if you add a **custom domain** to the API. |
| `CSRF_TRUSTED_ORIGINS` | Usually leave unset; defaults mirror `CORS_ALLOWED_ORIGINS`. Set if you use the Django admin on a custom domain. |

## Files reference

| File | Role |
|------|------|
| `render.yaml` | Render Blueprint (Postgres + web). |
| `vercel.json` (repo root) | Vercel build for monorepo `client/`. |
| `client/vercel.json` | Used when Vercel **Root Directory** = `client`. |
| `client/src/main.jsx` | Reads `VITE_API_URL` → `axios.defaults.baseURL`. |
| `backend/.env.example` | Local + production env hints. |

More Vercel-only notes: **`VERCEL.md`**.
