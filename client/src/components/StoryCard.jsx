import { useEffect, useState } from "react";
import { isStorySaved, makeStoryId, toggleSavedStory } from "../utils/savedStories.js";
import { storyBodyExcerpt } from "../utils/storyText.js";

/**
 * Story row for global / NGX — summary, optional AI blurb, save star.
 */
export default function StoryCard({ story, section = "story" }) {
  const storyId = makeStoryId(section, story);
  const [saved, setSaved] = useState(() => isStorySaved(storyId));

  useEffect(() => {
    setSaved(isStorySaved(storyId));
  }, [storyId]);

  function onStarClick(e) {
    e.preventDefault();
    const next = toggleSavedStory(section, story);
    setSaved(next);
  }

  const excerpt = storyBodyExcerpt(story);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            flex: 1,
          }}
        >
          {story.title}
        </p>
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save story"}
          title={saved ? "Saved" : "Save for later"}
          onClick={onStarClick}
          style={{
            flexShrink: 0,
            border: "1px solid var(--border-subtle)",
            background: saved ? "var(--accent-soft)" : "transparent",
            borderRadius: 10,
            width: 40,
            height: 40,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            color: saved ? "var(--accent)" : "var(--text-muted)",
            fontFamily: "inherit",
          }}
        >
          {saved ? "★" : "☆"}
        </button>
      </div>
      {excerpt ? (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {excerpt}
        </p>
      ) : null}
      {story.source && (
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {story.source}
        </p>
      )}
    </div>
  );
}
