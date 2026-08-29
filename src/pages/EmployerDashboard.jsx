import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import ChatWindow from "../components/chat/ChatWindow";
import ConversationList from "../components/chat/ConversationList";
import PostJobModal from "../components/employer/PostJobModal";
import { fetchEmployerApplicants, updateApplicationStatus, subscribeToNewApplications } from "../lib/applications";
import { getOrCreateConversation, fetchConversationById, fetchUnreadCount, subscribeToConversationUpdates } from "../lib/chat";
import { supabase } from "../lib/supabase";
import "../styles/dashboard.css";
import "../styles/homepage.css";

const INPUT = { width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#1a1a2e" };
const LABEL = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5 };
const FIELD = { marginBottom: 14 };

const STATUS_LABELS = {
  pending:  { label: "New",      cls: "badge-orange" },
  reviewed: { label: "Under Review", cls: "badge-blue"   },
  accepted: { label: "Accepted", cls: "badge-green"  },
  rejected: { label: "Declined", cls: "badge-red"    },
};

export default function EmployerDashboard({ user, onSignOut, onBrowse }) {
  const [tab, setTab] = useState("overview");
  const [activeConvo, setActiveConvo] = useState(null);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Company profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const startEditingProfile = () => {
    setEditForm({
      companyName:   profile?.company_name   ?? "",
      contactName:   profile?.contact_name   ?? "",
      contactEmail:  profile?.contact_email  ?? "",
      contactPhone:  profile?.contact_phone  ?? "",
      companyZip:    profile?.company_zip    ?? "",
    });
    setSaveError("");
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.companyName.trim()) { setSaveError("Company name is required."); return; }
    setSaveError("");
    setSaving(true);
    try {
      const { error } = await supabase.from("employers").update({
        company_name:  editForm.companyName.trim(),
        contact_name:  editForm.contactName.trim(),
        contact_email: editForm.contactEmail.trim(),
        contact_phone: editForm.contactPhone.trim(),
        company_zip:   editForm.companyZip.trim(),
      }).eq("id", user.id);
      if (error) throw error;
      setProfile(p => ({
        ...p,
        company_name:  editForm.companyName.trim(),
        contact_name:  editForm.contactName.trim(),
        contact_email: editForm.contactEmail.trim(),
        contact_phone: editForm.contactPhone.trim(),
        company_zip:   editForm.companyZip.trim(),
      }));
      setEditingProfile(false);
    } catch (e) {
      setSaveError(e.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
  const refreshJobs = () => {
    supabase.from("jobs").select("*").eq("employer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEmployerJobs(data); });
  };
  useEffect(refreshJobs, [user.id]);

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

  // Polling fallback — refreshes every 30 s in case the realtime subscription misses an event
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmployerApplicants(user.id).then(data => setApplicants(data)).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleToggleClose = async (job) => {
    const { error } = await supabase.from("jobs").update({ is_closed: !job.is_closed }).eq("id", job.id);
    if (!error) refreshJobs();
  };

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
      <Navbar user={user} onLogin={() => {}} onRegister={() => {}} onSignOut={onSignOut} onDashboard={() => {}} onHome={onBrowse} />

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
                    <p className="dash-stat-val">{employerJobs.filter(j => !j.is_closed).length}</p>
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
                      <p style={{ color: "#bbb", fontSize: 13, marginBottom: 10 }}>No jobs posted yet</p>
                      <button
                        onClick={() => setPostJobOpen(true)}
                        style={{ padding: "8px 18px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        + Post a Job
                      </button>
                    </div>
                  ) : employerJobs.slice(0, 3).map(j => (
                    <div key={j.id} className="dash-list-item">
                      <div className="dash-list-left">
                        <p className="dash-list-title">{j.job_title}</p>
                        <p className="dash-list-sub">{j.positions_count} opening{j.positions_count !== 1 ? "s" : ""} · Posted {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                      <span className={`dash-badge ${j.is_closed ? "badge-gray" : "badge-green"}`}>
                        {j.is_closed ? "Filled" : "Active"}
                      </span>
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
          {tab === "jobs" && (() => {
            const activeJobs = employerJobs.filter(j => !j.is_closed);
            const closedJobs = employerJobs.filter(j =>  j.is_closed);
            return (
              <>
                <div className="dash-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p className="dash-page-title">My Jobs</p>
                    <p className="dash-page-sub">{activeJobs.length} active · {closedJobs.length} closed</p>
                  </div>
                  <button onClick={() => setPostJobOpen(true)} style={{ padding: "9px 18px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    + Post New Job
                  </button>
                </div>
                <div className="dash-content">
                  {employerJobs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48 }}>
                      <p style={{ fontSize: 36, margin: "0 0 10px" }}>📋</p>
                      <p style={{ color: "#bbb", fontWeight: 600, fontSize: 14 }}>No jobs posted yet</p>
                      <p style={{ color: "#ccc", fontSize: 12, margin: "4px 0 16px" }}>Post your first job to start receiving applications</p>
                      <button onClick={() => setPostJobOpen(true)} style={{ padding: "10px 24px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                        + Post Your First Job
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Active listings */}
                      {activeJobs.length > 0 && (
                        <>
                          <p className="dash-section-title">Active Listings</p>
                          <div className="dash-list" style={{ marginBottom: 28 }}>
                            {activeJobs.map(j => {
                              const jobApplicants = applicants.filter(a => a.jobs?.id === j.id);
                              return (
                                <div key={j.id} className="dash-list-item" style={{ flexWrap: "wrap", gap: 10 }}>
                                  <div className="dash-list-left">
                                    <p className="dash-list-title">{j.job_title}</p>
                                    <p className="dash-list-sub">{j.positions_count} opening{j.positions_count !== 1 ? "s" : ""} · Posted {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                  </div>
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span className="dash-badge badge-blue">{jobApplicants.length} applicant{jobApplicants.length !== 1 ? "s" : ""}</span>
                                    <span className="dash-badge badge-green">Active</span>
                                    <button onClick={() => setEditingJob(j)} style={{ fontSize: 12, padding: "4px 12px", background: "#fff", color: "#555", border: "1.5px solid #e0e0e0", borderRadius: 7, fontWeight: 600, cursor: "pointer" }}>
                                      ✏️ Edit
                                    </button>
                                    <button onClick={() => handleToggleClose(j)} style={{ fontSize: 12, padding: "4px 12px", background: "#fff", color: "#888", border: "1.5px solid #e0e0e0", borderRadius: 7, fontWeight: 600, cursor: "pointer" }}>
                                      ✓ Mark Filled
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Closed listings */}
                      {closedJobs.length > 0 && (
                        <>
                          <p className="dash-section-title" style={{ color: "#aaa" }}>Closed Listings</p>
                          <div className="dash-list">
                            {closedJobs.map(j => (
                              <div key={j.id} className="dash-list-item" style={{ opacity: 0.7, flexWrap: "wrap", gap: 10 }}>
                                <div className="dash-list-left">
                                  <p className="dash-list-title">{j.job_title}</p>
                                  <p className="dash-list-sub">Closed · Posted {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <span className="dash-badge badge-gray">Filled</span>
                                  <button onClick={() => handleToggleClose(j)} style={{ fontSize: 12, padding: "4px 12px", background: "#fff", color: "#FF6B35", border: "1.5px solid #FF6B35", borderRadius: 7, fontWeight: 600, cursor: "pointer" }}>
                                    Reopen
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            );
          })()}

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
                    <p style={{ color: "#ccc", fontSize: 12, margin: "6px 0 16px" }}>
                      {employerJobs.length === 0
                        ? "Post a job first — applicants will show up here once teens start applying"
                        : "Your jobs are live! Applicants will appear here as teens apply"}
                    </p>
                    {employerJobs.length === 0 && (
                      <button
                        onClick={() => { setTab("jobs"); setPostJobOpen(true); }}
                        style={{ padding: "10px 24px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                        + Post Your First Job
                      </button>
                    )}
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
                        <div key={a.id} className="dash-list-item" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
                          {/* Left: applicant info + status badge */}
                          <div className="dash-list-left" style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                              <p className="dash-list-title" style={{ margin: 0 }}>{name}</p>
                              <span className={`dash-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                            </div>
                            <p className="dash-list-sub">Re: {a.jobs?.job_title}</p>
                            <p className="dash-list-meta">Applied {appliedDate}</p>
                            {s?.phone && (
                              <p className="dash-list-meta" style={{ marginTop: 2 }}>📞 {s.phone}</p>
                            )}
                            {s?.interests?.length > 0 && (
                              <p className="dash-list-meta" style={{ marginTop: 2 }}>
                                🏷️ {s.interests.slice(0, 3).join(" · ")}
                              </p>
                            )}
                          </div>
                          {/* Right: change status + message */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", minWidth: 130 }}>
                            <select
                              value={a.status}
                              onChange={e => handleStatusChange(a.id, e.target.value)}
                              style={{ fontSize: 12, padding: "6px 10px", border: "1.5px solid #e0e0e0", borderRadius: 8, background: "#f9f9f9", cursor: "pointer", color: "#444", fontWeight: 600, fontFamily: "inherit", outline: "none", width: "100%" }}
                            >
                              <option value="pending">New</option>
                              <option value="reviewed">Under Review</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Declined</option>
                            </select>
                            <button
                              onClick={() => handleMessageApplicant(a)}
                              disabled={messagingId === a.id}
                              style={{ fontSize: 12, padding: "7px 12px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: messagingId === a.id ? "not-allowed" : "pointer", opacity: messagingId === a.id ? 0.6 : 1, fontFamily: "inherit", whiteSpace: "nowrap", textAlign: "center" }}
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
              <div className={`dash-messages-layout${activeConvo ? " has-active" : ""}`}>
                <div className="dash-convo-panel">
                  <div className="dash-convo-search">
                    <input placeholder="🔍  Search conversations..." />
                  </div>
                  {/* Guidance banner for new employers */}
                  {employerJobs.length === 0 && (
                    <div style={{ margin: "12px 14px", padding: "12px 14px", background: "#fff8f5", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#FF6B35", margin: "0 0 4px" }}>No conversations yet</p>
                      <p style={{ fontSize: 12, color: "#888", margin: "0 0 10px", lineHeight: 1.5 }}>Post a job first — then message applicants from the Applicants tab to start a conversation.</p>
                      <button
                        onClick={() => { setTab("jobs"); setPostJobOpen(true); }}
                        style={{ fontSize: 12, padding: "6px 14px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, cursor: "pointer" }}>
                        + Post a Job
                      </button>
                    </div>
                  )}
                  {employerJobs.length > 0 && applicants.length === 0 && (
                    <div style={{ margin: "12px 14px", padding: "12px 14px", background: "#f8f9fa", border: "1px solid #eee", borderRadius: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>No conversations yet</p>
                      <p style={{ fontSize: 12, color: "#aaa", margin: 0, lineHeight: 1.5 }}>Once teens apply, go to the Applicants tab and hit Message to start a conversation.</p>
                    </div>
                  )}
                  <div className="dash-convo-list">
                    <ConversationList
                      userId={user.id}
                      role="poster"
                      activeId={activeConvo?.id}
                      onSelect={setActiveConvo}
                    />
                  </div>
                </div>
                <ChatWindow
                  conversation={activeConvo}
                  userId={user.id}
                  role="poster"
                  onBack={() => setActiveConvo(null)}
                  onRead={() => fetchUnreadCount(user.id, "poster").then(setUnreadCount)}
                />
              </div>
            </>
          )}

          {/* ── Settings ── */}
          {tab === "settings" && (
            <>
              <div className="dash-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="dash-page-title">Settings</p>
                  <p className="dash-page-sub">Your company profile</p>
                </div>
                {!editingProfile && (
                  <button onClick={startEditingProfile} style={{ padding: "8px 16px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
              <div className="dash-content">

                {/* ── View mode ── */}
                {!editingProfile && (
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
                        <span className={`dash-badge ${f.val ? "badge-green" : "badge-gray"}`}>
                          {f.val ? "✓" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Edit mode ── */}
                {editingProfile && (
                  <div>
                    <div style={FIELD}>
                      <label style={LABEL}>Company Name *</label>
                      <input style={INPUT} value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Acme Corp" />
                    </div>
                    <div style={FIELD}>
                      <label style={LABEL}>Contact Person</label>
                      <input style={INPUT} value={editForm.contactName} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Jane Smith" />
                    </div>
                    <div style={FIELD}>
                      <label style={LABEL}>Email</label>
                      <input style={INPUT} type="email" value={editForm.contactEmail} onChange={e => setEditForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="jane@company.com" />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>Phone</label>
                        <input style={INPUT} value={editForm.contactPhone} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="(555) 000-0000" />
                      </div>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>Business Zip</label>
                        <input style={INPUT} value={editForm.companyZip} onChange={e => setEditForm(f => ({ ...f, companyZip: e.target.value }))} placeholder="10001" maxLength={10} />
                      </div>
                    </div>

                    {saveError && (
                      <p style={{ padding: "8px 12px", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, color: "#c0392b", fontSize: 13, marginBottom: 14 }}>
                        {saveError}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button onClick={() => setEditingProfile(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1.5px solid #e5e7eb", borderRadius: 10, color: "#888", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        Cancel
                      </button>
                      <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 2, padding: "11px", background: saving ? "#ccc" : "linear-gradient(135deg, #22C55E, #16A34A)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                        {saving ? "Saving..." : "Save Changes ✓"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Post New Job modal */}
      {postJobOpen && (
        <PostJobModal
          userId={user.id}
          onClose={() => setPostJobOpen(false)}
          onSuccess={() => { setPostJobOpen(false); refreshJobs(); setTab("jobs"); }}
        />
      )}

      {/* Edit Job modal */}
      {editingJob && (
        <PostJobModal
          userId={user.id}
          jobId={editingJob.id}
          initialData={editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={() => { setEditingJob(null); refreshJobs(); }}
        />
      )}

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
