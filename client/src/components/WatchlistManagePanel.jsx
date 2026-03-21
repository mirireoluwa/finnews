const inputBase = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  border: "1px solid var(--border-subtle)",
  background: "var(--bg)",
  color: "var(--text-primary)",
};

const btnPrimary = {
  border: "1px solid var(--btn-primary-border)",
  borderRadius: 10,
  padding: "11px 18px",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
  background: "var(--btn-primary-bg)",
  color: "var(--btn-primary-fg)",
  whiteSpace: "nowrap",
};

import { FinNewsLogoSpinnerInline } from "./FinNewsLogoSpinner.jsx";

const btnGhost = {
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  padding: "9px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  background: "transparent",
  color: "var(--text-muted)",
  fontWeight: 600,
};

/**
 * Company search + saved tickers — uses site CSS variables (dark/light).
 */
export default function WatchlistManagePanel({
  watchlist,
  onRemoveTicker,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searching,
  searchResults,
  searchError,
  didSearch,
  onAddFromResult,
  tagInput,
  onTagInputChange,
  onAddTyped,
  extraFooter,
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "20px 22px",
      }}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
        }}
      >
        Your watchlist
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {watchlist.length === 0 && (
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Add companies below — they’ll be included in the next briefing refresh.
          </span>
        )}
        {watchlist.map((t) => (
          <span
            key={t}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--accent-soft)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => onRemoveTicker(t)}
              aria-label={`Remove ${t}`}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                padding: 0,
                fontSize: 18,
                lineHeight: 1,
                opacity: 0.85,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <input
            className="fin-input"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !searching && onSearch()}
            disabled={searching}
            placeholder="Search by company name or ticker (Alpha Vantage)…"
            style={{
              ...inputBase,
              flex: "1 1 200px",
              minWidth: 0,
              opacity: searching ? 0.75 : 1,
            }}
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={!searchQuery.trim() || searching}
            style={{
              ...btnPrimary,
              opacity: searchQuery.trim() && !searching ? 1 : 0.45,
              cursor: searchQuery.trim() && !searching ? "pointer" : "not-allowed",
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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <input
            className="fin-input"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            placeholder="Optional tags (e.g. tech, banking) — comma separated"
            style={{
              ...inputBase,
              flex: "1 1 200px",
              minWidth: 0,
              borderStyle: "dashed",
              fontSize: 13,
              padding: "9px 12px",
            }}
          />
          <button
            type="button"
            onClick={onAddTyped}
            disabled={!searchQuery.trim()}
            style={{
              ...btnGhost,
              opacity: searchQuery.trim() ? 1 : 0.45,
              cursor: searchQuery.trim() ? "pointer" : "not-allowed",
            }}
          >
            Add as typed
          </button>
        </div>

        {searchError && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text-primary)",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 10,
              padding: "10px 12px",
              lineHeight: 1.5,
            }}
          >
            {searchError}
          </p>
        )}

        {searchResults.length > 0 && (
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {searchResults.map((r, ri) => (
              <div
                key={`${r.symbol}-${r.name}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom:
                    ri < searchResults.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.35,
                    }}
                  >
                    {r.name}{" "}
                    {r.symbol && (
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>({r.symbol})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {(r.region || "Global") + (r.currency ? ` · ${r.currency}` : "")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddFromResult(r)}
                  style={{
                    ...btnPrimary,
                    padding: "8px 14px",
                    fontSize: 13,
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}

        {didSearch && !searching && searchResults.length === 0 && !searchError && (
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: "14px 16px",
              color: "var(--text-muted)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            No matches for{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{searchQuery.trim()}</span>.
            <div style={{ marginTop: 8 }}>
              Try another spelling, or use <strong>Add as typed</strong> to add a custom name.
            </div>
          </div>
        )}

        {extraFooter}
      </div>
    </div>
  );
}
