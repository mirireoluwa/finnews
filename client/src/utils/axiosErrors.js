/**
 * Shared axios error → user-visible message (friendly copy; no infra jargon).
 */

export function formatAxiosError(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    const msg = String(error?.message || "").toLowerCase();
    const code = error?.code || "";
    if (
      code === "ERR_NETWORK" ||
      msg.includes("network error") ||
      msg === "network error"
    ) {
      return (
        "We can’t reach the service from your browser. Check your connection. " +
        "If you’re online, the app may be waking up—wait a minute and try again."
      );
    }
    if (code === "ECONNABORTED" || msg.includes("timeout")) {
      return "That took too long. Please try again in a moment.";
    }
    return fallback;
  }

  const d = error.response.data;
  if (!d) return fallback;
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
