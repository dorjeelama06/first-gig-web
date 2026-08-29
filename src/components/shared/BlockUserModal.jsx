import { useState } from "react";

export default function BlockUserModal({ blockedName, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleConfirm = async () => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e?.message === "You've already blocked this user."
        ? e.message
        : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="block-user-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="block-user-modal">
        <div className="block-user-header">
          <h3>Block {blockedName}?</h3>
          <button className="block-user-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="block-user-sub">
          They won't be notified, and you won't see this conversation anymore.
        </p>

        {error && <p className="block-user-error">{error}</p>}

        <div className="block-user-actions">
          <button className="block-user-cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="block-user-confirm-btn" onClick={handleConfirm} disabled={loading}>
            {loading ? "Blocking…" : "🚫 Block"}
          </button>
        </div>
      </div>
    </div>
  );
}
