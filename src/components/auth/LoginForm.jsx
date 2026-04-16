import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginForm({ onSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onSuccess();
  };

  return (
    <div>
      <h2 className="gs-title">Sign In</h2>
      <p className="gs-desc">Welcome back!</p>
      {error && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>
          {error}
        </p>
      )}
      <div className="gs-field">
        <label className="gs-label">Email</label>
        <input type="email" className="gs-input" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Password</label>
        <input type="password" className="gs-input" value={password}
          onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
      </div>
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
