# Finnews

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

## Deploy frontend on Vercel

Vercel hosts the **static React app** only. The **Django API** must run elsewhere (e.g. [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), or your VPS).

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Set **Root Directory** to `client`.
4. Framework: **Vite** (auto-detected). `vercel.json` enables SPA routing.
5. **Environment variables** (Production):

   | Name            | Value                                      |
   |-----------------|--------------------------------------------|
   | `VITE_API_URL`  | Public URL of your Django app (no trailing slash), e.g. `https://finnews-api.onrender.com` |

6. Deploy. Open the Vercel URL; the app will call `VITE_API_URL` for `/api/...`.

## Deploy backend (summary)

- Run Django with `gunicorn`, set `DJANGO_SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, and **`CORS_ALLOWED_ORIGINS`** to your Vercel URL (see `backend/.env.example`).
- Use a production database (Postgres) instead of SQLite for real traffic.
- Set `NEWSAPI_API_KEY` (and optionally `ALPHAVANTAGE_API_KEY`) in the host’s environment.

See `backend/README.md` for API details.

## License

Use and modify for your own projects.
