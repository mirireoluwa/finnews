import { useId, useLayoutEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const FALLBACK = { line1: "#38bdf8", line2: "#7dd3fc" };

function chartVarName(colorProp) {
  if (colorProp?.includes("chart-line-2")) return "--chart-line-2";
  return "--chart-line-1";
}

/** Read --chart-line-* from <html> so area gradients match light/dark theme. */
function useThemeChartStroke(colorProp) {
  const varName = chartVarName(colorProp);
  const [stroke, setStroke] = useState(() => {
    if (typeof document === "undefined") return FALLBACK.line1;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return raw || (varName === "--chart-line-2" ? FALLBACK.line2 : FALLBACK.line1);
  });
  useLayoutEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      setStroke(raw || (varName === "--chart-line-2" ? FALLBACK.line2 : FALLBACK.line1));
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [varName]);
  return stroke;
}

export default function MarketIndexChart({
  title,
  data = [],
  color = "var(--chart-line-2)",
  compact = false,
}) {
  const gradId = useId().replace(/:/g, "");
  const stroke = useThemeChartStroke(color);
  const chartHeight = compact ? 120 : 168;

  const domain = useMemo(() => {
    if (!data.length) return [0, 1];
    const closes = data.map((d) => Number(d.close)).filter((n) => !Number.isNaN(n));
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pad = (max - min) * 0.12 || max * 0.02 || 1;
    return [min - pad, max + pad];
  }, [data]);

  if (!data.length) return null;

  const pctChange =
    data.length >= 2
      ? (((data[data.length - 1].close - data[0].close) / data[0].close) * 100).toFixed(2)
      : null;

  const formatY = (v) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
    return Number(v).toFixed(0);
  };

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 14,
        padding: "14px 16px 10px",
        marginBottom: 20,
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {title}
        </p>
        {pctChange && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: Number(pctChange) >= 0 ? "var(--positive)" : "#f87171",
            }}
          >
            {Number(pctChange) >= 0 ? "↑" : "↓"} {Math.abs(Number(pctChange)).toFixed(2)}% <span style={{ fontWeight: 500, opacity: 0.85 }}>({data.length}d)</span>
          </span>
        )}
      </div>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
                <stop offset="55%" stopColor={stroke} stopOpacity={0.12} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 8"
              stroke="var(--border-subtle)"
              vertical={false}
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatY}
              width={44}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-subtle)", strokeWidth: 1, strokeDasharray: "4 4" }}
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
              labelStyle={{ color: "var(--text-muted)", fontSize: 11 }}
              formatter={(value) => [formatY(value), "Close"]}
            />
            <Area
              type="natural"
              dataKey="close"
              stroke={stroke}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--bg-elevated)", fill: stroke }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
