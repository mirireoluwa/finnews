import { useEffect, useState } from "react";
import finnewsLogo from "../assets/finnews-logo.svg";
import slide01 from "../assets/auth-slideshow/slide-01.png";
import slide02 from "../assets/auth-slideshow/slide-02.png";
import slide03 from "../assets/auth-slideshow/slide-03.png";
import slide04 from "../assets/auth-slideshow/slide-04.png";
import slide05 from "../assets/auth-slideshow/slide-05.png";
import slide06 from "../assets/auth-slideshow/slide-06.png";
import slide07 from "../assets/auth-slideshow/slide-07.png";

const SLIDES = [slide01, slide02, slide03, slide04, slide05, slide06, slide07];

/** Time each slide is shown (ms); must match CSS story animation duration. */
const SLIDE_DURATION_MS = 5500;

function StoryProgressBars({ count, activeIndex, storyTick }) {
  return (
    <div
      role="presentation"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 12,
        display: "flex",
        gap: 4,
        padding: "12px 12px 0",
        boxSizing: "border-box",
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const isPast = i < activeIndex;
        const isFuture = i > activeIndex;
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: "rgba(255,255,255,0.35)",
              overflow: "hidden",
            }}
          >
            <div
              key={isActive ? `go-${storyTick}` : `hold-${i}`}
              style={{
                height: "100%",
                borderRadius: 2,
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 0 6px rgba(255,255,255,0.35)",
                width: isPast ? "100%" : isFuture ? "0%" : "0%",
                animation: isActive
                  ? `authStoryProgress ${SLIDE_DURATION_MS}ms linear forwards`
                  : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Full-bleed hero for auth pages: rotating photos, Instagram-style story
 * navigator, FinNews logo bottom-right.
 */
export default function AuthHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [storyTick, setStoryTick] = useState(0);
  const count = SLIDES.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
      setStoryTick((t) => t + 1);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [count]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#0a1628",
      }}
    >
      <style>{`
        @keyframes authStoryProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      {SLIDES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: i === activeIndex ? 1 : 0,
            transition: "opacity 0.85s ease",
            zIndex: i === activeIndex ? 2 : 1,
          }}
        />
      ))}

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <StoryProgressBars count={count} activeIndex={activeIndex} storyTick={storyTick} />

      <div
        className="auth-slideshow-brand"
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#fff",
          textShadow: "0 1px 8px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src={finnewsLogo}
          alt=""
          width={30}
          height={44}
          style={{
            display: "block",
            objectFit: "contain",
            filter: "brightness(0) invert(1) drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
          }}
        />
        <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>FinNews</span>
      </div>
    </div>
  );
}
