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
   | `CORS_ALLOWED_ORIGINS` | Your live site origin(s), comma-separated, **no trailing slashes**, e.g. `https://fin-news.xyz` (add `http://localhost:5173` for local dev if needed). |
   | `ALPHAVANTAGE_API_KEY` | Optional (company search). |
   | **`FRONTEND_URL`** | **Your public app URL** (no trailing slash), e.g. `https://fin-news.xyz` — used in **forgot-password** emails. Without it, reset requests are accepted but no email is sent (check logs). |
   | `EMAIL_HOST`, `EMAIL_HOST_PASSWORD`, … | Optional SMTP. If omitted, reset emails go to the **server console** (see Render logs for the link). **Gmail:** `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_USE_TLS=true`, `EMAIL_HOST_USER=your@gmail.com`, `EMAIL_HOST_PASSWORD=` [App Password](https://support.google.com/accounts/answer/185833) (not your normal Gmail password). `DEFAULT_FROM_EMAIL=FinNews <your@gmail.com>`. |

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

## Troubleshooting: “Network Error” on login or **forgot password** (live site)

Forgot password uses the **same API** as login (`POST /api/auth/password-reset/`). If you see a network error, the browser usually never gets a response from the API.

1. **`VITE_API_URL` on the frontend host** (e.g. Vercel) must be your Render API, e.g. `https://finnews-api.onrender.com` — **no trailing slash**. Redeploy after changing it (Vite bakes this in at build time).
2. **Render → `CORS_ALLOWED_ORIGINS`** must include the **exact** origin users see in the address bar: `https://fin-news.xyz` **or** `https://www.fin-news.xyz` (add both if you use both).
3. **Render free tier:** first request after idle can take ~30–60s (cold start); retry.
4. **Password reset still returns 200** even if email fails; a network error means the **HTTP request** never completed—fix URL/CORS first. After that, set **`FRONTEND_URL`** and Gmail/SMTP on Render so mail actually sends.

## Live headlines (NewsAPI) on Render

“Live updates” call **`POST /api/briefing/`**, which uses **NewsAPI** from your Render server.

- **Free NewsAPI developer keys** are often **not allowed** for requests that originate from cloud hosts (only localhost / dev). You may always see **demo (mock)** headlines until you use a **NewsAPI plan that allows production** server-side use (check [newsapi.org](https://newsapi.org) terms and pricing).
- **429 / quota:** the free tier is ~**100 requests/day**; each live refresh uses several requests. Heavy use hits the limit quickly.
- Set **`NEWSAPI_API_KEY`** on Render. Check logs: `Falling back to mock payload` means NewsAPI failed.

## 5. Verify

- Open `https://<your-render-service>/` → JSON with `"service": "finnews-api"` and `"health": "/health/"`.
- Open `https://<your-render-service>/health` or `/health/` → JSON `{"status":"ok"}`.

If you see plain **“Not Found”** with no JSON, the hostname may be wrong (check the exact URL on the Render **Dashboard** → your web service), or the latest code isn’t deployed yet.
- Open your live site (e.g. `https://fin-news.xyz`), sign up / log in, load the dashboard. If the UI calls the wrong host, check `VITE_API_URL` on your host (e.g. Vercel) and redeploy the frontend.

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
