import { useEffect, useState } from "react";
import AuthHeroSlideshow from "../components/AuthHeroSlideshow.jsx";
import PasswordRequirementList from "../components/PasswordRequirementList.jsx";
import {
  confirmPasswordReset,
  loginAccount,
  registerAccount,
  requestPasswordReset,
} from "../utils/authStorage.js";
import { passwordMeetsAllRequirements } from "../utils/passwordRules.js";
import finnewsLogo from "../assets/finnews-logo.svg";

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
  const [resetUid, setResetUid] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [authBanner, setAuthBanner] = useState({ type: "", text: "" });

  const prefersLight = useSystemPrefersLight();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reset") !== "1") return;
      const u = params.get("uid");
      const t = params.get("token");
      if (!u || !t) return;
      setResetUid(u);
      setResetToken(t);
      setMode("reset");
      const path = window.location.pathname || "/";
      window.history.replaceState({}, document.title, path);
    } catch {
      /* ignore */
    }
  }, []);
  const formPanelBg = prefersLight ? "#ffffff" : "var(--bg-elevated)";
  const subtitleColor = "var(--text-muted)";

  async function handleLogin(e) {
    e.preventDefault();
    setFormError("");
    setAuthBanner({ type: "", text: "" });
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

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!email.trim()) {
      setFormError("Enter your email address.");
      return;
    }
    try {
      await requestPasswordReset({ email: email.trim() });
      setForgotSent(true);
    } catch (err) {
      setFormError(err.message || "Could not send reset email.");
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!resetUid || !resetToken) {
      setFormError("This reset link is incomplete. Open the link from your email again.");
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
    try {
      await confirmPasswordReset({
        uid: resetUid,
        token: resetToken,
        newPassword: password,
      });
      setPassword("");
      setConfirmPassword("");
      setResetUid("");
      setResetToken("");
      setMode("login");
      setForgotSent(false);
      setAuthBanner({ type: "ok", text: "Password updated. Sign in with your new password." });
    } catch (err) {
      setFormError(err.message || "Could not reset password.");
    }
  }

  const titleGradient = {
    background: "linear-gradient(90deg, var(--accent) 0%, #7dd3fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const heroSub = {
    margin: 0,
    fontSize: "clamp(13px, 2.8vw, 15px)",
    lineHeight: 1.55,
    color: "rgba(248, 250, 252, 0.92)",
    textShadow: "0 2px 16px rgba(0, 0, 0, 0.75)",
    maxWidth: 400,
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
        {/* Form column — fields only (headlines live on hero / slideshow) */}
        <div
          className="auth-form-column"
          style={{
            background: formPanelBg,
            padding: "clamp(24px, 6vw, 56px) clamp(20px, 5vw, 48px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
            {mode === "login" ? (
              <>
                {authBanner.type === "ok" && authBanner.text && (
                  <p
                    style={{
                      color: "var(--positive, #22c55e)",
                      fontSize: 13,
                      margin: "0 0 16px",
                      fontWeight: 600,
                    }}
                  >
                    {authBanner.text}
                  </p>
                )}
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
                    onClick={() => {
                      setMode("forgot");
                      setFormError("");
                      setForgotSent(false);
                      setAuthBanner({ type: "", text: "" });
                    }}
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
                      setAuthBanner({ type: "", text: "" });
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
                  <span>Your session uses a secure token stored on this device after you sign in.</span>
                </p>
              </>
            ) : mode === "forgot" ? (
              <>
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: 14, color: subtitleColor, margin: "0 0 18px", lineHeight: 1.5 }}>
                    Enter the email for your account. If it exists, we&apos;ll send a link to reset your password.
                  </p>
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
                  {forgotSent && (
                    <p style={{ color: "var(--positive, #22c55e)", fontSize: 13, margin: "0 0 16px", fontWeight: 600 }}>
                      Check your inbox for the reset link. If you don&apos;t see it, look in spam or try again in a few
                      minutes.
                    </p>
                  )}
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
                    Send reset link
                  </button>
                </form>
                <p style={{ marginTop: 24, fontSize: 14, color: subtitleColor }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setFormError("");
                      setAuthBanner({ type: "", text: "" });
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
                    Back to sign in
                  </button>
                </p>
              </>
            ) : mode === "reset" ? (
              <>
                <form onSubmit={handleResetSubmit}>
                  <p style={{ fontSize: 14, color: subtitleColor, margin: "0 0 18px", lineHeight: 1.5 }}>
                    Choose a new password for your account.
                  </p>
                  <div style={{ marginBottom: 18 }}>
                    <label style={fieldLabel}>
                      New password <span style={{ color: "var(--accent)" }}>*</span>
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
                      Confirm new password <span style={{ color: "var(--accent)" }}>*</span>
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
                  </div>
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
                    Update password
                  </button>
                </form>
                <p style={{ marginTop: 24, fontSize: 14, color: subtitleColor }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setFormError("");
                      setPassword("");
                      setConfirmPassword("");
                      setResetUid("");
                      setResetToken("");
                      setAuthBanner({ type: "", text: "" });
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
                    Back to sign in
                  </button>
                </p>
              </>
            ) : (
              <>
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
                      setAuthBanner({ type: "", text: "" });
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

        {/* Slideshow + centered headers (desktop); left-aligned on small screens */}
        <div
          style={{
            position: "relative",
            minHeight: 0,
            background: "var(--bg)",
          }}
          className="auth-hero-col auth-hero-with-overlay"
        >
          <AuthHeroSlideshow />

          <div className="auth-hero-overlay">
            <div className="auth-hero-scrim" aria-hidden />

            <div className="auth-hero-inner">
              <div className="auth-hero-brand">
                <img
                  src={finnewsLogo}
                  alt=""
                  width={28}
                  height={42}
                  className="auth-hero-logo-img"
                />
                <span className="auth-hero-wordmark">FinNews</span>
              </div>

              {mode === "login" ? (
                <>
                  <h1 className="auth-hero-title auth-hero-title-login">Welcome back</h1>
                  <p className="auth-hero-sub" style={heroSub}>
                    Log in to track global markets, NGX headlines, and your personal watchlist.
                  </p>
                </>
              ) : mode === "forgot" ? (
                <>
                  <h1 className="auth-hero-title auth-hero-title-login">Reset your password</h1>
                  <p className="auth-hero-sub" style={heroSub}>
                    We&apos;ll email you a secure link to choose a new password.
                  </p>
                </>
              ) : mode === "reset" ? (
                <>
                  <h1 className="auth-hero-title auth-hero-title-login">Choose a new password</h1>
                  <p className="auth-hero-sub" style={heroSub}>
                    Pick a strong password, then sign in with it.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="auth-hero-title auth-hero-title-signup" style={titleGradient}>
                    Create your FinNews account
                  </h1>
                  <p className="auth-hero-sub" style={heroSub}>
                    Sign up to save your watchlist, choose daily or live briefings, and follow global &amp; NGX news.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-hero-with-overlay .auth-slideshow-brand {
          display: none !important;
        }

        /* Desktop / tablet wide: brand + titles centered over slideshow */
        .auth-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 8;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(52px, 11vw, 72px) clamp(24px, 4vw, 40px) 28px;
          box-sizing: border-box;
          pointer-events: none;
        }

        .auth-hero-scrim {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(4, 12, 28, 0.85) 0%,
            rgba(4, 12, 28, 0.48) 45%,
            rgba(4, 12, 28, 0.18) 72%,
            transparent 100%
          );
        }

        .auth-hero-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-hero-brand {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: clamp(14px, 3vh, 22px);
        }

        .auth-hero-logo-img {
          display: block;
          object-fit: contain;
          flex-shrink: 0;
          filter: brightness(0) invert(1) drop-shadow(0 3px 14px rgba(0, 0, 0, 0.55));
        }

        .auth-hero-wordmark {
          font-weight: 800;
          font-size: clamp(18px, 3.2vw, 22px);
          letter-spacing: -0.03em;
          color: #f8fafc;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.65);
          line-height: 1.1;
        }

        .auth-hero-title {
          margin: 0 0 10px;
          font-size: clamp(26px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }

        .auth-hero-title-login {
          color: #7dd3fc;
          text-shadow: 0 2px 24px rgba(0, 0, 0, 0.85);
        }

        .auth-hero-sub {
          text-align: center;
        }

        /* Mobile: left-align hero copy; keep desktop split unchanged above this breakpoint */
        @media (max-width: 880px) {
          .auth-hero-overlay {
            align-items: flex-start !important;
            text-align: left !important;
            padding: clamp(44px, 10vw, 60px) clamp(16px, 5vw, 24px) 20px !important;
          }

          .auth-hero-inner {
            align-items: flex-start !important;
            text-align: left !important;
            max-width: none !important;
          }

          .auth-hero-brand {
            justify-content: flex-start !important;
          }

          .auth-hero-sub {
            text-align: left !important;
          }

          .auth-hero-title {
            text-align: left !important;
            align-self: stretch !important;
          }

          .auth-split-grid {
            grid-template-columns: 1fr !important;
            /* Slightly shorter hero so the form row has more room to scroll */
            grid-template-rows: minmax(200px, min(32vh, 300px)) minmax(0, 1fr) !important;
            overflow: hidden;
            min-height: 0;
          }

          .auth-form-column {
            padding-top: 16px !important;
            padding-bottom: max(24px, env(safe-area-inset-bottom, 0px)) !important;
          }

          .auth-hero-col {
            order: -1;
            min-height: 200px;
            height: 32vh;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
