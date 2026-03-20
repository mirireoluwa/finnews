import WatchlistManagePanel from "../components/WatchlistManagePanel.jsx";
import WatchlistSentimentChart from "../components/WatchlistSentimentChart.jsx";

const sentimentIcon = { positive: "↑", negative: "↓", neutral: "→" };
const sentimentColor = { positive: "var(--accent)", negative: "#ef4444", neutral: "var(--text-muted)" };

export default function WatchlistPage({
  briefingWatchlist,
  companyTags = {},
  savedTickers,
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
  manageExtraFooter,
}) {
  const items = briefingWatchlist || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <WatchlistManagePanel
        watchlist={savedTickers}
        onRemoveTicker={onRemoveTicker}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearch={onSearch}
        searching={searching}
        searchResults={searchResults}
        searchError={searchError}
        didSearch={didSearch}
        onAddFromResult={onAddFromResult}
        tagInput={tagInput}
        onTagInputChange={onTagInputChange}
        onAddTyped={onAddTyped}
        extraFooter={manageExtraFooter}
      />

      {!items.length && (
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          Refresh your briefing (Dashboard or Live) to load watchlist headlines for the tickers above.
        </p>
      )}

      {items.length > 0 && <WatchlistSentimentChart items={items} />}

      {items.map((w, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              {w.company}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: sentimentColor[w.sentiment] || sentimentColor.neutral,
              }}
            >
              {sentimentIcon[w.sentiment]}
            </span>
          </div>
          {companyTags[w.company] && companyTags[w.company].length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {companyTags[w.company].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            {w.news}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              paddingTop: 10,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>What this means: </span>
            {w.tip}
          </p>
        </div>
      ))}
    </div>
  );
}
