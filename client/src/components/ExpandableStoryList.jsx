import { useEffect, useState } from "react";
import Divider from "./Divider.jsx";
import StoryCard from "./StoryCard.jsx";

const footerBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  margin: 0,
  padding: "12px 16px",
  borderTop: "1px solid var(--border-subtle)",
  background: "var(--bg)",
  fontFamily: "inherit",
};

const navBtn = (disabled) => ({
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid var(--border-subtle)",
  background: disabled ? "var(--bg-elevated)" : "var(--bg)",
  color: disabled ? "var(--text-muted)" : "var(--accent)",
  fontSize: 13,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
  letterSpacing: "0.02em",
  opacity: disabled ? 0.55 : 1,
});

const pageInfo = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  textAlign: "center",
  flex: "1 1 auto",
  minWidth: "8rem",
};

/**
 * Renders StoryCard rows in fixed-size pages (prev/next) so the layout
 * does not grow indefinitely like incremental "show more".
 */
export default function ExpandableStoryList({
  stories = [],
  section,
  inset = 24,
  pageSize = 8,
}) {
  const [page, setPage] = useState(1);
  const list = Array.isArray(stories) ? stories : [];
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [list.length, section]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  if (list.length === 0) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const shown = list.slice(start, start + pageSize);
  const from = start + 1;
  const to = Math.min(start + shown.length, list.length);

  return (
    <>
      {shown.map((s, i) => (
        <div key={`${section}-row-${start + i}`}>
          {i > 0 && <Divider inset={inset} />}
          <div style={{ padding: `0 ${inset}px` }}>
            <StoryCard story={s} section={section} />
          </div>
        </div>
      ))}
      {totalPages > 1 && (
        <div style={{ ...footerBar, paddingLeft: inset, paddingRight: inset }}>
          <button
            type="button"
            style={navBtn(safePage <= 1)}
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={pageInfo}>
            Page {safePage} of {totalPages}
            <span style={{ display: "block", fontSize: 11, fontWeight: 500, marginTop: 4 }}>
              Stories {from}–{to} of {list.length}
            </span>
          </span>
          <button
            type="button"
            style={navBtn(safePage >= totalPages)}
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
      {totalPages === 1 && list.length > 0 && (
        <div
          style={{
            padding: `10px ${inset}px 16px`,
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg)",
          }}
        >
          {list.length} {list.length === 1 ? "story" : "stories"}
        </div>
      )}
    </>
  );
}
