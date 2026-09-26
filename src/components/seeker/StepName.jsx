export default function StepName({ d, set }) {
  return (
    <div>
      <h2 className="gs-title">What's your name?</h2>
      <p className="gs-desc">We'll use this on your profile.</p>
      <div className="gs-field">
        <label className="gs-label">First Name *</label>
        <input className="gs-input" value={d.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g. Jordan" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Last Name</label>
        <input className="gs-input" value={d.lastName} onChange={e => set("lastName", e.target.value)} placeholder="e.g. Smith" />
      </div>
    </div>
  );
}
