const STORAGE_KEY = "finnewsSavedStories";

/** @returns {{ id: string, title: string, summary: string, source: string, section: string, savedAt: string }[]} */
export function readSavedStories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function makeStoryId(section, story) {
  const t = (story?.title || "").slice(0, 200);
  const s = (story?.source || "").slice(0, 80);
  return `${section}::${t}::${s}`;
}

export function isStorySaved(id) {
  return readSavedStories().some((x) => x.id === id);
}

/** @returns {boolean} new saved state */
export function toggleSavedStory(section, story) {
  const id = makeStoryId(section, story);
  const list = readSavedStories();
  const i = list.findIndex((x) => x.id === id);
  let next;
  let nowSaved;
  if (i >= 0) {
    next = list.filter((x) => x.id !== id);
    nowSaved = false;
  } else {
    next = [
      ...list,
      {
        id,
        title: story.title || "",
        summary: story.summary || "",
        source: story.source || "",
        section,
        savedAt: new Date().toISOString(),
      },
    ];
    nowSaved = true;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-50)));
  } catch {
    /* ignore */
  }
  return nowSaved;
}
