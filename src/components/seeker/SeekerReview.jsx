import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS, DISTANCE_OPTIONS } from "../../constants/options";
import { Rev, RevTags } from "../shared/Rev";

export default function SeekerReview({ d, age, termsAgreed, setTermsAgreed, onShowTerms, onShowPrivacy }) {
  const gLabel = d.gender === "custom" ? d.genderCustom : d.gender === "prefer_not" ? "Prefer not to say"
    : d.gender ? d.gender.charAt(0).toUpperCase() + d.gender.slice(1) : "";
  const iLabels = d.interests.map(id => {
    const f = CATEGORY_OPTIONS.find(o => o.id === id);
    return f ? `${f.icon} ${f.label}` : `✨ ${id}`;
  });
  const aLabels = d.availability.map(id => {
    const f = AVAILABILITY_OPTIONS.find(o => o.id === id);
    return f ? f.label : id;
  });
  const dist = DISTANCE_OPTIONS.find(o => o.id === d.distance);

  return (
    <div>
      <h2 className="gs-title">Review your profile</h2>
      <p className="gs-desc">Make sure everything looks good.</p>
      <Rev label="Role" val="🔍 Job Seeker" />
      <Rev label="Name" val={`${d.firstName} ${d.lastName}`} />
      <Rev label="Age" val={`${age} years old`} />
      <Rev label="Gender" val={gLabel} />
      <RevTags label="Interests" tags={iLabels} />
      {d.experiences.length > 0 && (
        <div className="gs-rev">
          <div className="gs-rev-label">Experience</div>
          <div className="gs-rev-val">
            {d.experiences.map((e, i) => (
              <div key={i}><strong>{e.title}</strong>{e.dur && ` · ${e.dur}`}</div>
            ))}
          </div>
        </div>
      )}
      <RevTags label="Availability" tags={aLabels} />
      <Rev label="Distance" val={dist ? `${dist.icon} ${dist.label} — ${dist.desc}` : ""} />
      <Rev label="Contact" val={<>{d.email}{d.phone && ` · ${d.phone}`}<br />Zip: {d.zipCode}</>} />
      {d.contactPreference && (
        <Rev label="Preferred Contact" val={
          d.contactPreference === "email" ? "Email"
          : d.contactPreference === "phone" ? "Phone/Text"
          : "Either"
        } />
      )}
      {d.parentEmail && <Rev label="Parent / Guardian Email" val={d.parentEmail} />}

      <div className="gs-tos-wrap">
        <label className="gs-tos-label">
          <input
            type="checkbox"
            className="gs-tos-check"
            checked={termsAgreed}
            onChange={e => setTermsAgreed(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <button type="button" className="gs-tos-link" onClick={onShowTerms}>Terms of Service</button>
            {" "}and{" "}
            <button type="button" className="gs-tos-link" onClick={onShowPrivacy}>Privacy Policy</button>
          </span>
        </label>
      </div>
    </div>
  );
}
