import { useEffect, useRef, useState } from "react";
import { FinNewsLogoSpinnerInline } from "./FinNewsLogoSpinner.jsx";
import { patchAuthUser } from "../utils/authStorage.js";

function initials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileMenu({
  user,
  setAuthUser,
  setBriefingMode,
  setAutoRefresh,
  onSignOutRequest,
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu");
  const [editName, setEditName] = useState(user?.name || "");
  const [photoError, setPhotoError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setView("menu");
      }
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > 800 * 1024) {
      setPhotoError("Image must be under 800KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setAvatarBusy(true);
        try {
          const next = await patchAuthUser({ avatarDataUrl: dataUrl });
          setAuthUser(next);
        } catch (err) {
          setPhotoError(err.message || "Could not upload photo.");
        } finally {
          setAvatarBusy(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function saveProfile() {
    const name = editName.trim();
    if (!name) {
      setPhotoError("Name cannot be empty.");
      return;
    }
    setPhotoError("");
    setSavingProfile(true);
    try {
      const next = await patchAuthUser({ name });
      setAuthUser(next);
      setView("menu");
    } catch (e) {
      setPhotoError(e.message || "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreference(key, value) {
    const prefs = { ...user.preferences, [key]: value };
    try {
      const next = await patchAuthUser({ preferences: prefs });
      setAuthUser(next);
    } catch {
      /* ignore preference sync errors */
    }
    if (key === "defaultBriefingMode") {
      setBriefingMode(value);
      if (typeof setAutoRefresh === "function") {
        setAutoRefresh(value === "live");
      }
      try {
        localStorage.setItem("finnewsBriefingMode", value);
      } catch {
        /* ignore */
      }
    }
  }

  const prefs = user?.preferences || {};

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setView("menu");
          setPhotoError("");
        }}
        title="Account menu"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid var(--border-subtle)",
          padding: 0,
          cursor: "pointer",
          overflow: "hidden",
          background: "var(--accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {user?.avatarDataUrl ? (
          <img
            src={user.avatarDataUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>
            {initials(user?.name)}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 300,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {view === "menu" && (
            <div>
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{user?.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                  {user?.email}
                </p>
              </div>
              <nav style={{ padding: 8 }}>
                <MenuRow
                  label="Edit profile"
                  onClick={() => {
                    setEditName(user?.name || "");
                    setPhotoError("");
                    setView("edit");
                  }}
                />
                <MenuRow
                  label="Preferences"
                  onClick={() => setView("preferences")}
                />
                <MenuRow
                  label="Sign out"
                  danger
                  onClick={() => {
                    setOpen(false);
                    setView("menu");
                    onSignOutRequest();
                  }}
                />
              </nav>
            </div>
          )}

          {view === "edit" && (
            <div style={{ padding: 16 }}>
              <button
                type="button"
                onClick={() => setView("menu")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "0 0 12px",
                  fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 15 }}>Edit profile</p>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                Display name
              </label>
              <input
                className="fin-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={savingProfile || avatarBusy}
                style={{
                  width: "100%",
                  marginTop: 6,
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  boxSizing: "border-box",
                  opacity: savingProfile || avatarBusy ? 0.65 : 1,
                }}
              />
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                Profile photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={savingProfile || avatarBusy}
                style={{ marginTop: 8, opacity: savingProfile || avatarBusy ? 0.5 : 1 }}
              />
              {avatarBusy ? (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "8px 0 0",
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  <FinNewsLogoSpinnerInline size={14} variant="onDark" />
                  Updating photo…
                </p>
              ) : null}
              {user?.avatarDataUrl && (
                <button
                  type="button"
                  disabled={savingProfile || avatarBusy}
                  onClick={async () => {
                    setAvatarBusy(true);
                    try {
                      const next = await patchAuthUser({ avatarDataUrl: null });
                      setAuthUser(next);
                    } catch (err) {
                      setPhotoError(err.message || "Could not remove photo.");
                    } finally {
                      setAvatarBusy(false);
                    }
                  }}
                  style={{
                    display: "block",
                    marginTop: 8,
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 12,
                    cursor: savingProfile || avatarBusy ? "not-allowed" : "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                    opacity: savingProfile || avatarBusy ? 0.6 : 1,
                  }}
                >
                  Remove photo
                </button>
              )}
              {photoError && (
                <p style={{ color: "#f87171", fontSize: 12, margin: "8px 0 0" }}>{photoError}</p>
              )}
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile || avatarBusy}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  fontWeight: 800,
                  cursor: savingProfile || avatarBusy ? "wait" : "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: savingProfile || avatarBusy ? 0.9 : 1,
                }}
              >
                {savingProfile ? (
                  <>
                    <FinNewsLogoSpinnerInline size={18} variant="onLight" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          )}

          {view === "preferences" && (
            <div style={{ padding: 16 }}>
              <button
                type="button"
                onClick={() => setView("menu")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "0 0 12px",
                  fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
              <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 15 }}>Preferences</p>

              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>
                Default briefing style
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["daily", "live"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => savePreference("defaultBriefingMode", m)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid var(--border-subtle)",
                      background:
                        (prefs.defaultBriefingMode || "daily") === m
                          ? "var(--accent-soft)"
                          : "transparent",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textTransform: "capitalize",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <ToggleRow
                label="Show tips on mock / demo data"
                checked={prefs.showMockBannerHints !== false}
                onChange={(v) => savePreference("showMockBannerHints", v)}
              />
              <ToggleRow
                label="Compact charts (smaller charts)"
                checked={!!prefs.compactCharts}
                onChange={(v) => savePreference("compactCharts", v)}
              />

              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "16px 0 0", lineHeight: 1.5 }}>
                Default briefing updates your session; use the header toggle for one-off changes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuRow({ label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: danger ? "#f87171" : "var(--text-primary)",
        fontSize: 14,
        fontWeight: danger ? 700 : 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
