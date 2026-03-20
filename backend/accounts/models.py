from __future__ import annotations

from django.conf import settings
from django.db import models


def default_preferences() -> dict:
  return {
    "defaultBriefingMode": "daily",
    "showMockBannerHints": True,
    "compactCharts": False,
    "focusTags": [],
    "profileNote": "",
  }


def default_watchlist() -> list[str]:
  return [
    "Dangote Cement",
    "MTN Nigeria",
    "Apple",
    "Tesla",
    "Zenith Bank",
  ]


class UserProfile(models.Model):
  """
  App-specific data for django.contrib.auth.models.User.
  Passwords stay on User (hashed); never store raw passwords here.
  """

  user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="app_profile",
  )
  phone = models.CharField(max_length=64, blank=True, default="")
  avatar_data_url = models.TextField(blank=True, default="")
  preferences = models.JSONField(default=default_preferences)
  watchlist = models.JSONField(default=default_watchlist)
  company_tags = models.JSONField(default=dict)
  onboarding_completed = models.BooleanField(default=False)

  class Meta:
    verbose_name = "user profile"
    verbose_name_plural = "user profiles"

  def __str__(self) -> str:
    return f"Profile({self.user.email})"
