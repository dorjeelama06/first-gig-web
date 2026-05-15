import { useState } from "react";
import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS } from "../../constants/options";

function formatPay(job) {
  if (job.pay_type === "flat") return `$${job.pay_min} flat rate`;
  if (job.pay_type === "negotiable") return job.pay_min ? `From $${job.pay_min}/hr (negotiable)` : "Negotiable";
  if (job.pay_min && job.pay_max) return `$${job.pay_min}–$${job.pay_max}/hr`;
  if (job.pay_min) return `$${job.pay_min}/hr`;
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function GlanceRow({ icon, label, value, sub }) {
  if (!value) return null;
  return (
    <div className="gs-glance-row">
      <span className="gs-glance-icon">{icon}</span>
      <div>
        <p className="gs-glance-val">{value}</p>
        {sub && <p className="gs-glance-sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function JobDetail({ job, user, onApply, appliedJobIds = [] }) {
  const [applying, setApplying] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const isApplied = justApplied || appliedJobIds.includes(job?.id);

  const handleApply = async () => {
    if (!user) { onApply(job); return; }
    if (isApplied || applying) return;
    setApplying(true);
    try {
      const result = await onApply(job);
      if (result?.alreadyApplied || result?.success) setJustApplied(true);
    } catch (e) {
      console.error("Apply failed:", e);
    } finally {
      setApplying(false);
    }
  };

  if (!job) return (
    <div className="gs-no-selection">
      <span style={{ fontSize: 48 }}>👈</span>
      <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Select a job to see details</p>
    </div>
  );

  const companyName = job.employers?.company_name ?? "Employer";
  const avatarLetter = companyName[0].toUpperCase();

  const catLabels = (job.job_category || []).map(id => {
    const f = CATEGORY_OPTIONS.find(o => o.id === id);
    return f ? `${f.icon} ${f.label}` : id;
  });

  const schedLabels = (job.schedule || []).map(id => {
    const f = AVAILABILITY_OPTIONS.find(o => o.id === id);
    return f ? f.label : id;
  });

  const location = job.is_remote
    ? "Remote"
    : [job.job_city, job.job_state, job.job_zip].filter(Boolean).join(", ");

  const pay = formatPay(job);

  const dateRange = (() => {
    const s = formatDate(job.start_date);
    const e = formatDate(job.end_date);
    if (s && e) return `${s} – ${e}`;
    if (s) return `Starts ${s}`;
    return null;
  })();

  const hoursAndSched = [
    job.hours_per_week ? `${job.hours_per_week} hrs/week` : null,
    schedLabels.length > 0 ? schedLabels.join(", ") : null,
  ].filter(Boolean).join(" · ");

  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="gs-job-detail">

      {/* ── Company header ── */}
      <div className="gs-detail-company-row">
        <div className="gs-detail-avatar">{avatarLetter}</div>
        <div>
          <p className="gs-detail-company-name">{companyName}</p>
          {catLabels.length > 0 && (
            <p className="gs-detail-company-cat">{catLabels.join(" · ")}</p>
          )}
        </div>
      </div>

      {/* ── Title + meta ── */}
      <h1 className="gs-job-detail-title">{job.job_title}</h1>

      {postedDate && (
        <p className="gs-detail-posted">Posted {postedDate}</p>
      )}

      {/* ── Apply button ── */}
      <div className="gs-detail-actions">
        <button
          className="gs-apply-btn"
          onClick={handleApply}
          disabled={isApplied || applying}
          style={isApplied ? { background: "#28a745", cursor: "default" } : {}}
        >
          {applying ? "Applying..." : isApplied ? "✅ Applied" : user ? "Apply Now" : "Sign Up to Apply →"}
        </button>
      </div>

      {isApplied && (
        <p className="gs-applied-note">
          Application sent — the employer will reach out via Messages if interested.
        </p>
      )}

      <hr className="gs-divider" />

      {/* ── At a glance ── */}
      <p className="gs-section-title">At a glance</p>
      <div className="gs-glance-list">
        <GlanceRow icon="📍" value={location || (job.is_remote ? "Remote" : null)} />
        <GlanceRow icon="💰" value={pay} />
        <GlanceRow icon="📅" value={dateRange} />
        <GlanceRow
          icon="⏰"
          value={hoursAndSched || null}
        />
        {job.min_age && (
          <GlanceRow icon="🎂" value={`${job.min_age}+ years old`} />
        )}
        {job.positions_count > 1 && (
          <GlanceRow icon="👥" value={`${job.positions_count} openings`} />
        )}
      </div>

      {/* ── Description ── */}
      {job.job_desc && (
        <>
          <hr className="gs-divider" />
          <p className="gs-section-title">Job description</p>
          <p className="gs-section-body">{job.job_desc}</p>
        </>
      )}

      {/* ── Requirements ── */}
      {(job.skills || job.dress_code || job.requirements) && (
        <>
          <hr className="gs-divider" />
          <p className="gs-section-title">Requirements</p>
          {job.skills && (
            <div className="gs-req-row">
              <p className="gs-req-label">Skills / Certifications</p>
              <p className="gs-req-val">{job.skills}</p>
            </div>
          )}
          {job.dress_code && (
            <div className="gs-req-row">
              <p className="gs-req-label">Dress Code</p>
              <p className="gs-req-val">{job.dress_code}</p>
            </div>
          )}
          {job.requirements && <p className="gs-section-body" style={{ marginTop: 8 }}>{job.requirements}</p>}
        </>
      )}

    </div>
  );
}
