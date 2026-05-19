import { useState, useEffect, useRef } from "react";
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from "../../lib/chat";

export default function ChatWindow({ conversation, userId, role, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    setLoading(true);
    setMessages([]);

    fetchMessages(conversation.id).then(msgs => {
      setMessages(msgs);
      setLoading(false);
      markMessagesAsRead(conversation.id, userId);
    });

    const unsubscribe = subscribeToMessages(conversation.id, newMsg => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !conversation || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMessage(conversation.id, userId, content);
    } catch (e) {
      console.error("Send failed:", e);
      setInput(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  if (!conversation) return (
    <div className="dash-no-chat">
      <span style={{ fontSize: 44 }}>💬</span>
      <p style={{ fontWeight: 600, color: "#bbb", margin: 0 }}>Select a conversation to start chatting</p>
    </div>
  );

  const otherName = role === "seeker"
    ? conversation.employers?.company_name
    : conversation.seekers ? `${conversation.seekers.first_name} ${conversation.seekers.last_name}` : "Applicant";

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDay = (ts) =>
    new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className="dash-chat-panel">
      <div className="dash-chat-header">
        {onBack && (
          <button className="dash-chat-back" onClick={onBack} aria-label="Back">‹</button>
        )}
        <div className="dash-chat-avatar">{otherName?.[0] ?? "?"}</div>
        <div>
          <p className="dash-chat-hname">{otherName}</p>
          <p className="dash-chat-hsub">Re: {conversation.jobs?.job_title}</p>
        </div>
      </div>

      <div className="dash-chat-messages">
        {loading ? (
          <p style={{ color: "#bbb", textAlign: "center", fontSize: 13, margin: "auto" }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: "#bbb", textAlign: "center", fontSize: 13, margin: "auto" }}>
            No messages yet — say hello! 👋
          </p>
        ) : (
          messages.map((m, i) => {
            const showDay = i === 0 || formatDay(messages[i - 1].created_at) !== formatDay(m.created_at);
            const isMine = m.sender_id === userId;
            return (
              <div key={m.id} className="dash-msg-wrapper">
                {showDay && <div className="dash-date-divider">{formatDay(m.created_at)}</div>}
                <div className={`dash-msg ${isMine ? "sent" : "received"}`}>
                  <div className="dash-msg-bubble">{m.content}</div>
                  <span className="dash-msg-time">{formatTime(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="dash-chat-input-row">
        <textarea
          className="dash-chat-input"
          rows={1}
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button className="dash-send-btn" onClick={handleSend} disabled={sending}>➤</button>
      </div>
    </div>
  );
}
