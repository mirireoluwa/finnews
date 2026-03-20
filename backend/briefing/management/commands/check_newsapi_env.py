"""Verify NewsAPI env setup (run from the backend folder: python manage.py check_newsapi_env)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
  help = "Check whether NEWSAPI_API_KEY is loaded for the briefing API."

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
