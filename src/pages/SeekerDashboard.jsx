import { useState, useEffect } from "react";
import Navbar from "../components/shared/Navbar";
import ChatWindow from "../components/chat/ChatWindow";
import ConversationList from "../components/chat/ConversationList";
import { fetchSeekerApplications } from "../lib/applications";
import { fetchUnreadCount, subscribeToConversationUpdates } from "../lib/chat";
import { supabase } from "../lib/supabase";
import { AVAILABILITY_OPTIONS, CATEGORY_OPTIONS, DISTANCE_OPTIONS } from "../constants/options";
import "../styles/dashboard.css";
import "../styles/homepage.css";

const INPUT  = { width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#1a1a2e" };
const LABEL  = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5 };
const FIELD  = { marginBottom: 14 };
const CHIP   = (active) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 50, border: `1.5px solid ${active ? "#FF6B35" : "#e5e7eb"}`, background: active ? "rgba(255,107,53,0.07)" : "#fff", color: active ? "#FF6B35" : "#555", fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginRight: 6, marginBottom: 6 });

const STATUS_STYLE = {
  pending:  { cls: "badge-orange", label: "Under Review"        },
  reviewed: { cls: "badge-blue",   label: "Under Review"        },
  accepted: { cls: "badge-green",  label: "Interview Scheduled" },
  rejected: { cls: "badge-red",    label: "Declined"            },
};

