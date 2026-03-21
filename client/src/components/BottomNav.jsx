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

const GLYPH_SVG_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  style: { display: "block" },
};

/**
 * Inline SVGs with currentColor so the active tab icon matches the label (inherits button `color`).
 * (CSS mask-image on external .svg URLs was rendering as a solid block in several browsers.)
 */
function NavGlyphActive({ tabKey }) {
  switch (tabKey) {
    case "summary":
      return (
        <svg {...GLYPH_SVG_PROPS}>
          <path
            d="M3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H20.4C20.7314 14 21 14.2686 21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "global":
      return (
        <svg {...GLYPH_SVG_PROPS}>
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 12.5L8 14.5L7 18L8 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 20.5L16.5 18L14 17V13.5L17 12.5L21.5 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 5.5L18.5 7L15 7.5V10.5L17.5 9.5H19.5L21.5 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 10.5L5 8.5L7.5 8L9.5 5L8.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "ngx":
      return (
        <svg {...GLYPH_SVG_PROPS}>
          <path
            d="M20 10C20 14.4183 12 22 12 22C12 22 4 14.4183 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "watchlist":
      return (
        <svg {...GLYPH_SVG_PROPS}>
          <path
            d="M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

/** Inactive icons: light keeps black strokes; dark inverts for contrast on navy glass. */
function iconFilterInactive(theme) {
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
        bottom: "max(14px, env(safe-area-inset-bottom, 0px))",
        transform: "translateX(-50%)",
        zIndex: 40,
        maxWidth: "calc(100vw - 20px)",
        boxSizing: "border-box",
        background: "var(--nav-surface)",
        borderRadius: 22,
        border: "1px solid var(--nav-border)",
        padding: "10px 12px",
        backdropFilter: "blur(12px)",
        boxShadow: "none",
        display: "flex",
        gap: 8,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
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
              /* Match header Auto chip: subtle border when selected */
              border: isActive ? "1px solid var(--border-subtle)" : "none",
              background: isActive ? "var(--nav-active-bg)" : "transparent",
              color: isActive ? "var(--nav-active-fg)" : "var(--nav-inactive-fg)",
              fontSize: 13,
              fontWeight: isActive ? 800 : 600,
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
              {isActive ? (
                <NavGlyphActive tabKey={item.key} />
              ) : (
                <img
                  src={item.icon}
                  alt=""
                  width={18}
                  height={18}
                  style={{
                    display: "block",
                    opacity: theme === "light" ? 0.92 : 0.75,
                    filter: iconFilterInactive(theme),
                  }}
                />
              )}
            </span>
            {isActive && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
