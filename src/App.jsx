import { useState, useEffect } from "react";
import { CSS_STYLES } from "./styles/styles";
import { SEEKER_STEPS, POSTER_STEPS } from "./constants/steps";
import { supabase } from "./lib/supabase";

import HomePage from "./pages/HomePage";
import LoginForm from "./components/auth/LoginForm";
import SeekerDashboard from "./pages/SeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";

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
import PosterReview from "./components/poster/PosterReview";

export default function App() {
  // 'loading' | 'home' | 'login' | 'onboarding' | 'dashboard'
  const [authView, setAuthView] = useState("loading");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Returns the role string so callers can use it immediately
  const fetchRole = async (userId) => {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    const role = data?.role ?? null;
    if (role) setUserRole(role);
    return role;
  };

  /* ─── Session check on mount ─── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const role = await fetchRole(session.user.id);
        // If already logged in with a known role, go straight to dashboard
        if (role) { setAuthView("dashboard"); return; }
      }
      setAuthView("home");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ─── Onboarding nav state ─── */
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState("");

  /* ─── Seeker data ─── */
  const [seeker, setSeeker] = useState({
    firstName: "", lastName: "", dob: "", gender: "",
    genderCustom: "", interests: [], customInterest: "",
    experiences: [], availability: [], distance: "",
    email: "", phone: "", zipCode: "", contactPreference: "",
    parentEmail: "", password: "", confirmPassword: "",
  });

  /* ─── Poster data ─── */
  const [poster, setPoster] = useState({
    companyName: "", contactName: "", contactEmail: "",
    contactPhone: "", companyZip: "",
    password: "", confirmPassword: "",
  });

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

  const age = (() => {
    if (!seeker.dob) return null;
    const t = new Date(), b = new Date(seeker.dob);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  })();

  const canProceed = () => {
    if (currentStep === "role") return !!role;
    return true;
  };

  /* ─── Submit: create account + save data ─── */
  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);

    if (role === "seeker") {
      if (seeker.password !== seeker.confirmPassword) {
        setSubmitError("Passwords do not match."); setSubmitting(false); return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: seeker.email, password: seeker.password,
      });
      if (error) { setSubmitError(error.message); setSubmitting(false); return; }

      const userId = data.user.id;
      await supabase.from("profiles").insert({ id: userId, role: "seeker" });
      await supabase.from("seekers").insert({
        id: userId,
        first_name: seeker.firstName, last_name: seeker.lastName,
        dob: seeker.dob || null, gender: seeker.gender, gender_custom: seeker.genderCustom,
        interests: seeker.interests, experiences: seeker.experiences,
        availability: seeker.availability, distance: seeker.distance,
        email: seeker.email, phone: seeker.phone, zip_code: seeker.zipCode,
        contact_preference: seeker.contactPreference, parent_email: seeker.parentEmail,
      });

      setUser(data.user);
      setUserRole("seeker");
      setAuthView("dashboard");

    } else {
      if (poster.password !== poster.confirmPassword) {
        setSubmitError("Passwords do not match."); setSubmitting(false); return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: poster.contactEmail, password: poster.password,
      });
      if (error) { setSubmitError(error.message); setSubmitting(false); return; }

      const userId = data.user.id;
      await supabase.from("profiles").insert({ id: userId, role: "poster" });
      await supabase.from("employers").insert({
        id: userId,
        company_name: poster.companyName, contact_name: poster.contactName,
        contact_email: poster.contactEmail, contact_phone: poster.contactPhone,
        company_zip: poster.companyZip,
      });

      setUser(data.user);
      setUserRole("poster");
      setAuthView("dashboard");
    }

    setSubmitting(false);
  };

  const tagline = role === "poster" ? "Find young talent nearby" : "Find gigs. Build skills. Earn money.";

  /* ─── Loading screen ─── */
  /* ─── Homepage — renders outside the onboarding card ─── */
  if (authView === "dashboard") {
    const dashProps = {
      user,
      onSignOut: () => { setUser(null); setUserRole(null); setAuthView("home"); },
      onBrowse: () => setAuthView("home"),
    };
    if (userRole === "seeker") return <SeekerDashboard {...dashProps} />;
    if (userRole === "poster") return <EmployerDashboard {...dashProps} />;
    // Role not loaded yet — show a simple loading screen
    return (
      <>
        <style>{CSS_STYLES}</style>
        <div className="gs-wrap">
          <div className="gs-orb gs-orb1" /><div className="gs-orb gs-orb2" />
          <div className="gs-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (authView === "home") {
    return (
      <HomePage
        user={user}
        onLogin={() => setAuthView("login")}
        onRegister={() => setAuthView("onboarding")}
        onSignOut={() => setUser(null)}
        onDashboard={() => setAuthView("dashboard")}
      />
    );
  }

  if (authView === "loading") {
    return (
      <>
        <style>{CSS_STYLES}</style>
        <div className="gs-wrap">
          <div className="gs-orb gs-orb1" /><div className="gs-orb gs-orb2" />
          <div className="gs-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS_STYLES}</style>
      <div className="gs-wrap">
        <div className="gs-orb gs-orb1" />
        <div className="gs-orb gs-orb2" />
        <div className="gs-card">

          {/* Header */}
          <div className="gs-header">
            <div
              className="gs-logo-row"
              onClick={() => setAuthView("home")}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAuthView("home"); }}
              aria-label="Go to home page"
            >
              <span className="gs-logo-icon">⚡</span>
              <span className="gs-logo-text">First Gig</span>
            </div>
            <p className="gs-tagline">
              {authView === "onboarding" ? tagline : "Find gigs. Build skills. Earn money."}
            </p>
          </div>

          {/* ── Auth views ── */}
          {authView === "login" && (
            <div className="gs-step in">
              <LoginForm
                onSuccess={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) {
                    setUser(session.user);
                    const role = await fetchRole(session.user.id);
                    setUserRole(role);
                  }
                  setAuthView("dashboard");
                }}
                onBack={() => setAuthView("home")}
              />
            </div>
          )}

          {/* ── Onboarding flow ── */}
          {authView === "onboarding" && (
            <>
              <div className="gs-progress">
                <div className="gs-pbar">
                  <div className="gs-pfill" style={{ width: `${progress}%` }} />
                </div>
                <span className="gs-ptext">{step + 1}/{steps.length}</span>
              </div>

              <div className={`gs-step ${animating ? "out" : "in"}`}
                style={animating ? { transform: `translateX(${dir * 30}px)` } : {}}>

                {currentStep === "role" && <StepRole v={role} set={setRole} />}

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

                {currentStep === "businessInfo" && <StepBusinessInfo d={poster} set={uP} />}
                {currentStep === "posterReview" && <PosterReview d={poster} />}
              </div>

              {submitError && (
                <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", margin: "4px 0 0", padding: "6px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>
                  {submitError}
                </p>
              )}

              <div className="gs-nav">
                {step > 0
                  ? <button className="gs-back" onClick={() => go(-1)}>← Back</button>
                  : <button className="gs-back" onClick={() => setAuthView("home")}>← Back</button>
                }
                {(currentStep === "seekerReview" || currentStep === "posterReview") ? (
                  <button className={`gs-next submit ${submitting ? "disabled" : ""}`}
                    onClick={!submitting ? handleSubmit : undefined}>
                    {submitting ? "Saving..." : "Create Account ✨"}
                  </button>
                ) : (
                  <button className={`gs-next ${canProceed() ? "" : "disabled"}`}
                    onClick={canProceed() ? () => go(1) : undefined}>Continue →</button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
