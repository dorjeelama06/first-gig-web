import { CATEGORY_OPTIONS, AVAILABILITY_OPTIONS } from "../../constants/options";
import { Rev, RevTags } from "../shared/Rev";

export default function PosterReview({ d }) {
  const catLabels = d.jobCategory.map(id => {
    const f = CATEGORY_OPTIONS.find(o => o.id === id);
    return f ? `${f.icon} ${f.label}` : `✨ ${id}`;
  });
  const schedLabels = d.schedule.map(id => {
    const f = AVAILABILITY_OPTIONS.find(o => o.id === id);
    return f ? f.label : id;
  });
  const payLabel = d.payType === "flat"
    ? `$${d.payMin} flat`
    : d.payType === "negotiable"
      ? `Negotiable${d.payMin ? ` (from $${d.payMin}/hr)` : ""}`
      : `$${d.payMin}${d.payMax ? `–$${d.payMax}` : ""}/hr`;

  return (
    <div>
      <h2 className="gs-title">Review your job posting</h2>
      <p className="gs-desc">Make sure everything looks good before posting.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Rev label="Company" val={d.companyName} />
        <Rev label="Job Title" val={d.jobTitle} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Rev label="Contact" val={<>{d.contactName}<br />{d.contactEmail}{d.contactPhone && ` · ${d.contactPhone}`}</>} />
        </div>
        {d.jobDesc && <div style={{ gridColumn: "1 / -1" }}><Rev label="Description" val={d.jobDesc} /></div>}
        <div style={{ gridColumn: "1 / -1" }}>
          <RevTags label="Category" tags={catLabels} />
        </div>
        <Rev label="Positions" val={d.positionsCount} />
        <Rev label="Min Age" val={`${d.minAge}+`} />
        {d.skills && <div style={{ gridColumn: "1 / -1" }}><Rev label="Skills" val={d.skills} /></div>}
        {d.dressCode && <Rev label="Dress Code" val={d.dressCode} />}
        {d.requirements && <div style={{ gridColumn: "1 / -1" }}><Rev label="Other" val={d.requirements} /></div>}
        <Rev label="Pay" val={payLabel} />
        {d.hoursPerWeek && <Rev label="Hours/Week" val={d.hoursPerWeek} />}
        <div style={{ gridColumn: "1 / -1" }}>
          <RevTags label="Schedule" tags={schedLabels} />
        </div>
        {d.startDate && <Rev label="Start Date" val={d.startDate} />}
        {d.endDate && <Rev label="End Date" val={d.endDate} />}
        <div style={{ gridColumn: "1 / -1" }}>
          <Rev label="Location" val={d.isRemote ? "🏠 Remote"
            : <>{d.jobAddress && `${d.jobAddress}, `}{d.jobCity && `${d.jobCity}, `}{d.jobState} {d.jobZip}</>} />
        </div>
      </div>
    </div>
  );
}
