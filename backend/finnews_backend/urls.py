from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path


def health(_request):
  return JsonResponse({"status": "ok"})


def root(_request):
  """Helpful when checking the service URL (some clients strip or add slashes)."""
  return JsonResponse(
    {
      "service": "finnews-api",
      "status": "ok",
      "health": "/health/",
    }
  )


urlpatterns = [
  path("", root),
  re_path(r"^health/?$", health),
  path("admin/", admin.site.urls),
  path("api/auth/", include("accounts.urls")),
  path("api/", include("briefing.urls")),
]

