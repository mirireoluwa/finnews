import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import BottomNav from "./components/BottomNav.jsx";
import GlobalPage from "./pages/GlobalPage.jsx";
import NgxPage from "./pages/NgxPage.jsx";
import WatchlistPage from "./pages/WatchlistPage.jsx";
import SummaryPage from "./pages/SummaryPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import OnboardingFlow from "./components/OnboardingFlow.jsx";
import ProfileMenu from "./components/ProfileMenu.jsx";
import {
  clearSession,
  fetchMe,
  getToken,
  logoutAccount,
} from "./utils/authStorage.js";
import finnewsLogo from "./assets/finnews-logo.svg";
import "./App.css";

const DEFAULT_WATCHLIST = ["Dangote Cement", "MTN Nigeria", "Apple", "Tesla", "Zenith Bank"];

/** Max width for sticky header and main column (aligned). */
const LAYOUT_MAX_WIDTH = 1280;

function mockDataHelpText(meta) {
  if (!meta || meta.mode !== "mock") return "";
  const reason = meta.mock_reason;
  const detail = meta.mock_detail;
  if (reason === "newsapi_http_error" && detail && String(detail).includes("429")) {
    return (
      "NewsAPI rate limit hit (free tier: ~100 requests / 24h). Wait for the quota window to reset, reduce refreshes, or upgrade at newsapi.org. " +
      "After it works again, use Live now or clear cached snapshots."
    );
  }
  const byReason = {
    missing_newsapi_key:
      "Create backend/.env next to manage.py with one line (no quotes): NEWSAPI_API_KEY=your_key. Register at newsapi.org/register. Restart runserver (Ctrl+C, then python manage.py runserver). Verify: python manage.py check_newsapi_env. Then use Live now.",
    newsapi_http_error:
      "NewsAPI rejected the request (wrong key, quota, or HTTP error). Run: python manage.py check_newsapi_env --ping (from backend/) to see the exact code. Check the Django terminal log.",
    newsapi_api_error: detail
      ? `NewsAPI: ${detail}`
      : "NewsAPI returned an error in the response body. Check the Django log.",
    network_error:
      "The server could not reach newsapi.org (offline, DNS, or firewall).",
    unknown: detail
      ? `Details: ${detail}`
      : "See the Django server log for the exception that triggered demo data.",
  };
  return byReason[reason] || byReason.unknown;
}

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const skipWatchlistSyncRef = useRef(false);

  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [didSearch, setDidSearch] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [companyTags, setCompanyTags] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");
  const [lastFetched, setLastFetched] = useState("");
  const [liveChanged, setLiveChanged] = useState({ global: false, ngx: false });
  const [liveBanner, setLiveBanner] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [changedGlobalTitles, setChangedGlobalTitles] = useState([]);
  const [changedNgxTitles, setChangedNgxTitles] = useState([]);
  const [hadPrevious, setHadPrevious] = useState(false);
  const dataRef = useRef(null);
  const [theme, setTheme] = useState("dark");

  const [briefingMode, setBriefingMode] = useState(() => {
    try {
      const stored = window.localStorage.getItem("finnewsBriefingMode");
      return stored === "live" || stored === "daily" ? stored : "daily";
    } catch {
      return "daily";
    }
  });
  const prevBriefingModeRef = useRef(briefingMode);

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [appHeaderMenuOpen, setAppHeaderMenuOpen] = useState(false);
  const mobileHeaderMenuBtnRef = useRef(null);
  const mobileHeaderDrawerRef = useRef(null);
  const legacySummary = false;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Restore session from API token (any device / after deploy).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setSessionChecked(true);
        return;
      }
      try {
        const user = await fetchMe();
        if (!cancelled && user) {
          skipWatchlistSyncRef.current = true;
          setAuthUser(user);
          setWatchlist(user.watchlist?.length ? user.watchlist : DEFAULT_WATCHLIST);
          setCompanyTags(user.companyTags && typeof user.companyTags === "object" ? user.companyTags : {});
          const pref = user.preferences?.defaultBriefingMode;
          if (pref === "live" || pref === "daily") {
            setBriefingMode(pref);
            setAutoRefresh(pref === "live");
            try {
              window.localStorage.setItem("finnewsBriefingMode", pref);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist watchlist & tags to the server (debounced).
  useEffect(() => {
    if (!authUser || !sessionChecked) return;
    if (skipWatchlistSyncRef.current) {
      skipWatchlistSyncRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      axios.patch("/api/auth/me/", { watchlist, companyTags }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [watchlist, companyTags, authUser, sessionChecked]);

  useEffect(() => {
    if (!appHeaderMenuOpen) return;
    const onDown = (e) => {
      if (mobileHeaderDrawerRef.current?.contains(e.target)) return;
      if (mobileHeaderMenuBtnRef.current?.contains(e.target)) return;
      setAppHeaderMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAppHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [appHeaderMenuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const close = () => {
      if (mq.matches) setAppHeaderMenuOpen(false);
    };
    close();
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  const fetchNews = useCallback(async () => {
    // Live now mode: use the live briefing endpoint and enable change indicators.
    setBriefingMode("live");
    const isFirstLoad = !dataRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/briefing/", {
        watchlist,
        date: today,
      });
      const next = res.data;
      const prev = dataRef.current;
      const prevHadAny =
        !!prev?.global?.headline || !!prev?.ngx?.headline;
      setHadPrevious(prevHadAny);

      const prevGlobalStories = prev?.global?.stories || [];
      const prevNgxStories = prev?.ngx?.stories || [];
      const nextGlobalStories = next?.global?.stories || [];
      const nextNgxStories = next?.ngx?.stories || [];

      const nextGlobalHeadline = next?.global?.headline || "";
      const nextNgxHeadline = next?.ngx?.headline || "";
      const prevGlobalHeadline = prev?.global?.headline || "";
      const prevNgxHeadline = prev?.ngx?.headline || "";

      const prevGlobalByTitle = new Map(
        prevGlobalStories.map((s) => [s.title, { impact: s.impact, summary: s.summary }])
      );
      const prevNgxByTitle = new Map(
        prevNgxStories.map((s) => [s.title, { impact: s.impact, summary: s.summary }])
      );

      const changedGlobal = nextGlobalStories
        .filter((s) => {
          const prevEntry = prevGlobalByTitle.get(s.title);
          if (!prevEntry) return true;
          return (
            prevEntry.impact !== s.impact ||
            prevEntry.summary !== s.summary
          );
        })
        .map((s) => s.title);

      const changedNgx = nextNgxStories
        .filter((s) => {
          const prevEntry = prevNgxByTitle.get(s.title);
          if (!prevEntry) return true;
          return (
            prevEntry.impact !== s.impact ||
            prevEntry.summary !== s.summary
          );
        })
        .map((s) => s.title);

      setChangedGlobalTitles(changedGlobal);
      setChangedNgxTitles(changedNgx);

      setLiveChanged({
        global: !!nextGlobalHeadline && nextGlobalHeadline !== prevGlobalHeadline,
        ngx: !!nextNgxHeadline && nextNgxHeadline !== prevNgxHeadline,
      });

      setData(next);
      if (isFirstLoad) setTab("global");
      const nowStr = new Date().toLocaleTimeString();
      setLastFetched(nowStr);
      setLiveBanner(`Updated ${nowStr}`);
    } catch (e) {
      console.error(e);
      const status = e.response?.status;
      const detail = e.response?.data?.detail || e.response?.data?.error;
      if (status === 503) {
        setError(
          "Service temporarily unavailable. Check backend API keys (NEWSAPI/Alpha Vantage) and try again."
        );
      } else if (status === 502) {
        setError("Upstream provider error. Try again in a moment.");
      } else if (detail) {
        setError(detail);
      } else {
        setError(e.message || "Failed to fetch news.");
      }
    } finally {
      setLoading(false);
      // Hide banner quickly so it doesn't take too much space.
      setTimeout(() => setLiveBanner(""), 3500);
    }
  }, [watchlist, today]);

  async function fetchDaily() {
    // Daily dashboard mode: use the daily snapshot endpoint.
    setBriefingMode("daily");
    setAutoRefresh(false);
    const isFirstLoad = !dataRef.current;
    setLoading(true);
    setError("");
    setLiveBanner("");
    setLiveChanged({ global: false, ngx: false });
    setHadPrevious(false);
    setChangedGlobalTitles([]);
    setChangedNgxTitles([]);

    try {
      const res = await axios.post("/api/today-briefing/", {
        watchlist,
        date: today,
      });
      const next = res.data;
      setData(next);
      if (isFirstLoad) setTab("summary");
      const nowStr = new Date().toLocaleTimeString();
      setLastFetched(nowStr);
      // Keep banner empty in daily mode.
    } catch (e) {
      console.error(e);
      const status = e.response?.status;
      const detail = e.response?.data?.detail || e.response?.data?.error;
      if (status === 503) {
        setError(
          "Service temporarily unavailable. Check backend API keys (NEWSAPI/Alpha Vantage) and try again."
        );
      } else if (status === 502) {
        setError("Upstream provider error. Try again in a moment.");
      } else if (detail) {
        setError(detail);
      } else {
        setError(e.message || "Failed to fetch daily briefing.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNavChange(nextTab) {
    setTab(nextTab);
  }

  function handleSearchQueryChange(value) {
    setSearchQuery(value);
    setDidSearch(false);
    setSearchError("");
    setSearchResults([]);
  }

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    setDidSearch(true);
    try {
      const res = await axios.get("/api/company-search/", { params: { q } });
      setSearchResults(res.data?.results || []);
    } catch (e) {
      console.error(e);
      const status = e.response?.status;
      const detail = e.response?.data?.detail || e.response?.data?.error;
      if (status === 503) {
        setSearchError("Company search unavailable. Set ALPHAVANTAGE_API_KEY on the backend.");
      } else if (detail) {
        setSearchError(detail);
      } else {
        setSearchError(e.message || "Failed to search for companies.");
      }
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function attachTagsToCompany(label) {
    const raw = tagInput.trim();
    if (!raw) return;
    const tags = Array.from(
      new Set(
        raw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    );
    if (!tags.length) return;
    setCompanyTags((prev) => ({
      ...prev,
      [label]: Array.from(new Set([...(prev[label] || []), ...tags])),
    }));
  }

  function handleAddFromResult(result) {
    const label = result.symbol
      ? `${result.name} (${result.symbol})`
      : result.name || searchQuery.trim();
    if (!label) return;
    if (!watchlist.includes(label)) {
      setWatchlist((prev) => [...prev, label]);
      attachTagsToCompany(label);
    }
    setSearchResults([]);
    setSearchQuery("");
    setTagInput("");
  }

  function handleAddTyped() {
    const label = searchQuery.trim();
    if (!label) return;
    if (!watchlist.includes(label)) {
      setWatchlist((prev) => [...prev, label]);
      attachTagsToCompany(label);
    }
    setSearchQuery("");
    setTagInput("");
    setSearchResults([]);
  }

  // Auto-refresh the live briefing every 5 minutes while data is shown
  useEffect(() => {
    if (!data || !autoRefresh) return;
    if (briefingMode !== "live") return;
    const id = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [watchlist, today, data, autoRefresh, briefingMode, fetchNews]);

  // Theme initialisation + persistence
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    const prefersLight = window.matchMedia?.(
      "(prefers-color-scheme: light)"
    ).matches;
    setTheme(prefersLight ? "light" : "dark");
  }, []);

  // Apply theme to <html>: follow system while signed out; saved preference when signed in.
  useEffect(() => {
    if (!authUser) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const sync = () => {
        document.documentElement.setAttribute(
          "data-theme",
          mq.matches ? "light" : "dark"
        );
      };
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [authUser, theme]);

  useEffect(() => {
    window.localStorage.setItem("finnewsBriefingMode", briefingMode);
  }, [briefingMode]);

  useEffect(() => {
    // Daily snapshot doesn't need (or support) frequent auto-refresh.
    if (briefingMode === "daily") {
      setAutoRefresh(false);
    }
  }, [briefingMode]);

  useEffect(() => {
    const prev = prevBriefingModeRef.current;
    prevBriefingModeRef.current = briefingMode;
    // After using Daily mode, auto-refresh was turned off; re-enable when switching to Live
    // so periodic updates and the "Auto" toggle actually work.
    if (briefingMode === "live" && prev === "daily") {
      setAutoRefresh(true);
    }
  }, [briefingMode]);

  // Remember which section the user was last on
  useEffect(() => {
    const stored = window.localStorage.getItem("finnewsTab");
    if (stored && ["global", "ngx", "watchlist", "summary"].includes(stored)) {
      setTab(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("finnewsTab", tab);
  }, [tab]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const isLight = theme === "light";

  const watchlistPage = (
    <WatchlistPage
      briefingWatchlist={data?.watchlist}
      companyTags={companyTags}
      savedTickers={watchlist}
      onRemoveTicker={(t) => setWatchlist((prev) => prev.filter((x) => x !== t))}
      searchQuery={searchQuery}
      onSearchQueryChange={handleSearchQueryChange}
      onSearch={handleSearch}
      searching={searching}
      searchResults={searchResults}
      searchError={searchError}
      didSearch={didSearch}
      onAddFromResult={handleAddFromResult}
      tagInput={tagInput}
      onTagInputChange={setTagInput}
      onAddTyped={handleAddTyped}
      manageExtraFooter={null}
    />
  );

  if (!sessionChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-muted)",
          fontFamily: "'Inter',system-ui,sans-serif",
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!authUser) {
    return (
      <AuthPage
        onAuthenticated={(user) => {
          skipWatchlistSyncRef.current = true;
          setAuthUser(user);
          setWatchlist(user.watchlist?.length ? user.watchlist : DEFAULT_WATCHLIST);
          setCompanyTags(user.companyTags && typeof user.companyTags === "object" ? user.companyTags : {});
          const mode = user?.preferences?.defaultBriefingMode;
          if (mode === "live") {
            setBriefingMode("live");
            setAutoRefresh(true);
          } else if (mode === "daily") {
            setBriefingMode("daily");
            setAutoRefresh(false);
          }
          try {
            window.localStorage.setItem(
              "finnewsBriefingMode",
              mode === "live" || mode === "daily" ? mode : "daily"
            );
          } catch {
            /* ignore */
          }
        }}
      />
    );
  }

  if (authUser.onboardingCompleted === false) {
    return (
      <OnboardingFlow
        theme={theme}
        user={authUser}
        setAuthUser={setAuthUser}
        watchlist={watchlist}
        setWatchlist={setWatchlist}
        setBriefingMode={setBriefingMode}
        setAutoRefresh={setAutoRefresh}
        onFinished={({ briefingMode: bm }) => {
          setTab("summary");
          if (bm === "live") {
            fetchNews();
          } else {
            fetchDaily();
          }
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "'Inter',system-ui,sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a href="#main-content" className="fin-skip-link">
        Skip to main content
      </a>
      {/* Sticky rounded top bar */}
      <div
        className="app-header-sticky-outer"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "10px 14px 8px",
          background: "linear-gradient(180deg, var(--bg) 70%, transparent 100%)",
        }}
      >
        <div
          className="app-header-inner-wrap"
          style={{ position: "relative", maxWidth: LAYOUT_MAX_WIDTH, margin: "0 auto" }}
        >
          <header
            className="app-header-bar"
            style={{
              height: 56,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-glass)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: isLight ? "0 8px 32px rgba(15, 23, 42, 0.06)" : "0 8px 32px rgba(0, 0, 0, 0.25)",
              boxSizing: "border-box",
            }}
          >
            <div className="app-header-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={finnewsLogo}
                alt=""
                width={18}
                height={27}
                style={{
                  display: "block",
                  objectFit: "contain",
                  filter: isLight ? "none" : "brightness(0) invert(1)",
                }}
              />
              <span
                className="app-header-title-text"
                style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em" }}
              >
                FinNews
              </span>
            </div>
            <div className="app-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="app-header-desktop-only" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="app-header-meta" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{today}</span>
                  {briefingMode === "live" && lastFetched && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Live update · {lastFetched}
                      {autoRefresh ? " · auto every 5m" : " · manual refresh"}
                    </span>
                  )}
                  {briefingMode === "daily" && data && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Daily snapshot —{" "}
                      <button
                        type="button"
                        onClick={fetchNews}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          color: "var(--accent)",
                          font: "inherit",
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        switch to live updates
                      </button>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{isLight ? "☾" : "☀"}</span>
                  <span>{isLight ? "Dark" : "Light"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (briefingMode === "daily") return;
                    setAutoRefresh((v) => !v);
                  }}
                  style={{
                    background:
                      briefingMode === "daily"
                        ? "transparent"
                        : autoRefresh
                          ? "var(--accent-soft)"
                          : "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    opacity: briefingMode === "daily" ? 0.5 : 1,
                  }}
                  title={
                    briefingMode === "daily"
                      ? "Daily snapshot mode doesn't auto-refresh"
                      : "Automatically refresh the briefing every 5 minutes"
                  }
                >
                  <span style={{ fontWeight: 900 }}>
                    {briefingMode === "daily" ? "Daily" : autoRefresh ? "Auto" : "Manual"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("watchlist")}
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--accent)",
                    fontSize: 12,
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Watchlist
                </button>
              </div>
              <button
                ref={mobileHeaderMenuBtnRef}
                type="button"
                className="app-header-menu-btn"
                aria-label={appHeaderMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={appHeaderMenuOpen}
                onClick={() => setAppHeaderMenuOpen((o) => !o)}
                style={{
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  padding: 0,
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ☰
              </button>
              <ProfileMenu
                user={authUser}
                setAuthUser={setAuthUser}
                setBriefingMode={setBriefingMode}
                setAutoRefresh={setAutoRefresh}
                onSignOutRequest={() => setSignOutConfirmOpen(true)}
              />
            </div>
          </header>

          {appHeaderMenuOpen ? (
            <div
              ref={mobileHeaderDrawerRef}
              className="app-header-mobile-drawer"
              role="dialog"
              aria-label="App menu"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 6px)",
                padding: "12px 14px 16px",
                borderRadius: 16,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-glass)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: isLight ? "0 12px 40px rgba(15, 23, 42, 0.12)" : "0 16px 48px rgba(0, 0, 0, 0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                zIndex: 120,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  TODAY
                </span>
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{today}</span>
                {briefingMode === "live" && lastFetched ? (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
                    Live · {lastFetched}
                    {autoRefresh ? " · auto every 5m" : " · manual refresh"}
                  </span>
                ) : null}
                {briefingMode === "daily" && data ? (
                  <button
                    type="button"
                    onClick={() => {
                      fetchNews();
                      setAppHeaderMenuOpen(false);
                    }}
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "var(--accent)",
                      font: "inherit",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Switch to live updates
                  </button>
                ) : null}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme((t) => (t === "dark" ? "light" : "dark"));
                  }}
                  style={{
                    flex: "1 1 auto",
                    minWidth: "44%",
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    padding: "10px 12px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {isLight ? "☾ Dark mode" : "☀ Light mode"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (briefingMode === "daily") return;
                    setAutoRefresh((v) => !v);
                  }}
                  disabled={briefingMode === "daily"}
                  style={{
                    flex: "1 1 auto",
                    minWidth: "44%",
                    background:
                      briefingMode === "daily"
                        ? "transparent"
                        : autoRefresh
                          ? "var(--accent-soft)"
                          : "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    padding: "10px 12px",
                    borderRadius: 12,
                    cursor: briefingMode === "daily" ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    opacity: briefingMode === "daily" ? 0.5 : 1,
                  }}
                >
                  {briefingMode === "daily" ? "Daily snapshot" : autoRefresh ? "Auto refresh on" : "Manual refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("watchlist");
                    setAppHeaderMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    background: "var(--accent-soft)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--accent)",
                    fontSize: 14,
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Open watchlist
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {signOutConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 18, 42, 0.78)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setSignOutConfirmOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSignOutConfirmOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 400,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
              padding: 22,
              boxSizing: "border-box",
            }}
          >
            <h2
              id="signout-title"
              style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 900 }}
            >
              Sign out?
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              You’ll need to sign in again to access your watchlist and saved preferences on this device.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSignOutConfirmOpen(false)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border-subtle)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logoutAccount();
                  setAuthUser(null);
                  setWatchlist(DEFAULT_WATCHLIST);
                  setCompanyTags({});
                  setData(null);
                  setSignOutConfirmOpen(false);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#b91c1c",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {briefingMode === "live" && liveBanner && (
        <div
          style={{
            margin: "10px auto 0",
            maxWidth: LAYOUT_MAX_WIDTH,
            width: "100%",
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {liveBanner}
          </div>
        </div>
      )}

      <div
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          width: "100%",
          maxWidth: LAYOUT_MAX_WIDTH,
          margin: "0 auto",
          padding: "0 16px",
          paddingBottom: "max(92px, calc(92px + env(safe-area-inset-bottom, 0px)))",
          boxSizing: "border-box",
        }}
      >
        {/* Hero fetch area */}
        {!data && !loading && (
          <div style={{ textAlign: "center", padding: "72px 0 48px" }}>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Market Intelligence
            </p>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                margin: "0 0 12px",
                lineHeight: 1.2,
              }}
            >
              Your daily financial
              <br />
              briefing awaits.
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                margin: "0 0 40px",
                lineHeight: 1.6,
              }}
            >
              Live news from global markets and the Nigerian
              <br />
              Stock Exchange, simplified for you.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <button
                onClick={fetchDaily}
                style={{
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  border: "none",
                  padding: "13px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Get Today's Dashboard →
              </button>
              <button
                onClick={fetchNews}
                style={{
                  background: "transparent",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  padding: "13px 20px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Live now
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "72px 0" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Searching the web
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginBottom: 20,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Gathering global & NGX news, checking your watchlist…
            </p>
            <style>{`@keyframes pulse{0%,100%{opacity:0.2}50%{opacity:1}}`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              margin: "24px 0",
              padding: "14px 16px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 10,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#f87171", fontWeight: 700 }}>
              ⚠ {error}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Tip: if this keeps happening, confirm your backend is running and your API keys are set
              (NEWSAPI_API_KEY, ALPHAVANTAGE_API_KEY). For details, check the Django server logs.
            </p>
          </div>
        )}

        {/* Watchlist tab before first briefing load (e.g. onboarding) */}
        {!data && !loading && tab === "watchlist" && (
          <div style={{ marginTop: 24 }}>{watchlistPage}</div>
        )}

        {/* Data view */}
        {data && (
          <div style={{ marginTop: 32 }}>
            {data?.meta?.mode === "mock" && authUser?.preferences?.showMockBannerHints !== false && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "14px 16px",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#fbbf24",
                  }}
                >
                  You’re viewing demo (mock) headlines — not live NewsAPI results
                </p>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {mockDataHelpText(data.meta)}
                </p>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  Daily dashboard reuses today’s saved snapshot; after fixing the key, use{" "}
                  <strong>Live now</strong> or delete <code style={{ fontSize: 11 }}>db.sqlite3</code>{" "}
                  to drop cached mock snapshots.
                </p>
              </div>
            )}
            {/* Refresh row: avoid duplicating live time (already in sticky header) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
                gap: 16,
              }}
            >
              <div>
                {briefingMode === "daily" ? (
                  <>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Today&apos;s Dashboard
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "var(--text-muted)",
                      }}
                    >
                      One snapshot for today — use{" "}
                      <button
                        type="button"
                        onClick={fetchNews}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--accent)",
                          font: "inherit",
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Live updates
                      </button>{" "}
                      for changing headlines.
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tab === "summary"
                      ? "Dashboard"
                      : tab === "global"
                        ? "Global"
                        : tab === "ngx"
                          ? "NGX"
                          : tab === "watchlist"
                            ? "Watchlist"
                            : "Live"}
                  </p>
                )}
              </div>
              <button
                onClick={briefingMode === "live" ? fetchNews : fetchDaily}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {briefingMode === "live" ? "Refresh" : "Refresh Snapshot"}
              </button>
            </div>

            {/* GLOBAL */}
            {tab === "global" && data.global && (
              <GlobalPage
                global={data.global}
                globalIndex={data.global_index || []}
                hadPrevious={hadPrevious}
                changedGlobalTitles={changedGlobalTitles}
                liveChangedGlobal={liveChanged.global}
                compactCharts={!!authUser?.preferences?.compactCharts}
              />
            )}

            {/* NGX */}
            {tab === "ngx" && data.ngx && (
              <NgxPage
                ngx={data.ngx}
                ngxIndex={data.ngx_index || []}
                hadPrevious={hadPrevious}
                changedNgxTitles={changedNgxTitles}
                liveChangedNgx={liveChanged.ngx}
                compactCharts={!!authUser?.preferences?.compactCharts}
              />
            )}

            {/* WATCHLIST */}
            {tab === "watchlist" && watchlistPage}

            {/* DASHBOARD / SUMMARY */}
            {tab === "summary" && data.summary && (
              <SummaryPage
                summary={data.summary}
                meta={data.meta}
                global={data.global}
                ngx={data.ngx}
                onOpenGlobalTab={() => setTab("global")}
                onOpenNgxTab={() => setTab("ngx")}
              />
            )}
            {legacySummary && tab === "summary" && data.summary && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "20px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Sources
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>News</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                        NewsAPI.org (global + NGX)
                      </span>
                      {data?.meta?.mode && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "var(--accent)",
                          }}
                        >
                          {data.meta.mode}
                        </span>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Company Search</span>
                      <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                        Alpha Vantage
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "20px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    TL;DR
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "var(--text-primary)",
                      lineHeight: 1.7,
                    }}
                  >
                    {data.summary.tldr}
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "20px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 14px",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Key Takeaways
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {data.summary.key_takeaways?.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--accent)",
                            fontWeight: 800,
                            minWidth: 18,
                            marginTop: 2,
                          }}
                        >
                          0{i + 1}
                        </span>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--text-muted)",
                            lineHeight: 1.6,
                          }}
                        >
                          {t}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      color: "var(--accent)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Beginner Tip
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--text-primary)",
                      lineHeight: 1.65,
                    }}
                  >
                    {data.summary.beginner_tip}
                  </p>
                </div>

                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  For informational purposes only · Not financial advice · Consult a licensed advisor
                  before investing
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav active={tab} onChange={handleNavChange} theme={theme} />
    </div>
  );
}

