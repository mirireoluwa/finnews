import Pill from "../components/Pill.jsx";
import ExpandableStoryList from "../components/ExpandableStoryList.jsx";
import SentimentSummary from "../components/SentimentSummary.jsx";
import MarketIndexChart from "../components/MarketIndexChart.jsx";

const sectionLabel = {
  margin: 0,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--accent)",
};

export default function NgxPage({
  ngx,
  ngxIndex,
  hadPrevious,
  changedNgxTitles,
  liveChangedNgx,
  compactCharts = false,
}) {
  if (!ngx) return null;

  const inset = 24;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <Pill mood={ngx.market_mood} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {ngx.mood_explanation}
        </span>
        {liveChangedNgx && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              border: "1px solid var(--border-subtle)",
              color: "var(--accent)",
            }}
          >
            Updated
          </span>
        )}
        {hadPrevious && changedNgxTitles.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              border: "1px solid var(--border-subtle)",
              color: "var(--accent)",
            }}
            title="Stories that changed since last refresh"
          >
            {changedNgxTitles.length} changed
          </span>
        )}
      </div>

      <MarketIndexChart
        title="NGX All Share Index"
        data={ngxIndex || []}
        color="var(--chart-line-2)"
        compact={compactCharts}
      />

      <SentimentSummary stories={ngx.stories} compact={compactCharts} />

      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: `22px ${inset}px 18px` }}>
          <p style={sectionLabel}>Nigeria / NGX</p>
          {ngx.headline && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              {ngx.headline}
            </p>
          )}
        </div>

        <ExpandableStoryList
          key={`ngx-${ngx.headline}-${(ngx.stories || []).length}`}
          stories={ngx.stories}
          section="ngx"
          inset={inset}
        />
      </div>
    </div>
  );
}
