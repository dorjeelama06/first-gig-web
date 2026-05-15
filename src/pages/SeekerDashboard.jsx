import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import ChatWindow from "../components/chat/ChatWindow";
import ConversationList from "../components/chat/ConversationList";
import { fetchSeekerApplications } from "../lib/applications";
import { fetchUnreadCount, subscribeToConversationUpdates } from "../lib/chat";
import { supabase } from "../lib/supabase";
import "../styles/dashboard.css";
import "../styles/homepage.css";

const STATUS_STYLE = {
  pending:  { cls: "badge-orange", label: "Under Review"        },
  reviewed: { cls: "badge-blue",   label: "Reviewed"            },
  accepted: { cls: "badge-green",  label: "Interview Scheduled" },
  rejected: { cls: "badge-gray",   label: "Not Selected"        },
};

export default function SeekerDashboard({ user, onSignOut, onBrowse }) {
  const [tab, setTab] = useState("overview");
  const [activeConvo, setActiveConvo] = useState(null);

  // Real data
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch seeker profile
  useEffect(() => {
    supabase.from("seekers").select("*").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user.id]);

  // Fetch applications
  useEffect(() => {
    fetchSeekerApplications(user.id)
      .then(data => { setApplications(data); setAppsLoading(false); })
      .catch(() => setAppsLoading(false));
  }, [user.id]);

  // Real-time unread count
  useEffect(() => {
    fetchUnreadCount(user.id, "seeker").then(setUnreadCount);
    const unsubscribe = subscribeToConversationUpdates(user.id, () => {
      fetchUnreadCount(user.id, "seeker").then(setUnreadCount);
    }, "seeker-badge");
    return unsubscribe;
  }, [user.id]);

  const firstName = profile?.first_name ?? "there";
  const fullName  = profile ? `${profile.first_name} ${profile.last_name}` : "—";
  const initials  = profile ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase() : "?";
  const interviewCount = applications.filter(a => a.status === "accepted").length;

  const navItems = [
    { id: "overview",     icon: "📊", label: "Overview" },
    { id: "applications", icon: "💼", label: "Applications" },
    { id: "messages",     icon: "💬", label: "Messages", badge: unreadCount },
    { id: "profile",      icon: "👤", label: "My Profile" },
  ];

  return (
    <div className="dash-wrap">
      <Navbar user={user} onLogin={() => {}} onRegister={() => {}} onSignOut={onSignOut} onDashboard={() => {}} />

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-profile-card">
            <div className="dash-avatar">{initials}</div>
            <p className="dash-profile-name">{fullName}</p>
            <p className="dash-profile-sub">Job Seeker{profile?.zip_code ? ` · ${profile.zip_code}` : ""}</p>
          </div>
          <nav className="dash-nav">
            {navItems.map(item => (
              <div key={item.id} className={`dash-nav-item ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}>
                <span className="dash-nav-icon">{item.icon}</span>
                {item.label}
                {item.badge > 0 && <span className="dash-nav-badge">{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0" }}>
            <button onClick={onBrowse} style={{ width: "100%", padding: "9px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>
              Browse Jobs →
            </button>
            <button onClick={onSignOut} style={{ width: "100%", padding: "9px", background: "transparent", color: "#999", border: "1.5px solid #eee", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="dash-main">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">Welcome back, {firstName} 👋</p>
                <p className="dash-page-sub">Here's what's happening with your job search.</p>
              </div>
              <div className="dash-content">
                <div className="dash-stats">
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">💼</div>
                    <p className="dash-stat-val">{applications.length}</p>
                    <p className="dash-stat-label">Jobs Applied</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">💬</div>
                    <p className="dash-stat-val">{unreadCount}</p>
                    <p className="dash-stat-label">Unread Messages</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">📅</div>
                    <p className="dash-stat-val">{interviewCount}</p>
                    <p className="dash-stat-label">Interviews Scheduled</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">🔄</div>
                    <p className="dash-stat-val">{applications.filter(a => a.status === "pending").length}</p>
                    <p className="dash-stat-label">Under Review</p>
                  </div>
                </div>

                <p className="dash-section-title">Recent Applications</p>
                <div className="dash-list">
                  {applications.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <p style={{ color: "#bbb", fontSize: 13 }}>
                        No applications yet —{" "}
                        <span style={{ color: "#FF6B35", cursor: "pointer", fontWeight: 600 }} onClick={onBrowse}>browse jobs</span>
                      </p>
                    </div>
                  ) : applications.slice(0, 2).map(a => {
                    const statusInfo = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                    return (
                      <div key={a.id} className="dash-list-item">
                        <div className="dash-list-left">
                          <p className="dash-list-title">{a.jobs?.job_title}</p>
                          <p className="dash-list-sub">{a.employers?.company_name}</p>
                          <p className="dash-list-meta">Applied {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                        <span className={`dash-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                      </div>
                    );
                  })}
                </div>

                <p className="dash-section-title" style={{ marginTop: 24 }}>Messages</p>
                <div className="dash-list">
                  {unreadCount === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <p style={{ color: "#bbb", fontSize: 13 }}>No new messages — employers will reach out here</p>
                    </div>
                  ) : (
                    <div className="dash-list-item" style={{ cursor: "pointer" }} onClick={() => setTab("messages")}>
                      <div className="dash-list-left">
                        <p className="dash-list-title">You have {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</p>
                        <p className="dash-list-sub">Tap to open your inbox</p>
                      </div>
                      <span className="dash-unread-dot" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Applications ── */}
          {tab === "applications" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">My Applications</p>
                <p className="dash-page-sub">
                  {appsLoading ? "Loading..." : `${applications.length} job${applications.length !== 1 ? "s" : ""} applied to`}
                </p>
              </div>
              <div className="dash-content">
                {appsLoading ? (
                  <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: 32 }}>Loading applications...</p>
                ) : applications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 48 }}>
                    <p style={{ fontSize: 36, margin: "0 0 10px" }}>💼</p>
                    <p style={{ color: "#bbb", fontWeight: 600, fontSize: 14 }}>No applications yet</p>
                    <p style={{ color: "#ccc", fontSize: 12, margin: "6px 0 0" }}>Browse jobs and hit Apply to get started</p>
                    <button onClick={onBrowse} style={{ marginTop: 16, padding: "9px 20px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Browse Jobs →
                    </button>
                  </div>
                ) : (
                  <div className="dash-list">
                    {applications.map(a => {
                      const statusInfo = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                      const appliedDate = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      return (
                        <div key={a.id} className="dash-list-item">
                          <div className="dash-list-left">
                            <p className="dash-list-title">{a.jobs?.job_title}</p>
                            <p className="dash-list-sub">{a.employers?.company_name}</p>
                            <p className="dash-list-meta">Applied {appliedDate}</p>
                          </div>
                          <span className={`dash-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Messages ── */}
          {tab === "messages" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">Messages</p>
                <p className="dash-page-sub">Your conversations with employers</p>
              </div>
              <div className={`dash-messages-layout${activeConvo ? " has-active" : ""}`}>
                <div className="dash-convo-panel">
                  <div className="dash-convo-search">
                    <input placeholder="🔍  Search conversations..." />
                  </div>
                  <div className="dash-convo-list">
                    <ConversationList
                      userId={user.id}
                      role="seeker"
                      activeId={activeConvo?.id}
                      onSelect={setActiveConvo}
                    />
                  </div>
                </div>
                <ChatWindow
                  conversation={activeConvo}
                  userId={user.id}
                  role="seeker"
                  onBack={() => setActiveConvo(null)}
                />
              </div>
            </>
          )}

          {/* ── Profile ── */}
          {tab === "profile" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">My Profile</p>
                <p className="dash-page-sub">Your info as employers see it</p>
              </div>
              <div className="dash-content">
                <div className="dash-list">
                  {[
                    { label: "Name",              val: fullName,                                            done: !!profile?.first_name },
                    { label: "Email",             val: profile?.email,                                      done: !!profile?.email },
                    { label: "Phone",             val: profile?.phone,                                      done: !!profile?.phone },
                    { label: "Zip Code",          val: profile?.zip_code,                                   done: !!profile?.zip_code },
                    { label: "Interests",         val: profile?.interests?.join(", "),                      done: profile?.interests?.length > 0 },
                    { label: "Availability",      val: profile?.availability?.join(", "),                   done: profile?.availability?.length > 0 },
                    { label: "Travel Distance",   val: profile?.distance,                                   done: !!profile?.distance },
                    { label: "Parent / Guardian", val: profile?.parent_email,                               done: !!profile?.parent_email },
                  ].map((f, i) => (
                    <div key={i} className="dash-list-item">
                      <div className="dash-list-left">
                        <p className="dash-list-title">{f.label}</p>
                        <p className="dash-list-sub">{f.val || "Not provided"}</p>
                      </div>
                      <span className={`dash-badge ${f.done ? "badge-green" : "badge-gray"}`}>
                        {f.done ? "✓ Complete" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="dash-bottom-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`dash-bottom-nav-item${tab === item.id ? " active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.badge > 0 && <span className="dash-bottom-nav-badge">{item.badge}</span>}
            <span className="dash-bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
