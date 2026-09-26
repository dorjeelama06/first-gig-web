import { useState } from "react";
import { requestPasswordReset } from "../../lib/auth";
import { isValidEmail } from "../../lib/validation";

export default function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      // Rate limits and network errors; unknown emails don't error, so this reveals nothing
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div>
        <h2 className="gs-title">Check your email 📬</h2>
        <p className="gs-desc">
          If an account exists for <strong>{email.trim()}</strong>, we sent a link to reset your password.
        </p>
        <button className="gs-next submit" style={{ width: "100%", marginTop: 16 }} onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="gs-title">Reset password</h2>
      <p className="gs-desc">Enter your account email and we'll send you a reset link.</p>
      {error && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>
          {error}
        </p>
      )}
      <div className="gs-field">
        <label className="gs-label" htmlFor="forgot-email">Email</label>
        <input id="forgot-email" type="email" className="gs-input" value={email} autoComplete="email"
          onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <button className={`gs-next submit ${loading ? "disabled" : ""}`}
          onClick={!loading ? handleSubmit : undefined}>
          {loading ? "Sending..." : "Send reset link →"}
        </button>
        <button className="gs-back" style={{ textAlign: "center" }} onClick={onBack}>← Back to sign in</button>
      </div>
    </div>
  );
}
