from __future__ import annotations

from datetime import date
from typing import Any

from django.core.management.base import BaseCommand
from django.utils.timezone import now

from briefing.models import BriefingLog
from briefing.views import BriefingView


DEFAULT_DAILY_WATCHLIST: list[str] = [
  "Dangote Cement",
  "MTN Nigeria",
  "Apple",
  "Tesla",
  "Zenith Bank",
]


class Command(BaseCommand):
  help = "Generate and store today's daily financial briefing snapshot."

  def handle(self, *args: Any, **options: Any) -> None:
    today = now().strftime("%A, %d %B %Y")

    view = BriefingView()
    payload = view._build_live_payload(DEFAULT_DAILY_WATCHLIST, today)  # noqa: SLF001

    # Keep meta.mode consistent with the daily snapshot.
    meta = payload.get("meta") or {}
    if meta.get("mode") == "live":
      meta["mode"] = "daily"
      payload["meta"] = meta

    BriefingLog.objects.update_or_create(
      date_string=today,
      is_daily_snapshot=True,
      defaults={
        "watchlist": DEFAULT_DAILY_WATCHLIST,
        "payload": payload,
      },
    )

    self.stdout.write(
      self.style.SUCCESS(
        f"Generated daily briefing for {date.today().isoformat()} "
        f"with {len(DEFAULT_DAILY_WATCHLIST)} watchlist items."
      )
    )

