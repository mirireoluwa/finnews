import axios from "axios";

const TOKEN_KEY = "finnewsAuthToken";

export const defaultPreferences = () => ({
  defaultBriefingMode: "daily",
  showMockBannerHints: true,
  compactCharts: false,
  focusTags: [],
  profileNote: "",
});

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Remove token only (call logout API separately when possible). */
export function clearSession() {
  setToken("");
}

function apiErrorMessage(error) {
  const d = error.response?.data;
  if (!d) return error.message || "Request failed.";
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) return String(d.detail[0] ?? "Request failed.");
  if (Array.isArray(d.non_field_errors)) return d.non_field_errors[0];
  if (typeof d.non_field_errors === "string") return d.non_field_errors;
  const key = Object.keys(d)[0];
  if (key) {
    const v = d[key];
    return Array.isArray(v) ? v[0] : String(v);
  }
  return "Request failed.";
}

/**
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function registerAccount({ name, email, phone, password }) {
  try {
    const { data } = await axios.post("/api/auth/register/", {
      name,
      email,
      phone: phone || "",
      password,
    });
    setToken(data.token);
    return { token: data.token, user: normalizeUser(data.user) };
  } catch (e) {
    throw new Error(apiErrorMessage(e));
  }
}

/**
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginAccount({ email, password }) {
  try {
    const { data } = await axios.post("/api/auth/login/", { email, password });
    if (data.token) {
      setToken(data.token);
      return { token: data.token, user: normalizeUser(data.user) };
    }
    throw new Error("Unexpected login response.");
  } catch (e) {
    throw new Error(apiErrorMessage(e));
  }
}

export async function logoutAccount() {
  try {
    if (getToken()) await axios.post("/api/auth/logout/");
  } catch {
    /* still clear local session */
  } finally {
    clearSession();
  }
}

export async function fetchMe() {
  const { data } = await axios.get("/api/auth/me/");
  return normalizeUser(data);
}

/**
 * Patch profile on server. Pass camelCase keys: name, phone, avatarDataUrl, preferences, watchlist, companyTags, onboardingCompleted.
 * @returns {Promise<object>} updated user
 */
export async function patchAuthUser(updates) {
  const { data } = await axios.patch("/api/auth/me/", updates);
  return normalizeUser(data);
}

function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ...raw,
    preferences: { ...defaultPreferences(), ...(raw.preferences || {}) },
    onboardingCompleted: raw.onboardingCompleted !== false ? true : false,
  };
}

/** @deprecated no-op — users live on server; kept so imports don’t break during refactors */
export function readAuthUser() {
  return null;
}

export function writeAuthUser() {
  /* no-op */
}

export function clearAuthUser() {
  clearSession();
}
