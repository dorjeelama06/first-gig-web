import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { CSS_STYLES } from "../../styles/styles";
import StepJobDetails from "../poster/StepJobDetails";
import StepJobRequirements from "../poster/StepJobRequirements";
import StepJobSchedulePay from "../poster/StepJobSchedulePay";
import StepJobLocation from "../poster/StepJobLocation";

const STEPS = ["jobDetails", "jobRequirements", "jobSchedulePay", "jobLocation"];

const STEP_TITLES = {
  jobDetails:      "Job Details",
  jobRequirements: "Requirements",
  jobSchedulePay:  "Schedule & Pay",
  jobLocation:     "Location",
};

const INITIAL = {
  jobTitle: "", jobDesc: "", jobCategory: [], customCategory: "", positionsCount: "1",
  minAge: "16", skills: "", dressCode: "", requirements: "",
  payType: "hourly", payMin: "", payMax: "", hoursPerWeek: "",
  schedule: [], startDate: "", endDate: "",
  jobAddress: "", jobCity: "", jobState: "", jobZip: "", isRemote: false,
};

// Map DB row (snake_case) → form state (camelCase)
function dbToForm(j) {
  return {
    jobTitle:      j.job_title      ?? "",
    jobDesc:       j.job_desc       ?? "",
    jobCategory:   j.job_category   ?? [],
    customCategory: "",
    positionsCount: String(j.positions_count ?? "1"),
    minAge:        String(j.min_age ?? "16"),
    skills:        j.skills         ?? "",
    dressCode:     j.dress_code     ?? "",
    requirements:  j.requirements   ?? "",
    payType:       j.pay_type       ?? "hourly",
    payMin:        j.pay_min != null ? String(j.pay_min) : "",
    payMax:        j.pay_max != null ? String(j.pay_max) : "",
    hoursPerWeek:  j.hours_per_week != null ? String(j.hours_per_week) : "",
    schedule:      j.schedule       ?? [],
    startDate:     j.start_date     ?? "",
    endDate:       j.end_date       ?? "",
    jobAddress:    j.job_address    ?? "",
    jobCity:       j.job_city       ?? "",
    jobState:      j.job_state      ?? "",
    jobZip:        j.job_zip        ?? "",
    isRemote:      j.is_remote      ?? false,
  };
}

// Map form state → DB payload (shared between insert and update)
function formToDb(job) {
  return {
    job_title:      job.jobTitle,
    job_desc:       job.jobDesc,
    job_category:   job.jobCategory,
    positions_count: parseInt(job.positionsCount) || 1,
    min_age:        job.minAge,
    skills:         job.skills,
    dress_code:     job.dressCode,
    requirements:   job.requirements,
    pay_type:       job.payType,
    pay_min:        parseFloat(job.payMin)      || null,
    pay_max:        parseFloat(job.payMax)      || null,
    hours_per_week: parseFloat(job.hoursPerWeek) || null,
    schedule:       job.schedule,
    start_date:     job.startDate || null,
    end_date:       job.endDate   || null,
    job_address:    job.jobAddress,
    job_city:       job.jobCity,
    job_state:      job.jobState,
    job_zip:        job.jobZip,
    is_remote:      job.isRemote,
  };
}

// jobId + initialData = edit mode; neither = create mode
export default function PostJobModal({ userId, jobId, initialData, onClose, onSuccess }) {
  const isEdit = !!jobId;
  const [step, setStep] = useState(0);
  const [job, setJob] = useState(initialData ? dbToForm(initialData) : INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const set = (field, value) => setJob(prev => ({ ...prev, [field]: value }));
  const toggle = (field, item) => setJob(prev => ({
    ...prev,
    [field]: prev[field].includes(item)
      ? prev[field].filter(i => i !== item)
      : [...prev[field], item],
  }));

  const addCustomCategory = () => {
    const val = job.customCategory.trim();
    if (val && !job.jobCategory.includes(val)) {
      set("jobCategory", [...job.jobCategory, val]);
      set("customCategory", "");
    }
  };

  const canProceed = () => {
    if (currentStep === "jobDetails") return job.jobTitle.trim().length > 0 && job.jobCategory.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!job.jobTitle.trim()) { setError("Job title is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload = formToDb(job);
      let err;
      if (isEdit) {
        ({ error: err } = await supabase.from("jobs").update(payload).eq("id", jobId));
      } else {
        ({ error: err } = await supabase.from("jobs").insert({ ...payload, employer_id: userId }));
      }
      if (err) throw err;
      onSuccess();
    } catch (e) {
      setError(e.message ?? "Failed to save job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{CSS_STYLES}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }} />

      {/* Modal panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(560px, 95vw)", maxHeight: "90vh",
        overflowY: "auto", background: "#fff",
        borderRadius: 20, zIndex: 401,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0", flexShrink: 0 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", margin: 0 }}>
              {isEdit ? "Edit Job Posting" : "Post a New Job"}
            </p>
            <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
              Step {step + 1} of {STEPS.length} — {STEP_TITLES[currentStep]}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "#f3f4f6", border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", fontSize: 15, color: "#555",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "14px 24px 0", flexShrink: 0 }}>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, #FF6B35, #FFB347)",
              width: `${progress}%`, transition: "width 0.35s ease",
            }} />
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          {currentStep === "jobDetails" && (
            <StepJobDetails d={job} set={set} toggle={id => toggle("jobCategory", id)} addCustom={addCustomCategory} />
          )}
          {currentStep === "jobRequirements" && <StepJobRequirements d={job} set={set} />}
          {currentStep === "jobSchedulePay" && (
            <StepJobSchedulePay d={job} set={set} toggle={id => toggle("schedule", id)} />
          )}
          {currentStep === "jobLocation" && <StepJobLocation d={job} set={set} />}
        </div>

        {/* Error */}
        {error && (
          <p style={{
            margin: "0 24px", padding: "8px 12px",
            background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)",
            borderRadius: 8, color: "#c0392b", fontSize: 13, flexShrink: 0,
          }}>{error}</p>
        )}

        {/* Navigation */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px 20px", borderTop: "1px solid #e5e7eb", flexShrink: 0, gap: 12,
        }}>
          <button
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            style={{
              padding: "10px 18px", background: "transparent",
              border: "1.5px solid #e5e7eb", borderRadius: 10,
              color: "#888", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          {isLast ? (
            <button onClick={handleSubmit} disabled={submitting} style={{
              padding: "11px 28px",
              background: submitting ? "#ccc" : "linear-gradient(135deg, #22C55E, #16A34A)",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>
              {submitting ? "Saving..." : isEdit ? "Save Changes ✓" : "Post Job ✨"}
            </button>
          ) : (
            <button onClick={() => canProceed() && setStep(s => s + 1)} style={{
              padding: "11px 24px",
              background: canProceed() ? "linear-gradient(135deg, #FF6B35, #FF8B5E)" : "#e5e7eb",
              border: "none", borderRadius: 10,
              color: canProceed() ? "#fff" : "#bbb",
              fontSize: 15, fontWeight: 700,
              cursor: canProceed() ? "pointer" : "not-allowed", fontFamily: "inherit",
            }}>
              Continue →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
