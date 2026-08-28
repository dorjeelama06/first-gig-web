import { useState } from "react";

const REASONS = [
  { id: "scam",          label: "Scam or fraud",            icon: "🚨" },
  { id: "misleading",    label: "Misleading or inaccurate", icon: "❌" },
  { id: "inappropriate", label: "Inappropriate content",    icon: "⚠️" },
  { id: "illegal",       label: "Illegal activity",         icon: "🚫" },
  { id: "spam",          label: "Spam",                     icon: "📢" },
  { id: "other",         label: "Other",                    icon: "💬" },
];

export default function ReportModal({ onClose, onSubmit }) {
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
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="report-modal">
        {done ? (
          <div className="report-done">
            <span className="report-done-icon">✅</span>
            <h3>Report submitted</h3>
            <p>Thanks for keeping First Gig safe. We'll review this posting within 24 hours.</p>
            <button className="report-submit-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="report-header">
              <h3>Report this job</h3>
              <button className="report-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <p className="report-sub">What's wrong with this posting?</p>

            <div className="report-reasons">
              {REASONS.map(r => (
                <button
                  key={r.id}
                  className={`report-reason${reason === r.id ? " selected" : ""}`}
                  onClick={() => setReason(r.id)}
                >
                  <span className="report-reason-icon">{r.icon}</span>
                  <span className="report-reason-label">{r.label}</span>
                  {reason === r.id && <span className="report-reason-check">✓</span>}
                </button>
              ))}
            </div>

            {reason && (
              <textarea
                className="report-details"
                placeholder="Add details (optional)"
                value={details}
                onChange={e => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
              />
            )}

            {error && <p className="report-error">{error}</p>}

            <button
              className="report-submit-btn"
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
