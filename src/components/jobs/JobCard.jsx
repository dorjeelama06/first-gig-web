import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS } from "../../constants/options";

function formatPay(job) {
  if (job.pay_type === "flat") return `$${job.pay_min} flat rate`;
  if (job.pay_type === "negotiable") return job.pay_min ? `From $${job.pay_min}/hr · Negotiable` : "Negotiable";
  if (job.pay_min && job.pay_max) return `$${job.pay_min}–$${job.pay_max}/hr`;
  if (job.pay_min) return `$${job.pay_min}/hr`;
  return "Pay not listed";
}

function companyInitial(name) {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
}

export default function JobCard({ job, isActive, onClick }) {
  const catLabels = (job.job_category || []).slice(0, 2).map(id => {
    const f = CATEGORY_OPTIONS.find(o => o.id === id);
    return f ? `${f.icon} ${f.label}` : id;
  });

  const schedLabels = (job.schedule || []).slice(0, 2).map(id => {
    const f = AVAILABILITY_OPTIONS.find(o => o.id === id);
    return f ? f.label : id;
  });

  const daysAgo = job.created_at
    ? Math.floor((Date.now() - new Date(job.created_at)) / (1000 * 60 * 60 * 24))
    : null;
  const isNew = daysAgo !== null && daysAgo <= 3;

  const companyName = job.employers?.company_name;

  return (
    <div className={`gs-job-card ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="gs-job-card-header">
        {/* Company avatar circle */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          flex: 1,
          minWidth: 0,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "linear-gradient(135deg, #FF6B35, #FFB347)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
          }}>
            {companyInitial(companyName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="gs-job-card-title">{job.job_title}</p>
            <p className="gs-job-card-company">{companyName}</p>
          </div>
        </div>
        {isNew && <span className="gs-job-card-new">NEW</span>}
      </div>

      <p className="gs-job-card-location" style={{ marginLeft: 46 }}>
        {job.is_remote ? "🏠 Remote" : `${job.job_city || ""}${job.job_state ? `, ${job.job_state}` : ""}`}
      </p>

      {/* Pay: bold and slightly larger for visibility */}
      <p className="gs-job-card-pay" style={{
        marginLeft: 46,
        fontSize: 14,
        fontWeight: 700,
        color: "#1a1a2e",
      }}>
        {formatPay(job)}
      </p>

      <div className="gs-job-card-tags" style={{ marginLeft: 46 }}>
        {catLabels.map((l, i) => <span key={i} className="gs-job-card-tag cat">{l}</span>)}
        {schedLabels.map((l, i) => <span key={i} className="gs-job-card-tag sched">{l}</span>)}
      </div>
    </div>
  );
}
