/** Thin separator; `inset` true = 20px sides, or pass a number for horizontal margin in px */
export default function Divider({ inset = false }) {
  const hMargin =
    typeof inset === "number" ? `0 ${inset}px` : inset ? "0 20px" : 0;

  return (
    <div
      role="separator"
      style={{
        height: 1,
        background: "var(--border-subtle)",
        margin: hMargin,
        flexShrink: 0,
      }}
    />
  );
}
