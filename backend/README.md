# FinNews Backend (Django)

This Django project powers the financial news assistant used by the React frontend in `client/`.

It exposes JSON APIs:

- `POST /api/auth/register/` – create an account (JSON: `email`, `password`, `name`, optional `phone`). Returns `token` + `user` profile.
- `POST /api/auth/login/` – JSON: `email`, `password`. Returns `token` + `user`.
- `POST /api/auth/logout/` – requires `Authorization: Token <key>`; invalidates the token.
- `GET /api/auth/me/` – current user profile (requires token).
- `PATCH /api/auth/me/` – partial update: `name`, `phone`, `avatarDataUrl`, `preferences`, `watchlist`, `companyTags`, `onboardingCompleted` (camelCase JSON).
- `POST /api/briefing/` – accepts a watchlist and date, and returns a beginner‑friendly financial briefing plus simple chart data for the global market and the Nigerian Stock Exchange (NGX).
- `GET /api/today-briefing/` – returns today's daily snapshot if it exists, otherwise builds and stores one on demand using a default watchlist.
- `GET /api/company-search/?q=...` – searches for companies by name/symbol using Alpha Vantage and returns lightweight suggestion data for the watchlist search UI.

The briefing uses **NewsAPI.org** for real headlines when `NEWSAPI_API_KEY` is set (see below). If the key is missing or NewsAPI errors, the API still returns **200** with **mock/demo** stories so the UI keeps working—check `meta.mode` in the JSON (`live`, `daily`, or `mock`).

## Setup

From the `backend/` directory:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set NEWSAPI_API_KEY (required for real news, not mock data)
python manage.py migrate
python manage.py runserver
```

Environment variables are loaded automatically from **`backend/.env`** (via `python-dotenv` in `settings.py`).

This will start Django on `http://127.0.0.1:8000`. The Vite dev server in `client/` is already configured to proxy `/api/*` requests to this backend.

## API: `/api/briefing/`

**Request (JSON):**

```json
{
  "watchlist": ["Dangote Cement", "Apple", "Tesla"],
  "date": "Saturday, 28 February 2026"
}
```

- `watchlist` – list of company names you care about.
- `date` – optional human‑readable date string; if omitted, the backend uses the current day.

**Response (JSON, simplified):**

Matches the schema you designed in the frontend prompt:

```json
{
  "global": { "...": "..." },
  "ngx": { "...": "..." },
  "watchlist": [{ "...": "..." }],
  "summary": { "...": "..." },
  "date": "Saturday, 28 February 2026",
  "global_index": [
    { "date": "2026-02-23", "close": 5000.0 },
    { "date": "2026-02-24", "close": 5015.0 }
  ],
  "ngx_index": [
    { "date": "2026-02-23", "close": 90000.0 },
    { "date": "2026-02-24", "close": 9015.0 }
  ]
}
```

The React client uses:

- `global_index` and `ngx_index` for small line charts.
- `global.stories` and `ngx.stories` for sentiment pies.
- `watchlist` for the bar chart and per‑company cards.

## External services

- **NewsAPI.org** – used inside `BriefingView._build_live_payload` to fetch global and Nigerian market headlines. Put the key in **`backend/.env`** (loaded automatically):

  ```bash
  NEWSAPI_API_KEY=your_newsapi_key
  ```

  Check that Django sees it (from `backend/`):

  ```bash
  python manage.py check_newsapi_env
  python manage.py check_newsapi_env --ping   # real test call; shows quota / key errors
  ```

  **Note:** NewsAPI’s **free** developer key is meant for **local development** only (requests must originate from your machine). If Django runs on **Render/Heroku/etc.**, NewsAPI often returns an error unless you use a **paid** plan that allows server-side calls.

- **Alpha Vantage** – powers watchlist / onboarding **company search** (`SYMBOL_SEARCH`). Set **`ALPHAVANTAGE_API_KEY`** in the environment (Render dashboard). The app also accepts **`ALPHA_VANTAGE_API_KEY`** or **`ALPHAVANTAGE_KEY`** if you named it differently.

  **If search always returns nothing or errors:**

  1. **Free tier limits** – Alpha Vantage’s free API is **very** limited (on the order of **25 requests per day** for the whole key, shared across all users and endpoints). Heavy testing can exhaust the quota; responses often include a `Note` about call frequency. Upgrade or wait for the daily reset.
  2. **Wrong env name on Render** – Must be linked to the **web service** that runs Gunicorn, not only a one-off job. Redeploy after changing env.
  3. **Stray quotes** – Value should be `YKEY123` not `"YKEY123"` in the dashboard (the server strips one pair of quotes if present).
  4. **Diagnose from the server** (same env as production):

  ```bash
  cd backend
  python manage.py check_alphavantage_env
  python manage.py check_alphavantage_env --ping
  ```

  `--ping` runs a real `SYMBOL_SEARCH` for `IBM` and prints HTTP status, JSON keys, `Note` / `Error Message`, and match count.

## CORS (hosted frontend)

If the React app is on another origin (e.g. **Vercel**), set in **`backend/.env`**:

```bash
CORS_ALLOWED_ORIGINS=https://fin-news.xyz,http://localhost:5173
```

You can keep `BriefingLog` in `briefing/models.py` to store what was sent each day so you can audit past briefings if needed. If the database write fails for any reason, the API will still respond successfully with the briefing payload.

## Daily snapshot generation

To pre‑compute a briefing once per day, use the management command:

```bash
cd backend
python manage.py generate_daily_briefing
```

You can wire this into cron (or any scheduler) to run every morning, for example:

```cron
0 7 * * * /path/to/venv/bin/python /path/to/backend/manage.py generate_daily_briefing
```

The frontend can then consume `/api/today-briefing/` to always show the latest generated snapshot while still allowing the user to manually refresh if desired.

