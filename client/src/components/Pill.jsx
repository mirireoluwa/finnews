const moodConfig = {
  bullish: { label: "Bullish", color: "var(--positive)", bg: "var(--positive-soft)", icon: "↑" },
  bearish: { label: "Bearish", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "↓" },
  mixed: { label: "Mixed", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "~" },
};

export default function Pill({ mood }) {
  const c = moodConfig[mood] || moodConfig.mixed;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 99,
      }}
    >
      <span style={{ fontSize: 13 }}>{c.icon}</span>
      {c.label}
    </span>
  );
}

