import { useState } from "react";
import { signIn, resendConfirmation } from "../../lib/auth";

const NOTICE_STYLE = { color: "#4ade80", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(74,222,128,0.1)", borderRadius: 8 };
const ERROR_STYLE  = { color: "#ff6b6b", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 };
const LINK_STYLE   = { background: "none", border: "none", color: "#FF6B35", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" };

export default function LoginForm({ onSuccess, onBack, onForgot, notice: initialNotice = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialNotice);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setNotice("");
    setUnconfirmed(false);
    setLoading(true);
    try {
      const { user } = await signIn(email.trim(), password);
      onSuccess(user);
    } catch (e) {
      if (e.code === "email_not_confirmed" || /email not confirmed/i.test(e.message ?? "")) {
        setUnconfirmed(true);
        setError("Please confirm your email first. Check your inbox for the link we sent.");
      } else {
        setError(e.message ?? "Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendConfirmation(email.trim());
      setUnconfirmed(false);
      setNotice(`Confirmation email sent to ${email.trim()}.`);
    } catch (e) {
      setError(e.message ?? "Couldn't resend the email. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="gs-title">Sign In</h2>
      <p className="gs-desc">Welcome back!</p>
      {notice && <p style={NOTICE_STYLE}>{notice}</p>}
      {error && <p style={ERROR_STYLE}>{error}</p>}
      {unconfirmed && (
        <p style={{ margin: "-4px 0 12px" }}>
          <button type="button" style={LINK_STYLE} onClick={handleResend}>Resend confirmation email</button>
        </p>
      )}
      <div className="gs-field">
        <label className="gs-label" htmlFor="login-email">Email</label>
        <input id="login-email" type="email" className="gs-input" value={email} autoComplete="email"
          onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="gs-field">
        <label className="gs-label" htmlFor="login-password">Password</label>
        <input id="login-password" type="password" className="gs-input" value={password} autoComplete="current-password"
          onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
      </div>
      <p style={{ margin: "-4px 0 12px", textAlign: "right" }}>
        <button type="button" style={LINK_STYLE} onClick={onForgot}>Forgot password?</button>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <button className={`gs-next submit ${loading ? "disabled" : ""}`}
          onClick={!loading ? handleLogin : undefined}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <button className="gs-back" style={{ textAlign: "center" }} onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}
