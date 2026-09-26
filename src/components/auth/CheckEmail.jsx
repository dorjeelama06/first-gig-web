import { useState } from "react";
import { resendConfirmation } from "../../lib/auth";

export default function CheckEmail({ email, onSignIn }) {
  const [status, setStatus] = useState(""); // "" | "sending" | "sent" | error message

  const handleResend = async () => {
    setStatus("sending");
    try {
      await resendConfirmation(email);
      setStatus("sent");
    } catch (e) {
      setStatus(e.message ?? "Couldn't resend the email. Please try again.");
    }
  };

  const isError = status && status !== "sending" && status !== "sent";

  return (
    <div>
      <h2 className="gs-title">Check your email 📬</h2>
      <p className="gs-desc">
        We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account, then sign in.
      </p>
      <p className="gs-desc" style={{ fontSize: 13 }}>
        Can't find it? Check your spam folder.
      </p>
      {status === "sent" && (
        <p style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>Sent again — check your inbox.</p>
      )}
      {isError && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>{status}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <button className="gs-next submit" onClick={onSignIn}>Go to sign in →</button>
        <button className="gs-back" style={{ textAlign: "center" }}
          onClick={status === "sending" ? undefined : handleResend}>
          {status === "sending" ? "Sending..." : "Resend email"}
        </button>
      </div>
    </div>
  );
}
