export default function StepContact({ d, set }) {
  return (
    <div>
      <h2 className="gs-title">How can we reach you?</h2>
      <p className="gs-desc">We'll never spam you — promise.</p>
      <div className="gs-field">
        <label className="gs-label">Preferred Contact Method</label>
        <select className="gs-input" value={d.contactPreference}
          onChange={e => set("contactPreference", e.target.value)}
          style={{ appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}>
          <option value="" style={{ background: "#1A1A2E" }}>Select a method...</option>
          <option value="email" style={{ background: "#1A1A2E" }}>Email</option>
          <option value="phone" style={{ background: "#1A1A2E" }}>Phone/Text</option>
          <option value="either" style={{ background: "#1A1A2E" }}>Either</option>
        </select>
      </div>
      <div className="gs-field">
        <label className="gs-label">Email *</label>
        <input type="email" className="gs-input" value={d.email}
          onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Phone (optional)</label>
        <input type="tel" className="gs-input" value={d.phone}
          onChange={e => set("phone", e.target.value)} placeholder="(555) 123-4567" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Zip Code *</label>
        <input className="gs-input" value={d.zipCode}
          onChange={e => set("zipCode", e.target.value)} placeholder="10001" maxLength={10} />
      </div>
      <div className="gs-field">
        <label className="gs-label">Parent / Guardian Email *</label>
        <input type="email" className="gs-input" value={d.parentEmail}
          onChange={e => set("parentEmail", e.target.value)} placeholder="parent@email.com" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Create Password *</label>
        <input type="password" className="gs-input" value={d.password}
          onChange={e => set("password", e.target.value)} placeholder="Min. 6 characters" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Confirm Password *</label>
        <input type="password" className="gs-input" value={d.confirmPassword}
          onChange={e => set("confirmPassword", e.target.value)} placeholder="Re-enter password" />
      </div>
    </div>
  );
}
