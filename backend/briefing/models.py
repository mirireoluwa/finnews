from django.db import models


class BriefingLog(models.Model):
  """Optional record of generated briefings for auditing."""

  created_at = models.DateTimeField(auto_now_add=True)
  date_string = models.CharField(max_length=128)
  watchlist = models.JSONField()
  payload = models.JSONField()
  is_daily_snapshot = models.BooleanField(default=False)

  class Meta:
    ordering = ["-created_at"]

