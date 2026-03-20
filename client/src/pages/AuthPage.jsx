import { useEffect, useState } from "react";
import AuthHeroSlideshow from "../components/AuthHeroSlideshow.jsx";
import PasswordRequirementList from "../components/PasswordRequirementList.jsx";
import { loginAccount, registerAccount } from "../utils/authStorage.js";
import { passwordMeetsAllRequirements } from "../utils/passwordRules.js";

const fieldLabel = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--border-subtle)",
  background: "var(--bg)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

function useSystemPrefersLight() {
  const [prefersLight, setPrefersLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setPrefersLight(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefersLight;
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formError, setFormError] = useState("");

  const prefersLight = useSystemPrefersLight();
  const formPanelBg = prefersLight ? "#ffffff" : "var(--bg-elevated)";
  const subtitleColor = "var(--text-muted)";

  async function handleLogin(e) {
    e.preventDefault();
    setFormError("");
    if (!email.trim()) {
      setFormError("Enter your email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      const { user } = await loginAccount({ email: email.trim(), password });
      onAuthenticated(user);
    } catch (err) {
      setFormError(err.message || "Could not sign in.");
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setFormError("");
    if (!fullName.trim()) {
      setFormError("Enter your full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Enter your email address.");
      return;
    }
    if (!passwordMeetsAllRequirements(password)) {
      setFormError("Password must meet every requirement below.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!agreedTerms) {
      setFormError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    try {
      const { user } = await registerAccount({
        name: fullName.trim(),
        email: email.trim(),
        phone,
        password,
      });
      onAuthenticated(user);
    } catch (err) {
      setFormError(err.message || "Could not create account.");
    }
  }

  const titleGradient = {
    background: "linear-gradient(90deg, var(--accent) 0%, #7dd3fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100dvh",
        width: "100%",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.08fr)",
          minHeight: 0,
          width: "100%",
        }}
        className="auth-split-grid"
      >
        {/* Form column — full-height page, content width capped for readability */}
        <div
          style={{
            background: formPanelBg,
            padding: "clamp(24px, 6vw, 56px) clamp(20px, 5vw, 48px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
          {mode === "login" ? (
            <>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(26px, 4vw, 32px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--accent)",
                }}
              >
                Welcome back
              </h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: subtitleColor, lineHeight: 1.6 }}>
                Log in to track global markets, NGX headlines, and your personal watchlist.
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>
                    Email address <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <input
                    className="fin-input auth-input-full"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={fieldLabel}>
                    Password <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="fin-input auth-input-full"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: 13,
                        padding: 4,
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError("Password reset is not available in this demo build.")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 0 20px",
                  }}
                >
                  Forgot your password?
                </button>
                {formError && (
                  <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 16px" }}>{formError}</p>
                )}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Log in
                </button>
              </form>
              <p style={{ marginTop: 24, fontSize: 14, color: subtitleColor }}>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setFormError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    font: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  Create one
                </button>
              </p>
              <p style={{ marginTop: 32, fontSize: 12, color: subtitleColor, display: "flex", gap: 8, alignItems: "center" }}>
                <span aria-hidden>🔒</span>
                <span>Your session is stored locally for this demo. Use a unique password.</span>
              </p>
            </>
          ) : (
            <>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(26px, 4vw, 32px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  ...titleGradient,
                }}
              >
                Create your Finnews account
              </h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: subtitleColor, lineHeight: 1.6 }}>
                Sign up to save your watchlist, choose daily or live briefings, and follow global &amp; NGX news.
              </p>
              <form onSubmit={handleSignUp}>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>
                    Full name <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <input
                    className="fin-input auth-input-full"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Ada Okafor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>
                    Email address <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <input
                    className="fin-input auth-input-full"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>Phone (optional)</label>
                  <input
                    className="fin-input auth-input-full"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+234 …"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>
                    Password <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="fin-input auth-input-full"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: 13,
                        padding: 4,
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {password.length > 0 && <PasswordRequirementList password={password} />}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={fieldLabel}>
                    Confirm password <span style={{ color: "var(--accent)" }}>*</span>
                  </label>
                  <input
                    className="fin-input auth-input-full"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                  />
                  {confirmPassword.length > 0 && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          password === confirmPassword ? "var(--positive)" : "#f87171",
                      }}
                    >
                      {password === confirmPassword
                        ? "✓ Passwords match."
                        : "Passwords do not match yet."}
                    </p>
                  )}
                </div>
                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 13,
                    color: subtitleColor,
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    I agree to the{" "}
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>Terms of Service</span> and{" "}
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>Privacy Policy</span>
                    .
                  </span>
                </label>
                {formError && (
                  <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 16px" }}>{formError}</p>
                )}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Create account
                </button>
              </form>
              <p style={{ marginTop: 24, fontSize: 14, color: subtitleColor }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setFormError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    font: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  Log in
                </button>
              </p>
            </>
          )}
          </div>
        </div>

        {/* Visual column — edge-to-edge, full viewport height */}
        <div
          style={{
            position: "relative",
            minHeight: 0,
            background: "var(--bg)",
          }}
          className="auth-hero-col"
        >
          <AuthHeroSlideshow />
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .auth-split-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: minmax(220px, 38vh) minmax(0, 1fr) !important;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .auth-hero-col {
            order: -1;
            min-height: 220px;
            height: 38vh;
            max-height: 360px;
          }
        }
      `}</style>
    </div>
  );
}
