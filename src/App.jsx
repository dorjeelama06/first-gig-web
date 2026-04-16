import { useState } from "react";
import { CSS_STYLES } from "./styles/styles";
import { SEEKER_STEPS, POSTER_STEPS } from "./constants/steps";

import StepRole from "./components/shared/StepRole";

import StepName from "./components/seeker/StepName";
import StepDOB from "./components/seeker/StepDOB";
import StepGender from "./components/seeker/StepGender";
import StepInterests from "./components/seeker/StepInterests";
import StepExperience from "./components/seeker/StepExperience";
import StepAvailability from "./components/seeker/StepAvailability";
import StepDistance from "./components/seeker/StepDistance";
import StepContact from "./components/seeker/StepContact";
import SeekerReview from "./components/seeker/SeekerReview";

import StepBusinessInfo from "./components/poster/StepBusinessInfo";
import StepJobDetails from "./components/poster/StepJobDetails";
import StepJobRequirements from "./components/poster/StepJobRequirements";
import StepJobSchedulePay from "./components/poster/StepJobSchedulePay";
import StepJobLocation from "./components/poster/StepJobLocation";
import PosterReview from "./components/poster/PosterReview";

export default function App() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState(1);

  /* ─── Seeker data ─── */
  const [seeker, setSeeker] = useState({
    firstName: "", lastName: "", dob: "", gender: "",
    genderCustom: "", interests: [], customInterest: "",
    experiences: [], availability: [], distance: "",
    email: "", phone: "", zipCode: "", contactPreference: "",
  });

  /* ─── Poster data ─── */
  const [poster, setPoster] = useState({
    companyName: "", contactName: "", contactEmail: "",
    contactPhone: "", companyZip: "",
    jobTitle: "", jobDesc: "", jobCategory: [], customCategory: "", positionsCount: "1",
    minAge: "16", skills: "", dressCode: "", requirements: "",
    payType: "hourly", payMin: "", payMax: "", hoursPerWeek: "",
    schedule: [], startDate: "", endDate: "",
    jobAddress: "", jobCity: "", jobState: "", jobZip: "", isRemote: false,
  });

  const [role, setRole] = useState("");

  const steps = role === "poster" ? POSTER_STEPS : SEEKER_STEPS;
  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const go = (d) => {
    const next = step + d;
    if (next < 0 || next >= steps.length || animating) return;
    setDir(d);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 250);
  };

  /* ─── Seeker helpers ─── */
  const uS = (f, v) => setSeeker(p => ({ ...p, [f]: v }));
  const toggleSeekerArr = (f, item) => setSeeker(p => ({
    ...p, [f]: p[f].includes(item) ? p[f].filter(i => i !== item) : [...p[f], item],
  }));
  const addExp = () => uS("experiences", [...seeker.experiences, { title: "", desc: "", dur: "" }]);
  const updateExp = (i, f, v) => {
    const e = [...seeker.experiences]; e[i] = { ...e[i], [f]: v };
    uS("experiences", e);
  };
  const removeExp = (i) => uS("experiences", seeker.experiences.filter((_, j) => j !== i));
  const addCustomInterest = () => {
    const val = seeker.customInterest.trim();
    if (val && !seeker.interests.includes(val)) {
      uS("interests", [...seeker.interests, val]);
      uS("customInterest", "");
    }
  };

  /* ─── Poster helpers ─── */
  const uP = (f, v) => setPoster(p => ({ ...p, [f]: v }));
  const togglePosterArr = (f, item) => setPoster(p => ({
    ...p, [f]: p[f].includes(item) ? p[f].filter(i => i !== item) : [...p[f], item],
  }));
  const addCustomCategory = () => {
    const val = poster.customCategory.trim();
    if (val && !poster.jobCategory.includes(val)) {
      uP("jobCategory", [...poster.jobCategory, val]);
      uP("customCategory", "");
    }
  };

  const age = (() => {
    if (!seeker.dob) return null;
    const t = new Date(), b = new Date(seeker.dob);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  })();

  const selectRole = (r) => {
    setRole(r);
    // Stay on step 0 (role screen), next click advances to step 1
  };

  const canProceed = () => {
    switch (currentStep) {
      case "role": return !!role;
      // All other steps return true for demo purposes
      // case "name": return seeker.firstName.trim() && seeker.lastName.trim();
      // case "dob": return !!seeker.dob;
      // case "gender": return !!seeker.gender && (seeker.gender !== "custom" || seeker.genderCustom.trim());
      // case "interests": return seeker.interests.length > 0;
      // case "availability": return seeker.availability.length > 0;
      // case "distance": return !!seeker.distance;
      // case "contact": return seeker.email.trim() && seeker.zipCode.trim();
      // case "businessInfo": return poster.companyName.trim() && poster.contactName.trim() && poster.contactEmail.trim() && poster.companyZip.trim();
      // case "jobDetails": return poster.jobTitle.trim() && poster.jobCategory.length > 0;
      // case "jobSchedulePay": return poster.payMin.trim() && poster.schedule.length > 0;
      // case "jobLocation": return poster.jobZip.trim() || poster.isRemote;
      default: return true;
    }
  };

  const handleSubmit = () => {
    if (role === "poster") {
      alert("Job posted successfully! 🎉\n\nIn a real app this would be saved to a database and shown to job seekers.");
      console.log("Poster data:", poster);
    } else {
      alert("Profile submitted! 🎉\n\nIn a real app this data would be sent to a backend server.");
      console.log("Seeker data:", seeker);
    }
  };

  const tagline = role === "poster" ? "Find young talent nearby" : "Find gigs. Build skills. Earn money.";

  return (
    <>
      <style>{CSS_STYLES}</style>
      <div className="gs-wrap">
        <div className="gs-orb gs-orb1" />
        <div className="gs-orb gs-orb2" />
        <div className="gs-card">
          {/* Header */}
          <div className="gs-header">
            <div className="gs-logo-row">
              <span className="gs-logo-icon">⚡</span>
              <span className="gs-logo-text">GigSpark</span>
            </div>
            <p className="gs-tagline">{tagline}</p>
          </div>

          {/* Progress */}
          <div className="gs-progress">
            <div className="gs-pbar">
              <div className="gs-pfill" style={{ width: `${progress}%` }} />
            </div>
            <span className="gs-ptext">{step + 1}/{steps.length}</span>
          </div>

          {/* Step Content */}
          <div className={`gs-step ${animating ? "out" : "in"}`}
            style={animating ? { transform: `translateX(${dir * 30}px)` } : {}}>

            {/* Shared */}
            {currentStep === "role" && <StepRole v={role} set={selectRole} />}

            {/* Seeker flow */}
            {currentStep === "name" && <StepName d={seeker} set={uS} />}
            {currentStep === "dob" && <StepDOB v={seeker.dob} set={v => uS("dob", v)} age={age} />}
            {currentStep === "gender" && <StepGender d={seeker} set={uS} />}
            {currentStep === "interests" && (
              <StepInterests d={seeker} toggle={id => toggleSeekerArr("interests", id)}
                set={uS} addCustom={addCustomInterest} />
            )}
            {currentStep === "experience" && (
              <StepExperience exps={seeker.experiences} add={addExp} upd={updateExp} rm={removeExp} />
            )}
            {currentStep === "availability" && (
              <StepAvailability sel={seeker.availability} toggle={id => toggleSeekerArr("availability", id)} />
            )}
            {currentStep === "distance" && <StepDistance v={seeker.distance} set={v => uS("distance", v)} />}
            {currentStep === "contact" && <StepContact d={seeker} set={uS} />}
            {currentStep === "seekerReview" && <SeekerReview d={seeker} age={age} />}

            {/* Poster flow */}
            {currentStep === "businessInfo" && <StepBusinessInfo d={poster} set={uP} />}
            {currentStep === "jobDetails" && (
              <StepJobDetails d={poster} set={uP}
                toggle={id => togglePosterArr("jobCategory", id)}
                addCustom={addCustomCategory} />
            )}
            {currentStep === "jobRequirements" && <StepJobRequirements d={poster} set={uP} />}
            {currentStep === "jobSchedulePay" && (
              <StepJobSchedulePay d={poster} set={uP}
                toggle={id => togglePosterArr("schedule", id)} />
            )}
            {currentStep === "jobLocation" && <StepJobLocation d={poster} set={uP} />}
            {currentStep === "posterReview" && <PosterReview d={poster} />}
          </div>

          {/* Nav */}
          <div className="gs-nav">
            {step > 0 ? (
              <button className="gs-back" onClick={() => go(-1)}>← Back</button>
            ) : <div />}
            {(currentStep === "seekerReview" || currentStep === "posterReview") ? (
              <button className="gs-next submit" onClick={handleSubmit}>
                {role === "poster" ? "Post Job ✨" : "Submit ✨"}
              </button>
            ) : (
              <button className={`gs-next ${canProceed() ? "" : "disabled"}`}
                onClick={canProceed() ? () => go(1) : undefined}>Continue →</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
