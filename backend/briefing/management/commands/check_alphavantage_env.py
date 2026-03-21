"""Verify Alpha Vantage env + SYMBOL_SEARCH (run from backend: python manage.py check_alphavantage_env --ping)."""

from __future__ import annotations

import json
from typing import Any

import requests
from django.core.management.base import BaseCommand

from briefing.alphavantage_key import get_alphavantage_key

ALPHAVANTAGE_URL = "https://www.alphavantage.co/query"


class Command(BaseCommand):
  help = "Check ALPHAVANTAGE_* env and optionally ping SYMBOL_SEARCH."

  def add_arguments(self, parser) -> None:
    parser.add_argument(
      "--ping",
      action="store_true",
      help="Call SYMBOL_SEARCH once (keywords=IBM) and print JSON keys + match count.",
    )

  def handle(self, *args: Any, **options: Any) -> None:
    key = get_alphavantage_key()
    if not key:
      self.stdout.write(
        self.style.ERROR(
          "No Alpha Vantage key found. Set one of: ALPHAVANTAGE_API_KEY, "
          "ALPHA_VANTAGE_API_KEY, ALPHAVANTAGE_KEY (Render → Environment)."
        )
      )
      return

    masked = f"{key[:4]}…{key[-4:]}" if len(key) > 8 else "(short key)"
    self.stdout.write(self.style.SUCCESS(f"Key loaded (length {len(key)}, masked: {masked})"))

    if not options.get("ping"):
      self.stdout.write("")
      self.stdout.write("Run with --ping to test SYMBOL_SEARCH from this host.")
      return

    self.stdout.write("")
    self.stdout.write("Pinging SYMBOL_SEARCH (keywords=IBM)…")
    try:
      resp = requests.get(
        ALPHAVANTAGE_URL,
        params={
          "function": "SYMBOL_SEARCH",
          "keywords": "IBM",
          "apikey": key,
          "datatype": "json",
        },
        headers={"User-Agent": "FinNews-check_alphavantage_env/1.0"},
        timeout=15,
      )
    except requests.RequestException as exc:
      self.stdout.write(self.style.ERROR(f"Request failed: {exc}"))
      return

    self.stdout.write(f"HTTP {resp.status_code}")
    try:
      data = resp.json()
    except json.JSONDecodeError:
      self.stdout.write(self.style.ERROR(f"Body is not JSON (first 200 chars): {resp.text[:200]!r}"))
      return

    if not isinstance(data, dict):
      self.stdout.write(self.style.ERROR(f"JSON root is not an object: {type(data)}"))
      return

    keys = list(data.keys())
    self.stdout.write(f"Top-level JSON keys: {keys}")

    if data.get("Note"):
      self.stdout.write(self.style.WARNING(f"Note (often rate limit): {data['Note'][:400]}"))
    if data.get("Error Message"):
      self.stdout.write(self.style.ERROR(f"Error Message: {data['Error Message']}"))
    if data.get("Information"):
      self.stdout.write(self.style.WARNING(f"Information: {data['Information'][:400]}"))

    matches = data.get("bestMatches") or []
    self.stdout.write(f"bestMatches count: {len(matches)}")
    if matches:
      first = matches[0]
      self.stdout.write(f"First match keys (sample): {list(first.keys())[:6]}")
