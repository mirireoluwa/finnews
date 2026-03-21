import finnewsLogo from "../assets/finnews-logo.svg";

/**
 * Spinning FinNews mark for loading states.
 * @param {object} props
 * @param {number} [props.size=48] — height in px (width follows SVG aspect ratio)
 * @param {"onDark"|"onLight"} [props.variant="onDark"] — onDark = white logo on blue/dark UI
 * @param {string} [props.label="Loading"] — visible caption (set showLabel={false} to hide)
 * @param {boolean} [props.showLabel=true]
 */
export default function FinNewsLogoSpinner({
  size = 48,
  variant = "onDark",
  label = "Loading",
  showLabel = true,
  className = "",
}) {
  const h = size;
  const w = Math.max(12, Math.round((size * 35) / 52));
  const filter =
    variant === "onDark" ? "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.2))" : "none";

  return (
    <div
      className={`finnews-logo-spinner-root ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={showLabel && label ? label : "Loading"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: showLabel && label ? 14 : 0,
        textAlign: "center",
      }}
    >
      <div
        className="finnews-logo-spinner-rotate"
        style={{
          width: w,
          height: h,
          flexShrink: 0,
        }}
      >
        <img
          src={finnewsLogo}
          alt=""
          width={w}
          height={h}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter,
          }}
        />
      </div>
      {showLabel && label ? (
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            maxWidth: 280,
            lineHeight: 1.45,
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Compact row: spinner + text for buttons (flex children).
 */
export function FinNewsLogoSpinnerInline({ size = 22, variant = "onDark" }) {
  const h = size;
  const w = Math.max(10, Math.round((size * 35) / 52));
  const filter =
    variant === "onDark" ? "brightness(0) invert(1)" : "none";

  return (
    <span
      className="finnews-logo-spinner-rotate"
      style={{
        display: "inline-flex",
        width: w,
        height: h,
        verticalAlign: "middle",
        flexShrink: 0,
      }}
      aria-hidden
    >
      <img
        src={finnewsLogo}
        alt=""
        width={w}
        height={h}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter,
        }}
      />
    </span>
  );
}
