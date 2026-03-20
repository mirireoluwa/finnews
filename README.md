# FinNews

Beginner-friendly financial news: **Django** API (`backend/`) + **React / Vite** UI (`client/`).

## Accounts & auth

- Users are stored in the **Django database** (`django.contrib.auth.User` + `accounts.UserProfile`).
- Passwords are **hashed** (never stored in plain text).
- The SPA keeps an API **token** in `localStorage` (`finnewsAuthToken`) and sends `Authorization: Token …` on each request.
- **Sign out** deletes the token on the server and clears local storage.
- **Saved stories** (stars on headlines) still use **browser `localStorage` only** — not synced across devices unless you extend the API later.

Create an admin user (optional):

```bash
cd backend && source .venv/bin/activate
python manage.py createsuperuser
# Then open http://127.0.0.1:8000/admin/
```

## Local development

1. **Backend** (from `backend/`):

   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Set NEWSAPI_API_KEY in .env
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend** (from `client/`):

   ```bash
   npm install
   npm run dev
   ```

   Vite proxies `/api` → `http://127.0.0.1:8000` (see `vite.config.js`).

## GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/finnews.git
git branch -M main
git push -u origin main
```

Do **not** commit `backend/.env` or real API keys (they are in `.gitignore`).

## Deploy (Vercel + Render)

**Step-by-step:** **`DEPLOY.md`** — Django API on **[Render](https://render.com)** (`render.yaml`), React app on **[Vercel](https://vercel.com)** (root `vercel.json`).

**Minimum**

1. **Render:** deploy `backend/` (Blueprint or manual), set `NEWSAPI_API_KEY`, `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app`.
2. **Vercel:** import repo, set **`VITE_API_URL=https://your-service.onrender.com`** (no trailing slash), deploy.

Vercel-only tips: **`VERCEL.md`**. API details: **`backend/README.md`**.

## License

Use and modify for your own projects.
