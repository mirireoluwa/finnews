"""Resolve Alpha Vantage API key from environment (Render / local)."""

from __future__ import annotations

import os


def get_alphavantage_key() -> str:
  """
  Read key from the first set variable among common names.
  Strips whitespace, BOM, and a single pair of surrounding quotes (common copy/paste mistakes).
  """
  for name in (
    "ALPHAVANTAGE_API_KEY",
    "ALPHA_VANTAGE_API_KEY",
    "ALPHAVANTAGE_KEY",
  ):
    raw = os.environ.get(name)
    if not raw:
      continue
    s = raw.strip().strip("\ufeff")
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
      s = s[1:-1].strip()
    if s:
      return s
  return ""
