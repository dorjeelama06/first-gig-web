export default function StepBusinessInfo({ d, set }) {
  return (
    <div>
      <h2 className="gs-title">Tell us about your business</h2>
      <p className="gs-desc">This info appears on your job posting so applicants know who's hiring.</p>
      <div className="gs-field">
        <label className="gs-label">Company / Business Name *</label>
        <input className="gs-input" value={d.companyName}
          onChange={e => set("companyName", e.target.value)} placeholder="e.g. Audi of Springfield" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Contact Person *</label>
        <input className="gs-input" value={d.contactName}
          onChange={e => set("contactName", e.target.value)} placeholder="e.g. Maria Johnson" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Email *</label>
        <input type="email" className="gs-input" value={d.contactEmail}
          onChange={e => set("contactEmail", e.target.value)} placeholder="hiring@company.com" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Phone (optional)</label>
        <input type="tel" className="gs-input" value={d.contactPhone}
          onChange={e => set("contactPhone", e.target.value)} placeholder="(555) 123-4567" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Business Zip Code *</label>
        <input className="gs-input" value={d.companyZip}
          onChange={e => set("companyZip", e.target.value)} placeholder="10001" maxLength={10} />
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
