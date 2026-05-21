import { useState, useRef, useEffect } from "react";

export default function Navbar({ user, onLogin, onRegister, onSignOut, onDashboard, onHome, showDashboard }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = user?.email ? user.email[0].toUpperCase() : "?";

  const handleDashboard = () => { setMenuOpen(false); onDashboard(); };
  const handleSignOut   = () => { setMenuOpen(false); onSignOut(); };

  return (
    <nav className="gs-navbar">
      {/* Logo */}
      <div
        className="gs-navbar-logo"
        onClick={onHome}
        style={onHome ? { cursor: "pointer" } : {}}
        role={onHome ? "button" : undefined}
        tabIndex={onHome ? 0 : undefined}
        onKeyDown={onHome ? (e) => { if (e.key === "Enter" || e.key === " ") onHome(); } : undefined}
        aria-label={onHome ? "Go to home page" : undefined}
      >
        ⚡ <span>First Gig</span>
      </div>

      {/* Right-side actions */}
      <div className="gs-navbar-actions">
        {user ? (
          <div className="gs-nav-user-wrap" ref={menuRef}>
            {/* Visible Dashboard shortcut — shown when browsing as a logged-in user */}
            {showDashboard && onDashboard && (
              <button
                onClick={onDashboard}
                style={{
                  padding: "7px 14px", marginRight: 8,
                  background: "rgba(255,107,53,0.1)", color: "#FF6B35",
                  border: "1.5px solid rgba(255,107,53,0.3)", borderRadius: 20,
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                ← Dashboard
              </button>
            )}
            {/* Avatar button */}
            <button
              className={`gs-nav-avatar${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Open user menu"
              aria-expanded={menuOpen}
            >
              {initial}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="gs-nav-dropdown" role="menu">
                {/* Email header */}
                <div className="gs-nav-dd-header">
                  <div className="gs-nav-dd-avatar-lg">{initial}</div>
                  <p className="gs-nav-dd-email">{user.email}</p>
                </div>

                <div className="gs-nav-dd-section">
                  <button className="gs-nav-dd-item" role="menuitem" onClick={handleDashboard}>
                    <span className="gs-nav-dd-icon">⚡</span> Dashboard
                  </button>
                </div>

                <div className="gs-nav-dd-divider" />

                <div className="gs-nav-dd-section">
                  <button className="gs-nav-dd-item gs-nav-dd-item--danger" role="menuitem" onClick={handleSignOut}>
                    <span className="gs-nav-dd-icon">↩</span> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="gs-btn gs-btn-ghost" onClick={onLogin}>Sign in</button>
            <button className="gs-btn gs-btn-filled" onClick={onRegister}>Get started</button>
          </>
        )}
      </div>
    </nav>
  );
}
