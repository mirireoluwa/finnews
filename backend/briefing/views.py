from datetime import datetime, timedelta
from typing import Any
import logging
import os

import requests
from django.conf import settings as django_settings
from django.utils.timezone import now
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BriefingLog
from .serializers import BriefingRequestSerializer


logger = logging.getLogger(__name__)

NEWSAPI_URL = "https://newsapi.org/v2/everything"
ALPHAVANTAGE_URL = "https://www.alphavantage.co/query"

# Wider coverage: fetch more from NewsAPI, keep up to this many stories per region.
_NEWSAPI_PAGE = int((os.environ.get("NEWSAPI_MARKET_PAGE_SIZE") or "40").strip())
NEWSAPI_MARKET_PAGE_SIZE = max(10, min(_NEWSAPI_PAGE, 100))
_MAX_STORIES = int((os.environ.get("MAX_MARKET_STORIES") or "30").strip())
MAX_MARKET_STORIES = max(5, min(_MAX_STORIES, 100))


def _classify_briefing_failure(exc: BaseException) -> tuple[str, str | None]:
  """Map an exception to a stable code + optional detail for the client."""
  msg = str(exc).strip()
  if isinstance(exc, RuntimeError) and "NEWSAPI_API_KEY" in msg:
    return "missing_newsapi_key", None
  if isinstance(exc, requests.HTTPError) and exc.response is not None:
    return "newsapi_http_error", f"HTTP {exc.response.status_code}"
  if isinstance(exc, RuntimeError) and (
    "NewsAPI" in msg or "newsapi" in msg.lower()
  ):
    return "newsapi_api_error", msg[:500] if msg else None
  if isinstance(exc, (requests.ConnectionError, requests.Timeout)):
    return "network_error", msg[:500] if msg else None
  return "unknown", msg[:500] if msg else None


