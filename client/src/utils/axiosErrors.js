/**
 * Shared axios error → user-visible message (auth, briefing, search).
 */

export function formatAxiosError(error, fallback = "Request failed.") {
  if (!error?.response) {
    const msg = String(error?.message || "").toLowerCase();
    const code = error?.code || "";
    if (
      code === "ERR_NETWORK" ||
      msg.includes("network error") ||
      msg === "network error"
    ) {
      return (
        "Can't reach the API. Set VITE_API_URL to your Render API URL on your frontend host (e.g. Vercel), " +
        "redeploy, and add this site's exact URL to CORS_ALLOWED_ORIGINS on Render (e.g. https://fin-news.xyz). " +
        "Free Render: wait ~30–60s after idle (cold start), then retry."
      );
    }
    if (code === "ECONNABORTED" || msg.includes("timeout")) {
      return "Request timed out—the API may be waking up. Try again in a minute.";
    }
    return error?.message || fallback;
  }

  const d = error.response.data;
  if (!d) return error.message || fallback;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) return String(d.detail[0] ?? fallback);
  if (Array.isArray(d.non_field_errors)) return d.non_field_errors[0];
  if (typeof d.non_field_errors === "string") return d.non_field_errors;
  const key = Object.keys(d)[0];
  if (key) {
    const v = d[key];
    return Array.isArray(v) ? v[0] : String(v);
  }
  return fallback;
}
