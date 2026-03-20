import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

export default function WatchlistSentimentChart({ items = [] }) {
  const data = items.map((w) => ({
    name: w.company,
    sentimentScore: w.sentiment === "positive" ? 1 : w.sentiment === "negative" ? -1 : 0,
  }));

  if (!data.length) return null;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "14px 16px 10px",
        marginBottom: 16,
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
        Watchlist sentiment
      </p>
      <div style={{ width: "100%", height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="18%" margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="var(--border-subtle)" vertical={false} strokeOpacity={0.55} />
            <ReferenceLine y={0} stroke="var(--border-subtle)" strokeWidth={1} />
            <XAxis
              dataKey="name"
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-22}
              textAnchor="end"
              height={52}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[-1.15, 1.15]}
              ticks={[-1, 0, 1]}
              tickFormatter={(v) => (v === 1 ? "Pos" : v === -1 ? "Neg" : "Neu")}
              width={36}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
              formatter={(v) => (v === 1 ? "Positive" : v === -1 ? "Negative" : "Neutral")}
            />
            <Bar dataKey="sentimentScore" radius={[8, 8, 8, 8]} maxBarSize={36} animationDuration={500}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.sentimentScore === 1
                      ? "var(--positive)"
                      : entry.sentimentScore === -1
                        ? "#f87171"
                        : "#94a3b8"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
