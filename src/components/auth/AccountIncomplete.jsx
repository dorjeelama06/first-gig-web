/* Shown when a signed-in user has no profile role, or the role lookup failed. */
export default function AccountIncomplete({ failed, onRetry, onSignOut }) {
  return (
    <div>
      <h2 className="gs-title">
        {failed ? "Couldn't load your account" : "Account setup incomplete"}
      </h2>
      <p className="gs-desc">
        {failed
          ? "Check your connection and try again."
          : "We couldn't finish setting up your account. Try again, or sign out and contact support if this keeps happening."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <button className="gs-next submit" onClick={onRetry}>Try again</button>
        <button className="gs-back" style={{ textAlign: "center" }} onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}
