import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS } from "../../constants/options";

function formatPay(job) {
  if (job.pay_type === "flat") return `$${job.pay_min} flat rate`;
  if (job.pay_type === "negotiable") return job.pay_min ? `From $${job.pay_min}/hr (Negotiable)` : "Negotiable";
  if (job.pay_min && job.pay_max) return `$${job.pay_min}–$${job.pay_max}/hr`;
  if (job.pay_min) return `$${job.pay_min}/hr`;
  return "Pay not listed";
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function JobDetail({ job, user, onApply }) {
  if (!job) return (
    <div className="gs-no-selection">
      <span style={{ fontSize: 48 }}>👈</span>
      <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Select a job to see details</p>
    </div>
  );

  const catLabels = (job.job_category || []).map(id => {
    const f = CATEGORY_OPTIONS.find(o => o.id === id);
    return f ? `${f.icon} ${f.label}` : id;
  });

  const schedLabels = (job.schedule || []).map(id => {
    const f = AVAILABILITY_OPTIONS.find(o => o.id === id);
    return f ? f.label : id;
  });

  const location = job.is_remote
    ? "🏠 Remote"
    : [job.job_address, job.job_city, job.job_state, job.job_zip].filter(Boolean).join(", ");

  return (
    <div className="gs-job-detail">
      <p className="gs-job-detail-company">{job.employers?.company_name}</p>
      <h1 className="gs-job-detail-title">{job.job_title}</h1>
      <p className="gs-job-detail-location">📍 {location}</p>

      <div className="gs-job-detail-badges">
        <span className="gs-job-detail-badge gs-badge-pay">{formatPay(job)}</span>
        {job.hours_per_week && <span className="gs-job-detail-badge gs-badge-hours">{job.hours_per_week} hrs/week</span>}
        {job.min_age && <span className="gs-job-detail-badge gs-badge-age">{job.min_age}+ years old</span>}
        {job.positions_count > 1 && <span className="gs-job-detail-badge gs-badge-positions">{job.positions_count} openings</span>}
      </div>

      <button className="gs-apply-btn" onClick={onApply}>
        {user ? "Apply Now ✨" : "Sign Up to Apply →"}
      </button>

      <hr className="gs-divider" />

      {job.job_desc && (
        <>
          <p className="gs-section-title">About this job</p>
          <p className="gs-section-body">{job.job_desc}</p>
          <hr className="gs-divider" />
        </>
      )}

      <p className="gs-section-title">Job details</p>
      <div className="gs-detail-grid">
        {catLabels.length > 0 && (
          <div className="gs-detail-field" style={{ gridColumn: "1 / -1" }}>
            <p className="gs-detail-field-label">Category</p>
            <p className="gs-detail-field-val">{catLabels.join("  ·  ")}</p>
          </div>
        )}
        {job.start_date && (
          <div className="gs-detail-field">
            <p className="gs-detail-field-label">Start Date</p>
            <p className="gs-detail-field-val">{formatDate(job.start_date)}</p>
          </div>
        )}
        {job.end_date && (
          <div className="gs-detail-field">
            <p className="gs-detail-field-label">End Date</p>
            <p className="gs-detail-field-val">{formatDate(job.end_date)}</p>
          </div>
        )}
      </div>

      {schedLabels.length > 0 && (
        <>
          <p className="gs-section-title">Schedule</p>
          <div className="gs-sched-tags">
            {schedLabels.map((l, i) => <span key={i} className="gs-sched-tag">{l}</span>)}
          </div>
          <div style={{ marginBottom: 20 }} />
        </>
      )}

      {(job.skills || job.dress_code || job.requirements) && (
        <>
          <hr className="gs-divider" />
          <p className="gs-section-title">Requirements</p>
          <div className="gs-detail-grid">
            {job.skills && (
              <div className="gs-detail-field" style={{ gridColumn: "1 / -1" }}>
                <p className="gs-detail-field-label">Skills / Certifications</p>
                <p className="gs-detail-field-val">{job.skills}</p>
              </div>
            )}
            {job.dress_code && (
              <div className="gs-detail-field" style={{ gridColumn: "1 / -1" }}>
                <p className="gs-detail-field-label">Dress Code</p>
                <p className="gs-detail-field-val">{job.dress_code}</p>
              </div>
            )}
          </div>
          {job.requirements && <p className="gs-section-body">{job.requirements}</p>}
        </>
      )}
    </div>
  );
}