class BriefingView(APIView):
  """
  POST /api/briefing/

  Expected request JSON:
  {
    "watchlist": ["Apple", "Tesla"],
    "date": "Monday, 1 January 2026"
  }

  Returns the structured briefing payload used by the React client.
  """

  def post(self, request, *args, **kwargs):
    request_serializer = BriefingRequestSerializer(data=request.data)
    request_serializer.is_valid(raise_exception=True)
    watchlist = request_serializer.validated_data.get("watchlist", [])
    date_str = request_serializer.validated_data.get("date") or now().strftime(
      "%A, %d %B %Y"
    )
    # Try to build a live briefing using NewsAPI.org.
    # If anything fails (no API key, network error, etc.), fall back to mock data.
    try:
      payload: dict[str, Any] = self._build_live_payload(watchlist, date_str)
    except Exception as exc:  # noqa: BLE001
      logger.exception("Falling back to mock payload: %s", exc)
      reason, detail = _classify_briefing_failure(exc)
      payload = self._build_mock_payload(
        watchlist,
        date_str,
        mock_reason=reason,
        mock_detail=detail if django_settings.DEBUG else None,
      )

    # Persist a copy, but never fail the request if logging breaks
    try:
      BriefingLog.objects.create(
        date_string=date_str, watchlist=watchlist, payload=payload
      )
    except Exception as exc:  # noqa: BLE001
      logger.warning("Failed to persist briefing log: %s", exc)

    return Response(payload, status=status.HTTP_200_OK)

  # ----- Live data using NewsAPI.org -----

  def _fetch_articles(
    self, *, api_key: str, query: str, language: str = "en", page_size: int = 6
  ) -> list[dict[str, Any]]:
    resp = requests.get(
      NEWSAPI_URL,
      params={
        "q": query,
        "language": language,
        "sortBy": "publishedAt",
        "pageSize": page_size,
      },
      headers={"X-Api-Key": api_key},
      timeout=10,
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("status") == "error":
      raise RuntimeError(
        payload.get("message") or payload.get("code") or "NewsAPI returned an error"
      )
    return payload.get("articles", []) or []

  def _classify_impact(self, text: str) -> str:
    lowered = text.lower()
    positive_keywords = ["rises", "rise", "gains", "gain", "higher", "up", "surge", "record high"]
    negative_keywords = ["falls", "fall", "losses", "lower", "down", "slump", "selloff", "tumble"]

    pos = any(word in lowered for word in positive_keywords)
    neg = any(word in lowered for word in negative_keywords)

    if pos and not neg:
      return "positive"
    if neg and not pos:
      return "negative"
    return "neutral"

  def _infer_market_mood(self, stories: list[dict[str, Any]]) -> str:
    pos = sum(1 for s in stories if s.get("impact") == "positive")
    neg = sum(1 for s in stories if s.get("impact") == "negative")
    if pos > neg:
      return "bullish"
    if neg > pos:
      return "bearish"
    return "mixed"

  def _filter_articles_for_ngx(self, articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Remove false positives: bare token 'NGX' matches paperless-ngx, nginx modules, PyPI, etc.
    """
    bad_title = (
      "paperless",
      "pypi",
      "python package",
      "npm ",
      "docker hub",
      "ngx module",
      "nginx",
    )
    bad_desc = ("pypi.org", "paperless-ngx", "npmjs.com")
    bad_source = ("pypi", "npm", "docker")
    out: list[dict[str, Any]] = []
    for art in articles:
      title = (art.get("title") or "").lower()
      desc = (art.get("description") or "").lower()
      url = (art.get("url") or "").lower()
      source = art.get("source")
      src = ""
      if isinstance(source, dict):
        src = (source.get("name") or "").lower()
      if any(b in title for b in bad_title):
        continue
      if any(b in desc for b in bad_desc):
        continue
      if any(b in src for b in bad_source):
        continue
      if "pypi.org" in url or "npmjs.com" in url:
        continue
      out.append(art)
    return out

  def _build_market_section(
    self, articles: list[dict[str, Any]], fallback_headline: str
  ) -> dict[str, Any]:
    stories: list[dict[str, Any]] = []
    for art in articles[:MAX_MARKET_STORIES]:
      title = art.get("title") or "Market update"
      source_name = ""
      source = art.get("source")
      if isinstance(source, dict):
        source_name = source.get("name") or ""
      description = art.get("description") or ""
      content = art.get("content") or ""
      base_text = description or content or title

      # Keep the summary short and approachable.
      summary = base_text.strip()
      if len(summary) > 320:
        summary = summary[:317].rsplit(" ", 1)[0] + "..."

      impact = self._classify_impact(f"{title} {description}")

      stories.append(
        {
          "title": title,
          "summary": summary,
          "impact": impact,
          "source": source_name,
        }
      )

    if not stories:
      stories.append(
        {
          "title": fallback_headline,
          "summary": (
            "No strong headlines were available from the news API right now. "
            "This usually means there are no major surprises in the market at the moment."
          ),
          "impact": "neutral",
          "source": "",
        }
      )

    headline = articles[0].get("title") if articles else fallback_headline
    market_mood = self._infer_market_mood(stories)

    mood_explanation_map = {
      "bullish": "Overall, the tone of today's headlines is more positive than negative.",
      "bearish": "Overall, headlines lean more negative, so investors are a bit more cautious.",
      "mixed": "Headlines are a mix of positives and negatives, so the picture is balanced.",
    }

    return {
      "headline": headline,
      "stories": stories,
      "market_mood": market_mood,
      "mood_explanation": mood_explanation_map[market_mood],
    }

  def _build_watchlist_items(
    self, *, api_key: str, watchlist: list[str]
  ) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for name in watchlist:
      try:
        articles = self._fetch_articles(
          api_key=api_key, query=f'"{name}" stock OR shares OR results', page_size=1
        )
      except Exception as exc:  # noqa: BLE001
        logger.warning("Watchlist fetch failed for %s: %s", name, exc)
        articles = []

      if articles:
        art = articles[0]
        title = art.get("title") or name
        desc = art.get("description") or ""
        base_text = desc or art.get("content") or ""
        summary = base_text.strip() or (
          "There is a recent headline about this company, but details are limited."
        )
        if len(summary) > 260:
          summary = summary[:257].rsplit(" ", 1)[0] + "..."
        impact = self._classify_impact(f"{title} {desc}")
        sentiment = impact
        tip = (
          "Short‑term headlines can move this stock, but it is usually better to decide based on "
          "your long‑term plan instead of one article."
        )
        news_text = summary
      else:
        sentiment = "neutral"
        news_text = (
          "No major headlines specifically about this company were found today. Its share price is "
          "likely moving with the wider market."
        )
        tip = (
          "For a long‑term investor, ordinary days without big news rarely require quick action."
        )

      items.append(
        {
          "company": name,
          "news": news_text,
          "sentiment": sentiment,
          "tip": tip,
        }
      )

    if not items:
      items.append(
        {
          "company": "Example Company",
          "news": "Add companies you care about so this section can be tailored to you.",
          "sentiment": "neutral",
          "tip": "Start with a few well‑known companies or index funds to keep things simple.",
        }
      )

    return items

  def _build_live_payload(self, watchlist: list[str], date_str: str) -> dict[str, Any]:
    api_key = (os.environ.get("NEWSAPI_API_KEY") or "").strip()
    if not api_key:
      raise RuntimeError("NEWSAPI_API_KEY environment variable is not set.")

    global_query = "global stock market OR world stocks OR equities today"
    # Avoid bare "NGX" — it matches unrelated tech (paperless-ngx, nginx, PyPI).
    ngx_query = (
      '"Nigerian Stock Exchange" OR "Nigeria stock market" OR "NSE Nigeria" '
      'OR "Nigerian equities" OR "Nigeria equities" OR "Lagos stock" '
      'OR "NGX All Share" OR "NGX index"'
    )

    # Global financial markets
    global_articles = self._fetch_articles(
      api_key=api_key,
      query=global_query,
      page_size=NEWSAPI_MARKET_PAGE_SIZE,
    )
    # Nigerian market / NGX (query + post-filter for residual junk)
    ngx_raw = self._fetch_articles(
      api_key=api_key,
      query=ngx_query,
      page_size=NEWSAPI_MARKET_PAGE_SIZE,
    )
    ngx_articles = self._filter_articles_for_ngx(ngx_raw)

    global_section = self._build_market_section(
      global_articles,
      fallback_headline="Latest updates from global stock markets.",
    )
    ngx_section = self._build_market_section(
      ngx_articles,
      fallback_headline="Latest updates from the Nigerian Stock Exchange (NGX).",
    )

    watchlist_items = self._build_watchlist_items(api_key=api_key, watchlist=watchlist)

    summary_section = {
      "tldr": (
        f"Global markets today: {global_section['headline']} "
        f"For Nigeria, {ngx_section['headline']}"
      ),
      "key_takeaways": [
        "Headlines give a quick snapshot of how investors are feeling today.",
        "News from big economies often affects markets around the world, including Nigeria.",
        "As a beginner, focus on understanding the story behind the moves, not just the numbers.",
      ],
      "beginner_tip": (
        "Try reading one or two headlines each day and ask yourself: "
        '"Does this change how I see my long‑term plan?" Often the answer will be no.'
      ),
    }

    # Keep using simple synthetic index series for now; you can later replace
    # this with real index history from a market data API (Alpha Vantage,
    # Twelve Data, etc).
    today = datetime.utcnow().date()

    def series(base: float) -> list[dict[str, Any]]:
      return [
        {
          "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
          "close": base + i * 15.0 + (i % 3) * 8.0,
        }
        for i in reversed(range(5))
      ]

    payload: dict[str, Any] = {
      "global": global_section,
      "ngx": ngx_section,
      "watchlist": watchlist_items,
      "summary": summary_section,
      "date": date_str,
      "global_index": series(5000.0),
      "ngx_index": series(90000.0),
    }
    payload["meta"] = {
      "mode": "live",
      "providers": {
        "newsapi": True,
        "alphavantage": bool((os.environ.get("ALPHAVANTAGE_API_KEY") or "").strip()),
      },
      "news_queries": {"global": global_query, "ngx": ngx_query},
    }

    return payload

  def _build_mock_payload(
    self,
    watchlist: list[str],
    date_str: str,
    *,
    mock_reason: str | None = None,
    mock_detail: str | None = None,
  ) -> dict[str, Any]:
    today = datetime.utcnow().date()

    def series(base: float) -> list[dict[str, Any]]:
      return [
        {
          "date": (today - timedelta(days=i)).strftime("%Y-%m-%d"),
          "close": base + i * 15.0 + (i % 3) * 8.0,
        }
        for i in reversed(range(5))
      ]

    global_section = {
      "headline": "Global stocks edge higher as investors watch interest rate outlook.",
      "stories": [
        {
          "title": "US and European markets tick up",
          "summary": (
            "Stock markets in the US and Europe rose slightly as investors bet that central "
            "banks might cut interest rates later this year. Lower rates make borrowing cheaper, "
            "which usually helps businesses and stock prices."
          ),
          "impact": "positive",
          "source": "Example Global Source",
        },
        {
          "title": "Oil prices steady after recent swings",
          "summary": (
            "Oil prices were little changed after a few volatile days. This matters because "
            "energy costs affect everything from transport to food prices."
          ),
          "impact": "neutral",
          "source": "Example Commodity Desk",
        },
        {
          "title": "Tech earnings season keeps investors watching guidance",
          "summary": (
            "Large technology companies are reporting results. Investors read management "
            "commentary for clues about spending and hiring in the year ahead."
          ),
          "impact": "neutral",
          "source": "Example Tech Desk",
        },
        {
          "title": "Dollar mixed as traders weigh data releases",
          "summary": (
            "The US dollar moved in both directions against major currencies as markets "
            "digested fresh economic data and comments from officials."
          ),
          "impact": "neutral",
          "source": "Example FX Wire",
        },
        {
          "title": "Asian markets follow Wall Street’s lead overnight",
          "summary": (
            "Indexes in several Asian markets opened higher after a positive session in the US, "
            "though gains were modest by the close."
          ),
          "impact": "positive",
          "source": "Example Asia Brief",
        },
        {
          "title": "Bond yields drift as inflation expectations ease slightly",
          "summary": (
            "Government bond yields edged lower in some regions, reflecting a small shift in "
            "how investors see inflation over the next year."
          ),
          "impact": "neutral",
          "source": "Example Rates Note",
        },
        {
          "title": "Retail sales data surprises to the upside in key economy",
          "summary": (
            "Consumers spent more than economists expected last month, a sign of resilience "
            "even as borrowing costs remain elevated."
          ),
          "impact": "positive",
          "source": "Example Macro Watch",
        },
        {
          "title": "Mining shares react to commodity price moves",
          "summary": (
            "Shares of mining companies were active as industrial metals prices shifted on "
            "supply headlines and China demand expectations."
          ),
          "impact": "neutral",
          "source": "Example Sector Scan",
        },
      ],
      "market_mood": "mixed",
      "mood_explanation": "Markets are slightly up, but investors are still cautious.",
    }

    ngx_section = {
      "headline": "Nigerian stocks close slightly higher on banking sector gains.",
      "stories": [
        {
          "title": "Banking stocks support NGX",
          "summary": (
            "Shares of major Nigerian banks rose, helping the overall market inch higher. "
            "This suggests investors are feeling a bit more confident about the financial sector."
          ),
          "impact": "positive",
          "source": "Example NGX Source",
        },
        {
          "title": "Consumer companies trade sideways",
          "summary": (
            "Many consumer-focused companies saw only small moves. This usually means there "
            "was no big new information changing how investors see them."
          ),
          "impact": "neutral",
          "source": "Example NGX Source",
        },
        {
          "title": "NGX index breadth improves modestly",
          "summary": (
            "More stocks advanced than declined in the session, a modest sign of improving "
            "breadth even though the headline index move was small."
          ),
          "impact": "positive",
          "source": "Example NGX Source",
        },
        {
          "title": "Foreign portfolio interest steady in Nigerian equities",
          "summary": (
            "Analysts note that offshore participation remains a key swing factor for "
            "liquidity on the exchange in the weeks ahead."
          ),
          "impact": "neutral",
          "source": "Example Markets Note",
        },
        {
          "title": "Energy-linked names in focus after oil moves",
          "summary": (
            "Locally listed names with exposure to oil and gas themes drew attention as global "
            "crude prices shifted during the week."
          ),
          "impact": "neutral",
          "source": "Example Energy Roundup",
        },
        {
          "title": "Telecom sector quiet ahead of regulatory updates",
          "summary": (
            "Telecom shares were little changed as investors waited for clarity on policy "
            "headlines that could affect tariffs and investment plans."
          ),
          "impact": "neutral",
          "source": "Example Sector Brief",
        },
        {
          "title": "Small caps see selective buying on earnings snippets",
          "summary": (
            "A handful of smaller companies moved on company-specific news while the wider "
            "small-cap segment remained mixed."
          ),
          "impact": "neutral",
          "source": "Example NGX Source",
        },
      ],
      "market_mood": "bullish",
      "mood_explanation": "More buyers than sellers today, especially in bank stocks.",
    }

    watchlist_items = [
      {
        "company": name,
        "news": (
          "No major headlines just for this company today, but its share price is moving "
          "with the wider market."
        ),
        "sentiment": "neutral",
        "tip": (
          "For most long‑term investors, normal daily ups and downs usually do not require "
          "quick decisions."
        ),
      }
      for name in watchlist
    ]

    if not watchlist_items:
      watchlist_items = [
        {
          "company": "Example Company",
          "news": "Example placeholder news for when your watchlist is empty.",
          "sentiment": "neutral",
          "tip": "Add companies you care about so this section can be tailored to you.",
        }
      ]

    summary_section = {
      "tldr": (
        "Markets around the world are slightly positive today, with Nigerian bank stocks "
        "helping the local market. Investors are hopeful about future interest rate cuts but "
        "are still careful."
      ),
      "key_takeaways": [
        "Global markets are slightly up, not moving dramatically.",
        "Nigerian banking stocks are currently supporting the local index.",
        "For beginners, it is better to focus on long‑term trends than single‑day moves.",
      ],
      "beginner_tip": (
        "Pick a simple plan, such as investing a fixed amount regularly, and avoid reacting "
        "emotionally to every market headline."
      ),
    }

    payload: dict[str, Any] = {
      "global": global_section,
      "ngx": ngx_section,
      "watchlist": watchlist_items,
      "summary": summary_section,
      "date": date_str,
      "global_index": series(5000.0),
      "ngx_index": series(90000.0),
    }
    payload["meta"] = {
      "mode": "mock",
      "providers": {
        "newsapi": False,
        "alphavantage": bool((os.environ.get("ALPHAVANTAGE_API_KEY") or "").strip()),
      },
    }
    if mock_reason:
      payload["meta"]["mock_reason"] = mock_reason
    if mock_detail:
      payload["meta"]["mock_detail"] = mock_detail
    return payload


class CompanySearchView(APIView):
  """
  GET /api/company-search/?q=Apple

  Uses Alpha Vantage's SYMBOL_SEARCH to find companies by name/symbol and
  returns a lightweight, frontend-friendly structure.
  """

  def get(self, request, *args, **kwargs):
    query = (request.query_params.get("q") or "").strip()
    if not query:
      return Response({"results": []})

    api_key = os.environ.get("ALPHAVANTAGE_API_KEY")
    if not api_key:
      return Response(
        {"detail": "Company search is temporarily unavailable.", "results": []},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
      )

    try:
      resp = requests.get(
        ALPHAVANTAGE_URL,
        params={
          "function": "SYMBOL_SEARCH",
          "keywords": query,
          "apikey": api_key,
        },
        timeout=10,
      )
      resp.raise_for_status()
      data = resp.json()
      matches = data.get("bestMatches") or []
    except Exception as exc:  # noqa: BLE001
      logger.warning("Company search failed for %s: %s", query, exc)
      return Response(
        {"detail": "Unable to search companies right now.", "results": []},
        status=status.HTTP_502_BAD_GATEWAY,
      )

    results: list[dict[str, Any]] = []
    for m in matches[:10]:
      results.append(
        {
          "symbol": m.get("1. symbol"),
          "name": m.get("2. name"),
          "region": m.get("4. region"),
          "currency": m.get("8. currency"),
          "matchScore": float(m.get("9. matchScore") or 0.0),
        }
      )

    return Response({"results": results})


class TodayBriefingView(APIView):
  """
  GET /api/today-briefing/

  Returns today's daily snapshot if it exists; otherwise builds one
  on demand using the same logic as BriefingView.
  """

  def get(self, request, *args, **kwargs):
    today_str = now().strftime("%A, %d %B %Y")

    default_watchlist = [
      "Dangote Cement",
      "MTN Nigeria",
      "Apple",
      "Tesla",
      "Zenith Bank",
    ]

    # Try to reuse a stored daily snapshot for the default watchlist.
    log = (
      BriefingLog.objects.filter(
        date_string=today_str,
        is_daily_snapshot=True,
        watchlist=default_watchlist,
      )
      .order_by("-created_at")
      .first()
    )
    if log:
      return Response(log.payload, status=status.HTTP_200_OK)

    # Fallback: build a fresh payload using the default watchlist.
    return self._build_and_store_today(default_watchlist, today_str)

  def post(self, request, *args, **kwargs):
    """
    POST /api/today-briefing/
    Body: { "watchlist": [...], "date": "..." }

    If a snapshot exists for the given day and watchlist, it is returned.
    Otherwise, a new snapshot is built and stored.
    """
    request_serializer = BriefingRequestSerializer(data=request.data)
    request_serializer.is_valid(raise_exception=True)
    watchlist = request_serializer.validated_data.get("watchlist") or []

    today_str = now().strftime("%A, %d %B %Y")
    if not watchlist:
      watchlist = [
        "Dangote Cement",
        "MTN Nigeria",
        "Apple",
        "Tesla",
        "Zenith Bank",
      ]

    # Try to reuse a stored daily snapshot for this exact watchlist.
    log = (
      BriefingLog.objects.filter(
        date_string=today_str,
        is_daily_snapshot=True,
        watchlist=watchlist,
      )
      .order_by("-created_at")
      .first()
    )
    if log:
      return Response(log.payload, status=status.HTTP_200_OK)

    return self._build_and_store_today(watchlist, today_str)

  def _build_and_store_today(self, watchlist: list[str], today_str: str) -> Response:
    view = BriefingView()
    try:
      payload: dict[str, Any] = view._build_live_payload(  # noqa: SLF001
        watchlist,
        today_str,
      )
    except Exception as exc:  # noqa: BLE001
      logger.exception("Failed to build live today briefing, using mock: %s", exc)
      reason, detail = _classify_briefing_failure(exc)
      payload = view._build_mock_payload(  # noqa: SLF001
        watchlist,
        today_str,
        mock_reason=reason,
        mock_detail=detail if django_settings.DEBUG else None,
      )

    # Mark this payload as a daily dashboard snapshot (even though it's built
    # using the same underlying live logic).
    meta = payload.get("meta") or {}
    if meta.get("mode") == "live":
      meta["mode"] = "daily"
      payload["meta"] = meta

    try:
      BriefingLog.objects.create(
        date_string=today_str,
        watchlist=watchlist,
        payload=payload,
        is_daily_snapshot=True,
      )
    except Exception as exc:  # noqa: BLE001
      logger.warning("Failed to persist today briefing snapshot: %s", exc)

    return Response(payload, status=status.HTTP_200_OK)

