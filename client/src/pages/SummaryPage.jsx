import { useReducer } from "react";
import Divider from "../components/Divider.jsx";
import { readSavedStories, toggleSavedStory } from "../utils/savedStories.js";
import { storyBodyExcerpt } from "../utils/storyText.js";

const card = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: "20px",
  boxSizing: "border-box",
};

const labelStyle = {
  margin: "0 0 14px",
  fontSize: 11,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 600,
};

const headlineMoreBtn = {
  width: "100%",
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg)",
  color: "var(--accent)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const PREVIEW_HEADLINES = 4;

function HeadlinePanel({ title, section, onViewMore, viewMoreLabel }) {
  const all = section?.stories || [];

  if (!section) return null;

  const stories = all.slice(0, PREVIEW_HEADLINES);
  const remaining = Math.max(0, all.length - PREVIEW_HEADLINES);

  return (
    <div style={{ ...card, height: "100%" }}>
      <p style={{ ...labelStyle, marginBottom: 8 }}>{title}</p>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.45,
        }}
      >
        {section.headline}
      </p>
      <div>
        {stories.map((s, i) => {
          const body = storyBodyExcerpt(s);
          const bodyShort = body && body.length > 140 ? `${body.slice(0, 137)}…` : body;
          return (
          <div key={`${title}-${i}-${s.title?.slice(0, 32) || i}`}>
            {i > 0 && <Divider />}
            <div style={{ padding: "12px 0" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.4,
                }}
              >
                {s.title}
              </p>
              {bodyShort ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {bodyShort}
                </p>
              ) : null}
              {s.source && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.source}
                </p>
              )}
            </div>
          </div>
          );
        })}
      </div>
      {remaining > 0 && onViewMore ? (
        <>
          <button type="button" style={headlineMoreBtn} onClick={onViewMore}>
            {viewMoreLabel || "View more"}
          </button>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            {PREVIEW_HEADLINES} of {all.length} shown on dashboard — open the tab for the full list
          </p>
        </>
      ) : null}
    </div>
  );
}

export default function SummaryPage({
  summary,
  meta,
  global,
  ngx,
  onOpenGlobalTab,
  onOpenNgxTab,
}) {
  const [, bumpSavedList] = useReducer((x) => x + 1, 0);
  const savedStories = readSavedStories();

  if (!summary) return null;

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: 16,
    alignItems: "stretch",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top row: sources + TL;DR side by side on wide screens */}
      <div style={grid}>
        <div style={card}>
          <p style={labelStyle}>Sources</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>News</span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                NewsAPI.org (global + NGX)
              </span>
              {meta?.mode && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--accent)",
                  }}
                >
                  {meta.mode}
                </span>
              )}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Company Search</span>
              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>Symbol lookup</span>
            </div>
          </div>
        </div>

        <div style={card}>
          <p style={labelStyle}>TL;DR</p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-primary)",
              lineHeight: 1.7,
            }}
          >
            {summary.tldr}
          </p>
        </div>
      </div>

      {/* Headlines grid: global | NGX */}
      {(global || ngx) && (
        <div>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Headlines at a glance
          </p>
          <div style={grid}>
            <HeadlinePanel
              key={`hp-global-${global?.headline}-${(global?.stories || []).length}`}
              title="Global markets"
              section={global}
              onViewMore={onOpenGlobalTab}
              viewMoreLabel="View more — Global news"
            />
            <HeadlinePanel
              key={`hp-ngx-${ngx?.headline}-${(ngx?.stories || []).length}`}
              title="Nigeria / NGX"
              section={ngx}
              onViewMore={onOpenNgxTab}
              viewMoreLabel="View more — NGX news"
            />
          </div>
        </div>
      )}

      {/* Key takeaways as a grid of small cards */}
      <div style={card}>
        <p style={labelStyle}>Key takeaways</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 12,
          }}
        >
          {summary.key_takeaways?.map((t, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "14px 16px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--accent)",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>

      {savedStories.length > 0 && (
        <div style={card}>
          <p style={labelStyle}>Saved stories</p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Starred from Global or NGX (stored on this device).
          </p>
          <div>
            {savedStories.map((entry, i) => (
              <div key={entry.id}>
                {i > 0 && <Divider />}
                <div style={{ padding: "12px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                      {entry.title}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
                      {entry.summary && entry.summary.length > 180
                        ? `${entry.summary.slice(0, 177)}…`
                        : entry.summary}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>
                      {entry.section} · {entry.source || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove from saved"
                    onClick={() => {
                      toggleSavedStory(entry.section, {
                        title: entry.title,
                        summary: entry.summary,
                        source: entry.source,
                      });
                      bumpSavedList();
                    }}
                    style={{
                      flexShrink: 0,
                      border: "1px solid var(--border-subtle)",
                      background: "transparent",
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "inherit",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          ...card,
          background: "var(--accent-soft)",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Beginner tip
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.65,
          }}
        >
          {summary.beginner_tip}
        </p>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          margin: 0,
          textAlign: "center",
        }}
      >
        For informational purposes only · Not financial advice · Consult a licensed advisor before
        investing
      </p>
    </div>
  );
}
