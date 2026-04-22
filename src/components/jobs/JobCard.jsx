import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS } from "../../constants/options";

function formatPay(job) {
  if (job.pay_type === "flat") return `$${job.pay_min} flat rate`;
  if (job.pay_type === "negotiable") return job.pay_min ? `From $${job.pay_min}/hr · Negotiable` : "Negotiable";
  if (job.pay_min && job.pay_max) return `$${job.pay_min}–$${job.pay_max}/hr`;
  if (job.pay_min) return `$${job.pay_min}/hr`;
  return "Pay not listed";
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

  return (
    <div className={`gs-job-card ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className="gs-job-card-header">
        <p className="gs-job-card-title">{job.job_title}</p>
        {isNew && <span className="gs-job-card-new">NEW</span>}
      </div>
      <p className="gs-job-card-company">{job.employers?.company_name}</p>
      <p className="gs-job-card-location">
        {job.is_remote ? "🏠 Remote" : `${job.job_city || ""}${job.job_state ? `, ${job.job_state}` : ""}`}
      </p>
      <p className="gs-job-card-pay">{formatPay(job)}</p>
      <div className="gs-job-card-tags">
        {catLabels.map((l, i) => <span key={i} className="gs-job-card-tag cat">{l}</span>)}
        {schedLabels.map((l, i) => <span key={i} className="gs-job-card-tag sched">{l}</span>)}
      </div>
    </div>
  );
}
