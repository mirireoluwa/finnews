import { useCallback, useState } from "react";
import axios from "axios";
import finnewsLogo from "../assets/finnews-logo.svg";
import { FinNewsLogoSpinnerInline } from "./FinNewsLogoSpinner.jsx";
import { patchAuthUser } from "../utils/authStorage.js";

const SUGGESTED = [
  "Dangote Cement",
  "MTN Nigeria",
  "Apple",
  "Tesla",
  "Zenith Bank",
  "JPMorgan Chase",
  "Nigerian Breweries",
  "Access Holdings",
];

const FOCUS_OPTIONS = [
  { id: "beginner", label: "New to investing" },
  { id: "longterm", label: "Long-term focus" },
  { id: "ngx", label: "Nigeria / NGX" },
  { id: "global", label: "Global markets" },
  { id: "active", label: "Active trading" },
];

const btnPrimary = {
  background: "var(--btn-primary-bg)",
  color: "var(--btn-primary-fg)",
  border: "1px solid var(--btn-primary-border)",
  borderRadius: 12,
  padding: "12px 22px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
};

const btnGhost = {
  background: "transparent",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-muted)",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
};

/**
 * Full-screen 3-step onboarding for first-time signups.
 */
export default function OnboardingFlow({
  user,
  setAuthUser,
  watchlist,
  setWatchlist,
  setBriefingMode,
  setAutoRefresh,
  theme,
  onFinished,
}) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");

  const [briefingChoice, setBriefingChoice] = useState(
    user?.preferences?.defaultBriefingMode === "live" ? "live" : "daily"
  );
  const [showMockHints, setShowMockHints] = useState(
    user?.preferences?.showMockBannerHints !== false
  );
  const [compactCharts, setCompactCharts] = useState(!!user?.preferences?.compactCharts);
  const [focusTags, setFocusTags] = useState(() => user?.preferences?.focusTags || []);

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.avatarDataUrl || null);
  const [profileNote, setProfileNote] = useState(user?.preferences?.profileNote || "");
  const [photoError, setPhotoError] = useState("");
  const [finishing, setFinishing] = useState(false);

  const isLight = theme === "light";

  const toggleSuggested = useCallback(
    (name) => {
      setWatchlist((prev) =>
        prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
      );
    },
    [setWatchlist]
  );

  async function runSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await axios.get("/api/company-search/", { params: { q } });
      setSearchResults(res.data?.results || []);
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      if (status === 503) {
        setSearchError("Search needs ALPHAVANTAGE_API_KEY on the server — add a company manually below.");
      } else {
        setSearchError(detail || e.message || "Search failed.");
      }
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addCompanyLabel(label) {
    if (!label) return;
    if (!watchlist.includes(label)) {
      setWatchlist((prev) => [...prev, label]);
    }
    setSearchQuery("");
    setSearchResults([]);
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file.");
      return;
    }
    if (file.size > 800 * 1024) {
      setPhotoError("Image must be under 800KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function toggleFocus(id) {
    setFocusTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function finishOnboarding() {
    const name = displayName.trim() || user.name;
    const prefs = {
      ...user.preferences,
      defaultBriefingMode: briefingChoice,
      showMockBannerHints: showMockHints,
      compactCharts,
      focusTags,
      profileNote: profileNote.trim(),
    };

    setPhotoError("");
    setFinishing(true);
    try {
      const next = await patchAuthUser({
        name,
        avatarDataUrl,
        onboardingCompleted: true,
        preferences: prefs,
        watchlist,
      });
      setAuthUser(next);
      if (next.watchlist?.length) setWatchlist(next.watchlist);
      setBriefingMode(briefingChoice);
      setAutoRefresh(briefingChoice === "live");
      try {
        window.localStorage.setItem("finnewsBriefingMode", briefingChoice);
      } catch {
        /* ignore */
      }
      onFinished({ briefingMode: briefingChoice });
    } catch (e) {
      setPhotoError(e.message || "Could not save your profile. Try again.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={finnewsLogo}
            alt=""
            width={22}
            height={32}
            style={{
              display: "block",
              objectFit: "contain",
              filter: isLight ? "none" : "brightness(0) invert(1)",
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 17 }}>FinNews</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
          Step {step} of 3
        </div>
      </header>

      {/* Step dots */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          padding: "16px 20px 0",
        }}
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              height: 4,
              flex: 1,
              maxWidth: 120,
              borderRadius: 2,
              background: n <= step ? "var(--btn-primary-bg)" : "var(--border-subtle)",
              opacity: n <= step ? 1 : 0.45,
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          padding: "28px 20px 48px",
          boxSizing: "border-box",
        }}
      >
        {step === 1 && (
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Companies you care about
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Build your watchlist — we’ll tailor headlines and the dashboard to these names. Pick at least one.
            </p>

            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px" }}>
              Suggestions — tap to add or remove
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
              {SUGGESTED.map((name) => {
                const on = watchlist.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSuggested(name)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: `1px solid ${on ? "var(--accent)" : "var(--border-subtle)"}`,
                      background: on ? "var(--accent-soft)" : "transparent",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {on ? "✓ " : ""}
                    {name}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>
              Search companies
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !searching && runSearch()}
                disabled={searching}
                placeholder="e.g. Apple, Dangote…"
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit",
                  opacity: searching ? 0.75 : 1,
                }}
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={searching || !searchQuery.trim()}
                style={{
                  ...btnPrimary,
                  opacity: searching || !searchQuery.trim() ? 0.7 : 1,
                  cursor: searching || !searchQuery.trim() ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {searching ? (
                  <>
                    <FinNewsLogoSpinnerInline size={18} variant="onDark" />
                    Searching…
                  </>
                ) : (
                  "Search"
                )}
              </button>
            </div>
            {searchError && (
              <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 10px" }}>{searchError}</p>
            )}
            {searchResults.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  margin: "0 0 16px",
                  padding: 0,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  overflow: "hidden",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {searchResults.map((r, i) => {
                  const label = r.symbol ? `${r.name} (${r.symbol})` : r.name;
                  return (
                    <li key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <button
                        type="button"
                        onClick={() => addCompanyLabel(label)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          background: "var(--bg-elevated)",
                          border: "none",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {label}
                        {r.region && (
                          <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{r.region}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {watchlist.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>
                  Your list ({watchlist.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {watchlist.map((c) => (
                    <span
                      key={c}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "var(--accent-soft)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {c}
                      <button
                        type="button"
                        aria-label={`Remove ${c}`}
                        onClick={() => setWatchlist((prev) => prev.filter((x) => x !== c))}
                        style={{
                          border: "none",
                          background: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="button"
                disabled={watchlist.length < 1 || searching}
                onClick={() => setStep(2)}
                style={{
                  ...btnPrimary,
                  opacity: watchlist.length < 1 || searching ? 0.45 : 1,
                  cursor: watchlist.length < 1 || searching ? "not-allowed" : "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Your preferences
            </h1>
            <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              How should FinNews work for you? You can change this anytime in your profile.
            </p>

            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px" }}>
              Briefing style
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              {[
                { id: "daily", title: "Daily snapshot", desc: "One curated dashboard per day — calmer for beginners." },
                { id: "live", title: "Live briefing", desc: "Fresh headlines now, with optional auto-refresh." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBriefingChoice(opt.id)}
                  style={{
                    flex: "1 1 220px",
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${briefingChoice === opt.id ? "var(--accent)" : "var(--border-subtle)"}`,
                    background: briefingChoice === opt.id ? "var(--accent-soft)" : "transparent",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px" }}>
              What describes you? (optional)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
              {FOCUS_OPTIONS.map((f) => {
                const on = focusTags.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFocus(f.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: `1px solid ${on ? "var(--accent)" : "var(--border-subtle)"}`,
                      background: on ? "var(--accent-soft)" : "transparent",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer", fontSize: 14 }}>
              <input type="checkbox" checked={showMockHints} onChange={(e) => setShowMockHints(e.target.checked)} />
              Show tips when demo / mock data is shown
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, cursor: "pointer", fontSize: 14 }}>
              <input type="checkbox" checked={compactCharts} onChange={(e) => setCompactCharts(e.target.checked)} />
              Use compact charts on market pages
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setStep(1)} style={btnGhost}>
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} style={btnPrimary}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Your profile
            </h1>
            <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Add a photo and confirm your name. Everything here stays on this device for this demo.
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 18,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Profile photo (optional)</label>
            <div style={{ marginTop: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: "2px solid var(--border-subtle)",
                  overflow: "hidden",
                  background: "var(--accent-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
              >
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (displayName || user.name || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <input type="file" accept="image/*" onChange={handlePhoto} />
                {avatarDataUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarDataUrl(null)}
                    style={{
                      display: "block",
                      marginTop: 8,
                      border: "none",
                      background: "none",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "inherit",
                      fontWeight: 600,
                    }}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            {photoError && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 16px" }}>{photoError}</p>}

            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
              Anything we should know? (optional)
            </label>
            <textarea
              value={profileNote}
              onChange={(e) => setProfileNote(e.target.value)}
              placeholder="e.g. I follow tech and banks in Lagos…"
              rows={3}
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px" }}>
              FinNews is for information only — not financial advice. Always do your own research.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setStep(2)} style={btnGhost}>
                Back
              </button>
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={finishing}
                style={{
                  ...btnPrimary,
                  opacity: finishing ? 0.85 : 1,
                  cursor: finishing ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {finishing ? (
                  <>
                    <FinNewsLogoSpinnerInline size={18} variant="onDark" />
                    Saving…
                  </>
                ) : (
                  "Start using FinNews"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
