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

export default function GlobalPage({
  global,
  globalIndex,
  hadPrevious,
  changedGlobalTitles,
  liveChangedGlobal,
  compactCharts = false,
}) {
  if (!global) return null;

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
        <Pill mood={global.market_mood} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {global.mood_explanation}
        </span>
        {liveChangedGlobal && (
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
        {hadPrevious && changedGlobalTitles.length > 0 && (
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
            {changedGlobalTitles.length} changed
          </span>
        )}
      </div>

      <MarketIndexChart
        title="Global Market Index (e.g. S&P 500)"
        data={globalIndex || []}
        color="var(--chart-line-1)"
        compact={compactCharts}
      />

      <SentimentSummary stories={global.stories} compact={compactCharts} />

      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: `22px ${inset}px 18px` }}>
          <p style={sectionLabel}>Global markets</p>
          {global.headline && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              {global.headline}
            </p>
          )}
        </div>

        <ExpandableStoryList
          key={`global-${global.headline}-${(global.stories || []).length}`}
          stories={global.stories}
          section="global"
          inset={inset}
        />
      </div>
    </div>
  );
}
