/**
 * News feeds often set description/summary equal to the title, or repeat the title
 * at the start of the body. Returns text safe to show under the headline (may be empty).
 */
export function storyBodyExcerpt(story) {
  const title = (story?.title || "").trim();
  const raw = (story?.summary || "").trim();
  if (!raw) return "";

  if (raw === title) return "";
  const lt = title.toLowerCase();
  const lr = raw.toLowerCase();
  if (lr === lt) return "";

  if (lr.startsWith(lt)) {
    let rest = raw.slice(title.length).trim();
    rest = rest.replace(/^[\s.:;\-–—|]+/, "").trim();
    if (rest && rest.toLowerCase() !== lt) return rest;
    return "";
  }

  const first = raw.split(/\n/)[0]?.trim() || "";
  if (first === title || first.toLowerCase() === lt) {
    const rest = raw.split(/\n/).slice(1).join("\n").trim();
    return rest || "";
  }

  return raw;
}
