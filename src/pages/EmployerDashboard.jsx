import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import ChatWindow from "../components/chat/ChatWindow";
import ConversationList from "../components/chat/ConversationList";
import { fetchEmployerApplicants, updateApplicationStatus, subscribeToNewApplications } from "../lib/applications";
import { getOrCreateConversation, fetchConversationById, fetchUnreadCount, subscribeToConversationUpdates } from "../lib/chat";
import { supabase } from "../lib/supabase";
import "../styles/dashboard.css";
import "../styles/homepage.css";

const STATUS_LABELS = {
  pending:  { label: "New",      cls: "badge-orange" },
  reviewed: { label: "Reviewed", cls: "badge-blue"   },
  accepted: { label: "Accepted", cls: "badge-green"  },
  rejected: { label: "Declined", cls: "badge-gray"   },
};

export default function EmployerDashboard({ user, onSignOut, onBrowse }) {
  const [tab, setTab] = useState("overview");
  const [activeConvo, setActiveConvo] = useState(null);

  // Real data
  const [profile, setProfile] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(true);
  const [messagingId, setMessagingId] = useState(null);
  const [messagingError, setMessagingError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch employer profile
  useEffect(() => {
    supabase.from("employers").select("*").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user.id]);

  // Fetch employer's job listings
  useEffect(() => {
    supabase.from("jobs").select("*").eq("employer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEmployerJobs(data); });
  }, [user.id]);

  // Real-time unread count
  useEffect(() => {
    fetchUnreadCount(user.id, "poster").then(setUnreadCount);
    const unsubscribe = subscribeToConversationUpdates(user.id, () => {
      fetchUnreadCount(user.id, "poster").then(setUnreadCount);
    }, "employer-badge");
    return unsubscribe;
  }, [user.id]);

  // Fetch applicants + real-time refresh
  useEffect(() => {
    fetchEmployerApplicants(user.id)
      .then(data => { setApplicants(data); setApplicantsLoading(false); })
      .catch(() => setApplicantsLoading(false));
  }, [user.id]);

  useEffect(() => {
    const unsubscribe = subscribeToNewApplications(user.id, () => {
      fetchEmployerApplicants(user.id).then(data => setApplicants(data)).catch(() => {});
    });
    return unsubscribe;
  }, [user.id]);

  const handleMessageApplicant = async (applicant) => {
    setMessagingId(applicant.id);
    setMessagingError(null);
    try {
      const seekerId = applicant.seekers?.id ?? applicant.seeker_id;
      if (!seekerId) throw new Error("Seeker profile not found — they may need to sign up through the app.");
      const convoId = await getOrCreateConversation(applicant.jobs.id, seekerId, user.id);
      const convo = await fetchConversationById(convoId);
      setActiveConvo(convo);
      setTab("messages");
    } catch (e) {
      console.error("Failed to open conversation:", e);
      setMessagingError(e?.message ?? "Failed to open chat. Check console for details.");
    } finally {
      setMessagingId(null);
    }
  };

  const handleStatusChange = async (applicationId, status) => {
    await updateApplicationStatus(applicationId, status);
    setApplicants(prev => prev.map(a => a.id === applicationId ? { ...a, status } : a));
  };

  const companyName = profile?.company_name ?? "Your Company";
  const companyInitial = companyName[0].toUpperCase();
  const newApplicants = applicants.filter(a => a.status === "pending").length;

  const navItems = [
    { id: "overview",   icon: "📊", label: "Overview" },
    { id: "jobs",       icon: "📋", label: "My Jobs" },
    { id: "applicants", icon: "👥", label: "Applicants", badge: newApplicants },
    { id: "messages",   icon: "💬", label: "Messages", badge: unreadCount },
    { id: "settings",   icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="dash-wrap">
      <Navbar user={user} onLogin={() => {}} onRegister={() => {}} onSignOut={onSignOut} onDashboard={() => {}} />

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-profile-card">
            <div className="dash-avatar">{companyInitial}</div>
            <p className="dash-profile-name">{companyName}</p>
            <p className="dash-profile-sub">Employer</p>
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
                <p className="dash-page-title">Welcome back, {profile?.contact_name?.split(" ")[0] ?? "there"} 👋</p>
                <p className="dash-page-sub">Here's a snapshot of your hiring activity.</p>
              </div>
              <div className="dash-content">
                <div className="dash-stats">
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">📋</div>
                    <p className="dash-stat-val">{employerJobs.length}</p>
                    <p className="dash-stat-label">Active Jobs</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">👥</div>
                    <p className="dash-stat-val">{applicants.length}</p>
                    <p className="dash-stat-label">Total Applicants</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">🔔</div>
                    <p className="dash-stat-val">{newApplicants}</p>
                    <p className="dash-stat-label">New Applicants</p>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon">💬</div>
                    <p className="dash-stat-val">{unreadCount}</p>
                    <p className="dash-stat-label">Unread Messages</p>
                  </div>
                </div>

                <p className="dash-section-title">My Job Listings</p>
                <div className="dash-list">
                  {employerJobs.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <p style={{ color: "#bbb", fontSize: 13 }}>No jobs posted yet</p>
                    </div>
                  ) : employerJobs.slice(0, 3).map(j => (
                    <div key={j.id} className="dash-list-item">
                      <div className="dash-list-left">
                        <p className="dash-list-title">{j.job_title}</p>
                        <p className="dash-list-sub">{j.positions_count} opening{j.positions_count !== 1 ? "s" : ""} · Posted {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                      <span className="dash-badge badge-green">Active</span>
                    </div>
                  ))}
                </div>

                <p className="dash-section-title" style={{ marginTop: 24 }}>Recent Applicants</p>
                <div className="dash-list">
                  {applicants.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <p style={{ color: "#bbb", fontSize: 13 }}>No applicants yet</p>
                    </div>
                  ) : applicants.slice(0, 3).map(a => {
                    const name = a.seekers ? `${a.seekers.first_name} ${a.seekers.last_name}` : "Applicant";
                    const statusInfo = STATUS_LABELS[a.status] || STATUS_LABELS.pending;
                    return (
                      <div key={a.id} className="dash-list-item" style={{ cursor: "pointer" }}
                        onClick={() => setTab("applicants")}>
                        <div className="dash-list-left">
                          <p className="dash-list-title">{name}</p>
                          <p className="dash-list-sub">Re: {a.jobs?.job_title}</p>
                        </div>
                        <span className={`dash-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── My Jobs ── */}
          {tab === "jobs" && (
            <>
              <div className="dash-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="dash-page-title">My Jobs</p>
                  <p className="dash-page-sub">{employerJobs.length} listing{employerJobs.length !== 1 ? "s" : ""}</p>
                </div>
                <button style={{ padding: "9px 18px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Post New Job
                </button>
              </div>
              <div className="dash-content">
                {employerJobs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 48 }}>
                    <p style={{ fontSize: 36, margin: "0 0 10px" }}>📋</p>
                    <p style={{ color: "#bbb", fontWeight: 600, fontSize: 14 }}>No jobs posted yet</p>
                  </div>
                ) : (
                  <div className="dash-list">
                    {employerJobs.map(j => {
                      const jobApplicants = applicants.filter(a => a.jobs?.id === j.id);
                      return (
                        <div key={j.id} className="dash-list-item">
                          <div className="dash-list-left">
                            <p className="dash-list-title">{j.job_title}</p>
                            <p className="dash-list-sub">{j.positions_count} opening{j.positions_count !== 1 ? "s" : ""} · Posted {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span className="dash-badge badge-blue">{jobApplicants.length} applicant{jobApplicants.length !== 1 ? "s" : ""}</span>
                            <span className="dash-badge badge-green">Active</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Applicants ── */}
          {tab === "applicants" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">Applicants</p>
                <p className="dash-page-sub">
                  {applicantsLoading ? "Loading..." : `${applicants.length} applicant${applicants.length !== 1 ? "s" : ""} across all jobs`}
                </p>
              </div>
              <div className="dash-content">
                {applicantsLoading ? (
                  <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: 32 }}>Loading applicants...</p>
                ) : applicants.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 48 }}>
                    <p style={{ fontSize: 36, margin: "0 0 10px" }}>👥</p>
                    <p style={{ color: "#bbb", fontWeight: 600, fontSize: 14 }}>No applicants yet</p>
                    <p style={{ color: "#ccc", fontSize: 12, margin: "6px 0 0" }}>Applicants will appear here when teens apply to your jobs</p>
                  </div>
                ) : (
                  <div className="dash-list">
                    {messagingError && (
                      <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#c0392b" }}>
                        ⚠️ {messagingError}
                      </div>
                    )}
                    {applicants.map(a => {
                      const s = a.seekers;
                      const name = s ? `${s.first_name} ${s.last_name}` : "Applicant";
                      const statusInfo = STATUS_LABELS[a.status] || STATUS_LABELS.pending;
                      const appliedDate = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      return (
                        <div key={a.id} className="dash-list-item" style={{ flexWrap: "wrap", gap: 12 }}>
                          <div className="dash-list-left" style={{ flex: 1, minWidth: 180 }}>
                            <p className="dash-list-title">{name}</p>
                            <p className="dash-list-sub">Re: {a.jobs?.job_title}</p>
                            <p className="dash-list-meta">Applied {appliedDate}</p>
                            {s?.interests?.length > 0 && (
                              <p className="dash-list-meta" style={{ marginTop: 2 }}>
                                🏷️ {s.interests.slice(0, 3).join(" · ")}
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <select
                              value={a.status}
                              onChange={e => handleStatusChange(a.id, e.target.value)}
                              style={{ fontSize: 12, padding: "4px 8px", border: "1.5px solid #eee", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#555", fontWeight: 600 }}
                            >
                              <option value="pending">New</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Declined</option>
                            </select>
                            <span className={`dash-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                            <button
                              onClick={() => handleMessageApplicant(a)}
                              disabled={messagingId === a.id}
                              style={{ fontSize: 12, padding: "5px 14px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: messagingId === a.id ? 0.6 : 1 }}
                            >
                              {messagingId === a.id ? "Opening..." : "💬 Message"}
                            </button>
                          </div>
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
                <p className="dash-page-sub">Your conversations with applicants</p>
              </div>
              <div className="dash-messages-layout">
                <div className="dash-convo-panel">
                  <div className="dash-convo-search">
                    <input placeholder="🔍  Search conversations..." />
                  </div>
                  <div className="dash-convo-list">
                    <ConversationList
                      userId={user.id}
                      role="poster"
                      activeId={activeConvo?.id}
                      onSelect={setActiveConvo}
                    />
                  </div>
                </div>
                <ChatWindow conversation={activeConvo} userId={user.id} role="poster" />
              </div>
            </>
          )}

          {/* ── Settings ── */}
          {tab === "settings" && (
            <>
              <div className="dash-page-header">
                <p className="dash-page-title">Settings</p>
                <p className="dash-page-sub">Your company profile</p>
              </div>
              <div className="dash-content">
                <div className="dash-list">
                  {[
                    { label: "Company Name",   val: profile?.company_name },
                    { label: "Contact Person", val: profile?.contact_name },
                    { label: "Email",          val: profile?.contact_email },
                    { label: "Phone",          val: profile?.contact_phone },
                    { label: "Business Zip",   val: profile?.company_zip },
                  ].map((f, i) => (
                    <div key={i} className="dash-list-item">
                      <div className="dash-list-left">
                        <p className="dash-list-title">{f.label}</p>
                        <p className="dash-list-sub">{f.val ?? "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
