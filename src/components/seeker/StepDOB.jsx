export default function StepDOB({ v, set, age }) {
  return (
    <div>
      <h2 className="gs-title">When were you born?</h2>
      <p className="gs-desc">Helps us match you with age-appropriate gigs.</p>
      <div className="gs-field">
        <label className="gs-label">Date of Birth</label>
        <input type="date" className="gs-input" value={v} onChange={e => set(e.target.value)} />
      </div>
      {age !== null && (
        <div className="gs-age">
          <span className="gs-age-num">{age}</span>
          <span className="gs-age-label">years old</span>
        </div>
      )}
      {age !== null && (age < 14 || age > 18) && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.35)",
          borderRadius: 12, color: "#FCD34D",
          fontSize: 13, lineHeight: 1.5,
        }}>
          ⚠️ First Gig is primarily designed for teens aged 14–18. Opportunities may be limited outside this range.
        </div>
      )}
    </div>
  );
}
