export default function Navbar({ user, onLogin, onRegister, onSignOut, onDashboard }) {
  return (
    <nav className="gs-navbar">
      <div className="gs-navbar-logo">
        ⚡ <span>First Gig</span>
      </div>
      <div className="gs-navbar-actions">
        {user ? (
          <>
            <span className="gs-navbar-email">{user.email}</span>
            <button className="gs-btn gs-btn-ghost" onClick={onDashboard}>Dashboard</button>
            <button className="gs-btn gs-btn-outline" onClick={onSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <button className="gs-btn gs-btn-ghost" onClick={onLogin}>Sign In</button>
            <button className="gs-btn gs-btn-filled" onClick={onRegister}>Create Account</button>
          </>
        )}
      </div>
    </nav>
  );
}
