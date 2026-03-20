import globeIcon from "../assets/globe.svg";
import ngxIcon from "../assets/ngx.svg";
import watchlistIcon from "../assets/watchlist.svg";
import dashboardIcon from "../assets/dashboard.svg";

const NAV_ITEMS = [
  { key: "summary", label: "Dashboard", icon: dashboardIcon },
  { key: "global", label: "Global", icon: globeIcon },
  { key: "ngx", label: "NGX", icon: ngxIcon },
  { key: "watchlist", label: "Watchlist", icon: watchlistIcon },
];

/**
 * Active tab: no filter — black strokes read as the same dark tone as --nav-active-fg (#041c2f).
 * Inactive: light theme keeps dark icons; dark theme inverts for contrast on the glass nav.
 */
function iconFilter(theme, isActive) {
  if (isActive) {
    return "none";
  }
  if (theme === "light") {
    return "none";
  }
  return "invert(1)";
}

export default function BottomNav({ active, onChange, theme = "dark" }) {
  return (
    <div
      className="app-bottom-nav"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 14,
        transform: "translateX(-50%)",
        zIndex: 40,
        background: "var(--nav-surface)",
        borderRadius: 22,
        border: "1px solid var(--nav-border)",
        padding: "10px 12px",
        backdropFilter: "blur(12px)",
        boxShadow: "none",
        display: "flex",
        gap: 8,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isActive ? 10 : 0,
              padding: isActive ? "9px 16px" : "9px 10px",
              borderRadius: 14,
              border: "none",
              background: isActive ? "var(--nav-active-bg)" : "transparent",
              color: isActive ? "var(--nav-active-fg)" : "var(--nav-inactive-fg)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              minWidth: isActive ? 0 : 44,
              transition: "all 0.15s ease-out",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 11,
                border: isActive ? "none" : "1px solid var(--nav-icon-ring)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "var(--nav-icon-well-active)" : "var(--nav-icon-well-inactive)",
              }}
            >
              <img
                src={item.icon}
                alt=""
                width={18}
                height={18}
                style={{
                  display: "block",
                  opacity: isActive ? 1 : theme === "light" ? 0.92 : 0.75,
                  filter: iconFilter(theme, isActive),
                }}
              />
            </span>
            {isActive && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