export default function SeekerDashboard({ user, onSignOut, onBrowse }) {
  const [tab, setTab] = useState("overview");
  const [activeConvo, setActiveConvo] = useState(null);

  // Real data
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const startEditing = () => {
    setEditForm({
      firstName:    profile?.first_name    ?? "",
      lastName:     profile?.last_name     ?? "",
      phone:        profile?.phone         ?? "",
      zipCode:      profile?.zip_code      ?? "",
      parentEmail:  profile?.parent_email  ?? "",
      availability: profile?.availability  ?? [],
      interests:    profile?.interests     ?? [],
      distance:     profile?.distance      ?? "",
      customInterest: "",
    });
    setSaveError("");
    setEditing(true);
  };

  const ef = (field, val) => setEditForm(f => ({ ...f, [field]: val }));
  const toggleArr = (field, item) => setEditForm(f => ({
    ...f,
    [field]: f[field].includes(item) ? f[field].filter(i => i !== item) : [...f[field], item],
  }));
  const addCustomInterest = () => {
    const val = editForm.customInterest.trim();
    if (val && !editForm.interests.includes(val)) {
      ef("interests", [...editForm.interests, val]);
      ef("customInterest", "");
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.firstName.trim()) { setSaveError("First name is required."); return; }
    setSaveError("");
    setSaving(true);
    try {
      const { error } = await supabase.from("seekers").update({
        first_name:   editForm.firstName.trim(),
        last_name:    editForm.lastName.trim(),
        phone:        editForm.phone.trim(),
        zip_code:     editForm.zipCode.trim(),
        parent_email: editForm.parentEmail.trim(),
        availability: editForm.availability,
        interests:    editForm.interests,
        distance:     editForm.distance,
      }).eq("id", user.id);
      if (error) throw error;
      // Update local state immediately — no re-fetch needed
      setProfile(p => ({
        ...p,
        first_name:   editForm.firstName.trim(),
        last_name:    editForm.lastName.trim(),
        phone:        editForm.phone.trim(),
        zip_code:     editForm.zipCode.trim(),
        parent_email: editForm.parentEmail.trim(),
        availability: editForm.availability,
        interests:    editForm.interests,
        distance:     editForm.distance,
      }));
      setEditing(false);
    } catch (e) {
      setSaveError(e.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      <Navbar user={user} onLogin={() => {}} onRegister={() => {}} onSignOut={onSignOut} onDashboard={() => {}} onHome={onBrowse} />

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
              <div className="dash-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="dash-page-title">My Profile</p>
                  <p className="dash-page-sub">Your info as employers see it</p>
                </div>
                {!editing && (
                  <button onClick={startEditing} style={{ padding: "8px 16px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              <div className="dash-content">
                {/* ── View mode ── */}
                {!editing && (() => {
                  // Compute age from DOB
                  const age = (() => {
                    if (!profile?.dob) return null;
                    const t = new Date(), b = new Date(profile.dob);
                    let a = t.getFullYear() - b.getFullYear();
                    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
                    return a;
                  })();

                  const genderDisplay = profile?.gender === "custom" ? profile?.gender_custom : profile?.gender;
                  const distanceLabel = DISTANCE_OPTIONS.find(o => o.id === profile?.distance);
                  const experiences = profile?.experiences ?? [];

                  const SectionTitle = ({ children }) => (
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.8px", margin: "24px 0 10px" }}>{children}</p>
                  );
                  const Row = ({ label, value }) => value ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f5f5f5", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#999", flexShrink: 0, minWidth: 120 }}>{label}</span>
                      <span style={{ fontSize: 14, color: "#1a1a2e", fontWeight: 500, textAlign: "right" }}>{value}</span>
                    </div>
                  ) : null;

                  return (
                    <div>
                      {/* Hero card */}
                      <div style={{ background: "linear-gradient(135deg, #FF6B35, #FFB347)", borderRadius: 16, padding: "24px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 18, color: "#fff", margin: "0 0 2px" }}>{fullName}</p>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}>
                            {[age ? `Age ${age}` : null, genderDisplay, profile?.zip_code ? `📍 ${profile.zip_code}` : null].filter(Boolean).join(" · ") || "Job Seeker"}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      <SectionTitle>Contact</SectionTitle>
                      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "0 16px" }}>
                        <Row label="Email"              value={profile?.email} />
                        <Row label="Phone"              value={profile?.phone} />
                        <Row label="Zip Code"           value={profile?.zip_code} />
                        <Row label="Contact Preference" value={profile?.contact_preference} />
                        <Row label="Parent / Guardian"  value={profile?.parent_email} />
                      </div>

                      {/* Availability & Distance */}
                      <SectionTitle>Availability & Distance</SectionTitle>
                      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px" }}>
                        {profile?.availability?.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: distanceLabel ? 10 : 0 }}>
                            {profile.availability.map(id => {
                              const o = AVAILABILITY_OPTIONS.find(o => o.id === id);
                              return o ? (
                                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 50, fontSize: 13, color: "#FF6B35", fontWeight: 600 }}>
                                  {o.icon} {o.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: "#ccc", margin: "0 0 10px" }}>No availability set</p>
                        )}
                        {distanceLabel && (
                          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                            {distanceLabel.icon} Will travel up to <strong>{distanceLabel.label}</strong> — {distanceLabel.desc}
                          </p>
                        )}
                      </div>

                      {/* Interests */}
                      <SectionTitle>Interests</SectionTitle>
                      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px" }}>
                        {profile?.interests?.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {profile.interests.map(id => {
                              const o = CATEGORY_OPTIONS.find(o => o.id === id);
                              return (
                                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#f5f5f5", border: "1px solid #e5e7eb", borderRadius: 50, fontSize: 13, color: "#555", fontWeight: 500 }}>
                                  {o ? `${o.icon} ${o.label}` : `✨ ${id}`}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>No interests added</p>
                        )}
                      </div>

                      {/* Experience */}
                      <SectionTitle>Experience</SectionTitle>
                      {experiences.length === 0 ? (
                        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
                          <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>No experience entries added</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {experiences.map((exp, i) => (
                            <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", margin: "0 0 4px" }}>{exp.title || "Untitled"}</p>
                                {exp.dur && <span className="dash-badge badge-blue" style={{ flexShrink: 0 }}>{exp.dur}</span>}
                              </div>
                              {exp.desc && <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>{exp.desc}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Edit mode ── */}
                {editing && (
                  <div>
                    {/* Name */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 0 }}>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>First Name *</label>
                        <input style={INPUT} value={editForm.firstName} onChange={e => ef("firstName", e.target.value)} placeholder="First name" />
                      </div>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>Last Name</label>
                        <input style={INPUT} value={editForm.lastName} onChange={e => ef("lastName", e.target.value)} placeholder="Last name" />
                      </div>
                    </div>

                    {/* Phone + Zip */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>Phone</label>
                        <input style={INPUT} value={editForm.phone} onChange={e => ef("phone", e.target.value)} placeholder="(555) 000-0000" />
                      </div>
                      <div style={{ ...FIELD, flex: 1 }}>
                        <label style={LABEL}>Zip Code</label>
                        <input style={INPUT} value={editForm.zipCode} onChange={e => ef("zipCode", e.target.value)} placeholder="10001" maxLength={10} />
                      </div>
                    </div>

                    {/* Parent email */}
                    <div style={FIELD}>
                      <label style={LABEL}>Parent / Guardian Email</label>
                      <input style={INPUT} value={editForm.parentEmail} onChange={e => ef("parentEmail", e.target.value)} placeholder="parent@email.com" type="email" />
                    </div>

                    {/* Availability */}
                    <div style={FIELD}>
                      <label style={LABEL}>Availability</label>
                      <div style={{ marginTop: 6 }}>
                        {AVAILABILITY_OPTIONS.map(o => (
                          <button key={o.id} onClick={() => toggleArr("availability", o.id)} style={CHIP(editForm.availability.includes(o.id))}>
                            {o.icon} {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div style={FIELD}>
                      <label style={LABEL}>Interests</label>
                      <div style={{ marginTop: 6, marginBottom: 8 }}>
                        {CATEGORY_OPTIONS.map(o => (
                          <button key={o.id} onClick={() => toggleArr("interests", o.id)} style={CHIP(editForm.interests.includes(o.id))}>
                            {o.icon} {o.label}
                          </button>
                        ))}
                        {editForm.interests.filter(i => !CATEGORY_OPTIONS.find(o => o.id === i)).map(i => (
                          <button key={i} onClick={() => toggleArr("interests", i)} style={CHIP(true)}>
                            ✨ {i}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...INPUT, flex: 1 }} value={editForm.customInterest} onChange={e => ef("customInterest", e.target.value)} placeholder="Add custom interest..." onKeyDown={e => e.key === "Enter" && addCustomInterest()} />
                        <button onClick={addCustomInterest} style={{ padding: "10px 14px", background: "#FF6B35", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add</button>
                      </div>
                    </div>

                    {/* Distance */}
                    <div style={FIELD}>
                      <label style={LABEL}>Max Travel Distance</label>
                      <div style={{ marginTop: 6 }}>
                        {DISTANCE_OPTIONS.map(o => (
                          <button key={o.id} onClick={() => ef("distance", o.id)} style={CHIP(editForm.distance === o.id)}>
                            {o.icon} {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {saveError && (
                      <p style={{ padding: "8px 12px", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 8, color: "#c0392b", fontSize: 13, marginBottom: 14 }}>
                        {saveError}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1.5px solid #e5e7eb", borderRadius: 10, color: "#888", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
