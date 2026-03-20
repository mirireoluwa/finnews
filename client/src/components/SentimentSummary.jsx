import { useMemo } from "react";

export default function SentimentSummary({ stories = [], compact = false }) {
  const { totals, totalStories, segments } = useMemo(() => {
    const base = { positive: 0, negative: 0, neutral: 0 };
    for (const s of stories) {
      if (s.impact && base[s.impact] !== undefined) {
        base[s.impact] += 1;
      }
    }
    const total = stories.length || 0;
    const safe = total || 1;
    const segments = [
      { key: "positive", count: base.positive, pct: (base.positive / safe) * 100, color: "var(--positive)", label: "Positive" },
      { key: "negative", count: base.negative, pct: (base.negative / safe) * 100, color: "#f87171", label: "Negative" },
      { key: "neutral", count: base.neutral, pct: (base.neutral / safe) * 100, color: "var(--text-muted)", label: "Neutral" },
    ];
    return { totals: base, totalStories: total, segments };
  }, [stories]);

  const barHeight = compact ? 10 : 12;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: compact ? "12px 14px" : "14px 16px",
        marginBottom: 20,
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        Story sentiment
      </p>

      {/* Stacked proportion bar — clearer than a small pie on dense dashboards */}
      <div
        style={{
          height: barHeight,
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
          background: "var(--accent-soft)",
          border: "1px solid var(--border-subtle)",
          marginBottom: 12,
        }}
        role="img"
        aria-label={`Sentiment: ${totals.positive} positive, ${totals.negative} negative, ${totals.neutral} neutral of ${totalStories} stories`}
      >
        {totalStories === 0 ? (
          <div style={{ flex: 1, background: "transparent" }} />
        ) : (
          segments.map((s) =>
            s.count > 0 ? (
              <div
                key={s.key}
                title={`${s.label}: ${s.count} (${((s.count / totalStories) * 100).toFixed(0)}%)`}
                style={{
                  width: `${(s.count / totalStories) * 100}%`,
                  minWidth: s.count > 0 ? 4 : 0,
                  background: s.color,
                  transition: "width 0.35s ease",
                }}
              />
            ) : null
          )
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: compact ? "8px 14px" : "10px 18px",
          fontSize: compact ? 11 : 12,
          alignItems: "center",
        }}
      >
        {segments.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.count}</span>
            <span style={{ color: "var(--text-muted)" }}>
              {s.label.toLowerCase()}
              {totalStories > 0 && (
                <span style={{ fontVariantNumeric: "tabular-nums", marginLeft: 4 }}>
                  ({((s.count / totalStories) * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: compact ? 11 : 12 }}>
          <strong style={{ color: "var(--text-primary)" }}>{totalStories}</strong> stories
        </span>
      </div>
    </div>
  );
}
