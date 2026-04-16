import { AVAILABILITY_OPTIONS } from "../../constants/options";

export default function StepJobSchedulePay({ d, set, toggle }) {
  return (
    <div>
      <h2 className="gs-title">Schedule & Pay</h2>
      <p className="gs-desc">When do you need help and what does it pay?</p>
      <div className="gs-field">
        <label className="gs-label">Pay Type</label>
        <div className="gs-chips">
          {[
            { id: "hourly", label: "Hourly" },
            { id: "flat", label: "Flat Rate" },
            { id: "negotiable", label: "Negotiable" },
          ].map(o => (
            <button key={o.id} className={`gs-chip ${d.payType === o.id ? "active" : ""}`}
              onClick={() => set("payType", o.id)}>{o.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="gs-field" style={{ flex: 1 }}>
          <label className="gs-label">{d.payType === "flat" ? "Amount ($) *" : "Min ($/hr) *"}</label>
          <input type="number" className="gs-input" value={d.payMin}
            onChange={e => set("payMin", e.target.value)} placeholder={d.payType === "flat" ? "150" : "15"} />
        </div>
        {d.payType !== "flat" && (
          <div className="gs-field" style={{ flex: 1 }}>
            <label className="gs-label">Max ($/hr)</label>
            <input type="number" className="gs-input" value={d.payMax}
              onChange={e => set("payMax", e.target.value)} placeholder="20" />
          </div>
        )}
      </div>
      <div className="gs-field">
        <label className="gs-label">Hours Per Week</label>
        <input type="number" className="gs-input" value={d.hoursPerWeek}
          onChange={e => set("hoursPerWeek", e.target.value)} placeholder="e.g. 15" />
      </div>
      <div className="gs-field">
        <label className="gs-label">Schedule * (select all that apply)</label>
        <div className="gs-opts" style={{ marginTop: 6 }}>
          {AVAILABILITY_OPTIONS.map(o => (
            <button key={o.id} className={`gs-avail ${d.schedule.includes(o.id) ? "active" : ""}`}
              onClick={() => toggle(o.id)}>
              <span className={`gs-check ${d.schedule.includes(o.id) ? "active" : ""}`}>
                {d.schedule.includes(o.id) ? "✓" : ""}
              </span>
              <span className="gs-avail-icon">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="gs-field" style={{ flex: 1 }}>
          <label className="gs-label">Start Date</label>
          <input type="date" className="gs-input" value={d.startDate}
            onChange={e => set("startDate", e.target.value)} />
        </div>
        <div className="gs-field" style={{ flex: 1 }}>
          <label className="gs-label">End Date</label>
          <input type="date" className="gs-input" value={d.endDate}
            onChange={e => set("endDate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
