import { useState, useEffect } from "react";
import { fetchConversations, subscribeToConversationUpdates, getLastMessage } from "../../lib/chat";

export default function ConversationList({ userId, role, activeId, onSelect, initialConvoId }) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchConversations(userId, role);
      setConvos(data);
      setLoading(false);

      // Auto-open initial conversation if provided
      if (initialConvoId) {
        const target = data.find(c => c.id === initialConvoId);
        if (target) onSelect(target);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = subscribeToConversationUpdates(userId, load, "list");
    return unsubscribe;
  }, [userId]);

  const getOtherName = (c) => {
    if (role === "seeker") return c.employers?.company_name ?? "Employer";
    if (!c.seekers) return "Applicant";
    const fullName = `${c.seekers.first_name ?? ""} ${c.seekers.last_name ?? ""}`.trim();
    return fullName || c.seekers.email || "Applicant";
  };

  const hasUnread = (c) => {
    const last = getLastMessage(c.messages);
    return last && last.sender_id !== userId && !last.read;
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div style={{ padding: 20, color: "#bbb", fontSize: 13, textAlign: "center" }}>
      Loading conversations...
    </div>
  );

  if (convos.length === 0) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <p style={{ fontSize: 36, margin: "0 0 10px" }}>💬</p>
      <p style={{ color: "#bbb", fontSize: 13, margin: 0, fontWeight: 600 }}>No conversations yet</p>
      <p style={{ color: "#ccc", fontSize: 12, margin: "6px 0 0" }}>
        {role === "seeker"
          ? "Apply to jobs — employers will reach out to you here"
          : "Message an applicant from the Applicants tab to start a conversation"}
      </p>
    </div>
  );

  return (
    <>
      {convos.map(c => {
        const last = getLastMessage(c.messages);
        const unread = hasUnread(c);
        return (
          <div
            key={c.id}
            className={`dash-convo-item ${activeId === c.id ? "active" : ""}`}
            onClick={() => onSelect(c)}
          >
            <div className="dash-convo-row">
              <span className="dash-convo-name">{getOtherName(c)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {last && <span className="dash-convo-time">{formatTime(last.created_at)}</span>}
                {unread && <span className="dash-unread-dot" />}
              </div>
            </div>
            <p className="dash-convo-job">{c.jobs?.job_title}</p>
            <p className="dash-convo-preview">
              {last ? last.content : "No messages yet"}
            </p>
          </div>
        );
      })}
    </>
  );
}
