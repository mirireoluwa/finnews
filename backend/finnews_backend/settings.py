from pathlib import Path
import os

from dotenv import load_dotenv

try:
  import dj_database_url
except ImportError:
  dj_database_url = None  # type: ignore

try:
  import whitenoise  # noqa: F401
  _has_whitenoise = True
except ImportError:
  _has_whitenoise = False

BASE_DIR = Path(__file__).resolve().parent.parent
# Load NEWSAPI_API_KEY, ALPHAVANTAGE_API_KEY, etc. from backend/.env
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production")

DEBUG = os.environ.get("DEBUG", "True").lower() in ("1", "true", "yes")

_allowed_hosts_raw = os.environ.get("ALLOWED_HOSTS", "").strip()
if _allowed_hosts_raw:
  ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_raw.split(",") if h.strip()]
elif os.environ.get("RENDER"):
  # Render web service + local tools
  ALLOWED_HOSTS = [".onrender.com", "localhost", "127.0.0.1"]
else:
  ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
  "django.contrib.admin",
  "django.contrib.auth",
  "django.contrib.contenttypes",
  "django.contrib.sessions",
  "django.contrib.messages",
  "django.contrib.staticfiles",
  "rest_framework",
  "rest_framework.authtoken",
  "corsheaders",
  "accounts.apps.AccountsConfig",
  "briefing",
]

MIDDLEWARE = [
  "django.middleware.security.SecurityMiddleware",
]
if _has_whitenoise:
  MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")
MIDDLEWARE += [
  "django.contrib.sessions.middleware.SessionMiddleware",
  "corsheaders.middleware.CorsMiddleware",
  "django.middleware.common.CommonMiddleware",
  "django.middleware.csrf.CsrfViewMiddleware",
  "django.contrib.auth.middleware.AuthenticationMiddleware",
  "django.contrib.messages.middleware.MessageMiddleware",
  "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "finnews_backend.urls"

TEMPLATES = [
  {
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {
      "context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
      ],
    },
  },
]

WSGI_APPLICATION = "finnews_backend.wsgi.application"

if dj_database_url is not None:
  DATABASES = {
    "default": dj_database_url.config(
      default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
      conn_max_age=600,
      conn_health_checks=True,
    )
  }
else:
  DATABASES = {
    "default": {
      "ENGINE": "django.db.backends.sqlite3",
      "NAME": BASE_DIR / "db.sqlite3",
    }
  }

AUTH_PASSWORD_VALIDATORS = [
  {
    "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
  },
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

if _has_whitenoise:
  STORAGES = {
    "default": {
      "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
      "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
  }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
  "DEFAULT_RENDERER_CLASSES": [
    "rest_framework.renderers.JSONRenderer",
  ],
  "DEFAULT_AUTHENTICATION_CLASSES": [
    "rest_framework.authentication.TokenAuthentication",
    "rest_framework.authentication.SessionAuthentication",
  ],
}

# Local dev + optional production frontends (comma-separated), e.g. https://finnews.vercel.app
# Trailing slashes are stripped — django-cors-headers rejects origins with a path (e.g. ...vercel.app/).
def _normalize_cors_origin(origin: str) -> str:
  o = origin.strip()
  while o.endswith("/"):
    o = o[:-1]
  return o


_cors_raw = os.environ.get(
  "CORS_ALLOWED_ORIGINS",
  "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ALLOWED_ORIGINS = [
  _normalize_cors_origin(o) for o in _cors_raw.split(",") if o.strip()
]

# Optional: allow any https://*.vercel.app origin (preview + production subdomains) when
# CORS_ALLOWED_ORIGINS includes your production URL but previews use random hostnames.
_cors_vercel = os.environ.get("CORS_ALLOW_VERCEL_PREVIEWS", "").lower() in (
  "1",
  "true",
  "yes",
)
if _cors_vercel:
  CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[\w.-]+\.vercel\.app$",
  ]

if not DEBUG:
  # Render (and similar) terminate TLS at the edge; app receives HTTP + X-Forwarded-Proto.
  SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
  SESSION_COOKIE_SECURE = True
  CSRF_COOKIE_SECURE = True

_csrf_trusted = os.environ.get("CSRF_TRUSTED_ORIGINS", "").strip()
if _csrf_trusted:
  CSRF_TRUSTED_ORIGINS = [
    _normalize_cors_origin(o) for o in _csrf_trusted.split(",") if o.strip()
  ]
else:
  CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)
