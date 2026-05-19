import { Rev } from "../shared/Rev";

export default function PosterReview({ d }) {
  return (
    <div>
      <h2 className="gs-title">Review your account</h2>
      <p className="gs-desc">Make sure everything looks good before creating your account.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Rev label="Company" val={d.companyName} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Rev
            label="Contact"
            val={
              <>
                {d.contactName}
                <br />
                {d.contactEmail}
                {d.contactPhone && ` · ${d.contactPhone}`}
              </>
            }
          />
        </div>
        {d.companyZip && <Rev label="Zip Code" val={d.companyZip} />}
      </div>
      <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        You can post your first job from your dashboard after signing up.
      </p>
    </div>
  );
}
