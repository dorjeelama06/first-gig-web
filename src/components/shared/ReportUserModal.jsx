import { useState } from "react";

const REASONS = [
  { id: "harassment",    label: "Harassment or bullying",   icon: "🚨" },
  { id: "scam",          label: "Scam or fraud",             icon: "💰" },
  { id: "inappropriate", label: "Inappropriate behavior",    icon: "⚠️" },
  { id: "spam",          label: "Spam",                      icon: "📢" },
  { id: "other",         label: "Other",                     icon: "💬" },
];

export default function ReportUserModal({ reportedName, onClose, onSubmit }) {
  const [reason, setReason]   = useState(null);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!reason || loading) return;
    setError("");
    setLoading(true);
    try {
      await onSubmit(reason, details);
      setDone(true);
    } catch (e) {
      setError(e?.message === "You've already reported this user."
        ? e.message
        : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-user-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="report-user-modal">
        {done ? (
          <div className="report-user-done">
            <span className="report-user-done-icon">✅</span>
            <h3>Report submitted</h3>
            <p>Thanks for the report — we'll review it within 24 hours. The other person won't be notified.</p>
            <button className="report-user-submit-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="report-user-header">
              <h3>Report {reportedName}</h3>
              <button className="report-user-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <p className="report-user-sub">What's wrong?</p>

            <div className="report-user-reasons">
              {REASONS.map(r => (
                <button
                  key={r.id}
                  className={`report-user-reason${reason === r.id ? " selected" : ""}`}
                  onClick={() => setReason(r.id)}
                >
                  <span className="report-user-reason-icon">{r.icon}</span>
                  <span className="report-user-reason-label">{r.label}</span>
                  {reason === r.id && <span className="report-user-reason-check">✓</span>}
                </button>
              ))}
            </div>

            {reason && (
              <textarea
                className="report-user-details"
                placeholder="Add details (optional)"
                value={details}
                onChange={e => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
              />
            )}

            {error && <p className="report-user-error">{error}</p>}

            <button
              className="report-user-submit-btn"
              onClick={handleSubmit}
              disabled={!reason || loading}
            >
              {loading ? "Submitting…" : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
