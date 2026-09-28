import { useState } from "react";
import { confirmParentVerification } from "../../lib/parentVerification";

/* Landing page for the link in the parent approval email. Approval needs a
   button press (POST), so email link scanners can't approve by opening the link. */
export default function ParentConfirm({ token, onDone }) {
  const [status, setStatus] = useState("idle"); // idle | sending | approved | error
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setStatus("sending");
    setError("");
    try {
      const result = await confirmParentVerification(token);
      setFirstName(result?.firstName ?? "");
      setStatus("approved");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  if (status === "approved") return (
    <div>
      <h2 className="gs-title">Thanks, you're all set ✅</h2>
      <p className="gs-desc">
        {firstName ? `${firstName} can` : "They can"} now apply for jobs and message employers on First Gig.
      </p>
      <button className="gs-next submit" style={{ marginTop: 16 }} onClick={onDone}>Go to First Gig →</button>
    </div>
  );

  return (
    <div>
      <h2 className="gs-title">Parent / guardian approval</h2>
      <p className="gs-desc">
        Your child listed you as their parent or guardian on First Gig, which helps teens find local part-time jobs.
        Until you approve, they can browse jobs but can't apply or message employers.
      </p>
      <p className="gs-desc" style={{ fontSize: 13 }}>
        If you don't know who this is, you can close this page. Nothing will be approved.
      </p>
      {status === "error" && (
        <p role="alert" style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <button className="gs-next submit" onClick={handleApprove} disabled={status === "sending"}>
          {status === "sending" ? "Approving..." : "Approve"}
        </button>
        <button className="gs-back" style={{ textAlign: "center" }} onClick={onDone}>Not now</button>
      </div>
    </div>
  );
}
