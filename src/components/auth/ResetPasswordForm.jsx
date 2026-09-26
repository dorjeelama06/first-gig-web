import { useState } from "react";
import { updatePassword } from "../../lib/auth";
import { MIN_PASSWORD } from "../../lib/validation";

/* Shown after the user opens a password-recovery link (they're signed in by the link). */
export default function ResetPasswordForm({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      await updatePassword(password);
      onDone();
    } catch (e) {
      setError(e.message ?? "Couldn't update your password. The link may have expired — request a new one.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="gs-title">Choose a new password</h2>
      <p className="gs-desc">Enter a new password for your account.</p>
      {error && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>
          {error}
        </p>
      )}
      <div className="gs-field">
        <label className="gs-label" htmlFor="reset-password">New Password</label>
        <input id="reset-password" type="password" className="gs-input" value={password} autoComplete="new-password"
          onChange={e => setPassword(e.target.value)} placeholder={`Min. ${MIN_PASSWORD} characters`} />
      </div>
      <div className="gs-field">
        <label className="gs-label" htmlFor="reset-confirm">Confirm Password</label>
        <input id="reset-confirm" type="password" className="gs-input" value={confirm} autoComplete="new-password"
          onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </div>
      <button className={`gs-next submit ${loading ? "disabled" : ""}`} style={{ width: "100%", marginTop: 8 }}
        onClick={!loading ? handleSubmit : undefined}>
        {loading ? "Saving..." : "Update password →"}
      </button>
    </div>
  );
}
