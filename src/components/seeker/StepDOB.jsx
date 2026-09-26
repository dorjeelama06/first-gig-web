import { MIN_SEEKER_AGE, todayIso } from "../../lib/validation";

export default function StepDOB({ v, set, age }) {
  const tooYoung = age !== null && age >= 0 && age < MIN_SEEKER_AGE;
  return (
    <div>
      <h2 className="gs-title">When were you born?</h2>
      <p className="gs-desc">Helps us match you with age-appropriate gigs.</p>
      <div className="gs-field">
        <label className="gs-label" htmlFor="seeker-dob">Date of Birth *</label>
        <input id="seeker-dob" type="date" className="gs-input" value={v} max={todayIso()}
          onChange={e => set(e.target.value)} />
      </div>
      {age !== null && age >= 0 && (
        <div className="gs-age">
          <span className="gs-age-num">{age}</span>
          <span className="gs-age-label">years old</span>
        </div>
      )}
      {tooYoung && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "rgba(255,107,107,0.12)",
          border: "1px solid rgba(255,107,107,0.35)",
          borderRadius: 12, color: "#ff8f8f",
          fontSize: 13, lineHeight: 1.5,
        }}>
          You need to be at least {MIN_SEEKER_AGE} to use First Gig.
        </div>
      )}
      {age !== null && age > 18 && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.35)",
          borderRadius: 12, color: "#FCD34D",
          fontSize: 13, lineHeight: 1.5,
        }}>
          ⚠️ First Gig is primarily designed for teens aged {MIN_SEEKER_AGE}–18. Opportunities may be limited outside this range.
        </div>
      )}
    </div>
  );
}
