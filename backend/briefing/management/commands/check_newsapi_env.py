"""Verify NewsAPI env setup (run from the backend folder: python manage.py check_newsapi_env)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import requests
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
  help = "Check whether NEWSAPI_API_KEY is loaded for the briefing API."

  def add_arguments(self, parser) -> None:
    parser.add_argument(
      "--ping",
      action="store_true",
      help="Call NewsAPI once (tiny request) and print HTTP status + body message.",
    )

  def handle(self, *args: Any, **options: Any) -> None:
    base_dir = Path(settings.BASE_DIR)
    env_path = base_dir / ".env"
    self.stdout.write(f"Expected .env path: {env_path.resolve()}")
    self.stdout.write(f".env file exists: {env_path.is_file()}")

    raw = os.environ.get("NEWSAPI_API_KEY")
    key = (raw or "").strip()
    if not key:
      self.stdout.write(self.style.ERROR("NEWSAPI_API_KEY is NOT set or is empty after Django started."))
      self.stdout.write("")
      self.stdout.write("Fix:")
      self.stdout.write(f"  1. Create or edit: {env_path.resolve()}")
      self.stdout.write('  2. Add one line (no quotes, no spaces around =):')
      self.stdout.write("       NEWSAPI_API_KEY=your_key_here")
      self.stdout.write("  3. Stop runserver (Ctrl+C) and start it again from the backend folder.")
      return

    masked = f"{key[:4]}…{key[-4:]}" if len(key) > 8 else "(short key)"
    self.stdout.write(self.style.SUCCESS(f"NEWSAPI_API_KEY is set (length {len(key)}, ends like: {masked})"))
    self.stdout.write("If the app still shows mock data, click Live now or delete db.sqlite3 to clear cached snapshots.")

    if not options.get("ping"):
      self.stdout.write("")
      self.stdout.write("Tip: run with --ping to test the key against NewsAPI from this machine.")
      return

    url = "https://newsapi.org/v2/everything"
    try:
      resp = requests.get(
        url,
        params={"q": "stocks", "language": "en", "pageSize": 1, "sortBy": "publishedAt"},
        headers={"X-Api-Key": key},
        timeout=15,
      )
    except requests.RequestException as exc:
      self.stdout.write(self.style.ERROR(f"Request failed (network): {exc}"))
      return

    self.stdout.write(f"NewsAPI HTTP status: {resp.status_code}")
    try:
      body = resp.json()
    except json.JSONDecodeError:
      self.stdout.write(resp.text[:500])
      return

    if body.get("status") == "error":
      self.stdout.write(self.style.ERROR(f"NewsAPI error: {body.get('code')} — {body.get('message')}"))
      self.stdout.write("")
      self.stdout.write("Common fixes:")
      self.stdout.write("  • Wrong key or extra spaces/quotes in backend/.env")
      self.stdout.write("  • Free developer keys only work when Django runs on localhost (not from cloud hosts like Render).")
      self.stdout.write("  • Daily quota exceeded — wait or upgrade at newsapi.org")
      return

    articles = body.get("articles") or []
    self.stdout.write(self.style.SUCCESS(f"OK — got {len(articles)} article(s) in test response."))
