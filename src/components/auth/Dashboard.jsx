import { supabase } from "../../lib/supabase";

export default function Dashboard({ user, onSignOut }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <div>
      <h2 className="gs-title">You're in! 🎉</h2>
      <p className="gs-desc">Your account is all set up.</p>
      <div style={{
        background: "rgba(255,107,53,0.1)",
        border: "1px solid rgba(255,107,53,0.3)",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 20,
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed in as</p>
        <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>{user?.email}</p>
      </div>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
          🚧 Dashboard coming soon — your jobs and profile will appear here.
        </p>
      </div>
      <button className="gs-back" style={{ width: "100%", textAlign: "center" }} onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  );
}
