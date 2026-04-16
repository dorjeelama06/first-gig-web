export default function AuthLanding({ onLogin, onRegister }) {
  return (
    <div>
      <h2 className="gs-title">Welcome to GigSpark ⚡</h2>
      <p className="gs-desc">The easiest way for teens to find local gigs and for businesses to find young talent.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
        <button className="gs-next submit" onClick={onRegister}>Create Account →</button>
        <button className="gs-back" style={{ textAlign: "center" }} onClick={onLogin}>Sign In</button>
      </div>
    </div>
  );
}
