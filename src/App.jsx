import { useState, useEffect, useRef } from "react";
import { CSS_STYLES } from "./styles/styles";
import { SEEKER_STEPS, POSTER_STEPS } from "./constants/steps";
import { supabase } from "./lib/supabase";
import { signUp, signOut, fetchRole } from "./lib/auth";
import { ageFromDob, validateSeekerStep, validatePosterStep } from "./lib/validation";

import HomePage from "./pages/HomePage";
import LoginForm from "./components/auth/LoginForm";
import CheckEmail from "./components/auth/CheckEmail";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import AccountIncomplete from "./components/auth/AccountIncomplete";
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
import LegalModal from "./components/shared/LegalModal";

const INITIAL_SEEKER = {
  firstName: "", lastName: "", dob: "", gender: "",
  genderCustom: "", interests: [], customInterest: "",
  experiences: [], availability: [], distance: "",
  email: "", phone: "", zipCode: "", contactPreference: "",
  parentEmail: "", password: "", confirmPassword: "",
};

const INITIAL_POSTER = {
  companyName: "", contactName: "", contactEmail: "",
  contactPhone: "", companyZip: "",
  password: "", confirmPassword: "",
};

export default function App() {
  // 'loading' | 'home' | 'login' | 'forgotPassword' | 'resetPassword' | 'checkEmail'
  // | 'onboarding' | 'incomplete' | 'dashboard'
  const [authView, setAuthView] = useState("loading");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleFailed, setRoleFailed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [legalSection, setLegalSection] = useState(null);

  // True while the user is setting a new password from a recovery link — nothing may navigate away
  const recoveryRef = useRef(false);
  // Bumped on every sign-in attempt / sign-out so a slow role lookup can't apply to a stale session
  const enterSeq = useRef(0);

  /* Look up the role for a signed-in user and route to the dashboard (or the incomplete screen). */
  const enterApp = async (u) => {
    const seq = ++enterSeq.current;
    setUser(u);
    setAuthView("loading");
    try {
      const role = await fetchRole(u.id);
      if (seq !== enterSeq.current || recoveryRef.current) return;
      setUserRole(role);
      setRoleFailed(false);
      setAuthView(role ? "dashboard" : "incomplete");
    } catch (e) {
      console.error("Role lookup failed:", e);
      if (seq !== enterSeq.current || recoveryRef.current) return;
      setUserRole(null);
      setRoleFailed(true);
      setAuthView("incomplete");
    }
  };

  /* ─── Session check on mount ─── */
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) recoveryRef.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (recoveryRef.current) { setAuthView("resetPassword"); return; }
      // If already logged in, go straight to the dashboard
      if (session?.user) enterApp(session.user);
      else setAuthView("home");
    });

    // Don't await Supabase calls in this callback — supabase-js can deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        recoveryRef.current = true;
        setAuthView("resetPassword");
      } else if (event === "SIGNED_OUT") {
        enterSeq.current++;
        setUserRole(null);
        setAuthView("home");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ─── Onboarding nav state ─── */
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState("");

  /* ─── Seeker / poster data ─── */
  const [seeker, setSeeker] = useState(INITIAL_SEEKER);
  const [poster, setPoster] = useState(INITIAL_POSTER);

  const steps = role === "poster" ? POSTER_STEPS : SEEKER_STEPS;
  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const resetOnboarding = () => {
    setSeeker(INITIAL_SEEKER);
    setPoster(INITIAL_POSTER);
    setRole("");
    setStep(0);
    setTermsAgreed(false);
    setStepError("");
    setSubmitError("");
  };

  const go = (d) => {
    const next = step + d;
    if (next < 0 || next >= steps.length || animating) return;
    setStepError("");
    setDir(d);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 250);
  };

  /* ─── Seeker helpers ─── */
  const uS = (f, v) => { setStepError(""); setSeeker(p => ({ ...p, [f]: v })); };
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
  const uP = (f, v) => { setStepError(""); setPoster(p => ({ ...p, [f]: v })); };

  const age = ageFromDob(seeker.dob);

  const validateStep = (id) => role === "poster" ? validatePosterStep(id, poster) : validateSeekerStep(id, seeker);

  const handleContinue = () => {
    if (currentStep === "role" && !role) return;
    const err = validateStep(currentStep);
    setStepError(err);
    if (!err) go(1);
  };

  /* ─── Sign out: clears the Supabase session, not just local state ─── */
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
    enterSeq.current++;
    setUser(null);
    setUserRole(null);
    resetOnboarding();
    setAuthView("home");
  };

  /* ─── Submit: create account; profile rows are created by the handle_new_user trigger ─── */
  const handleSubmit = async () => {
    setSubmitError("");
    for (const id of steps) {
      const err = validateStep(id);
      if (err) { setSubmitError(err); return; }
    }
    if (!termsAgreed) {
      setSubmitError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);

    const isPoster = role === "poster";
    const email = (isPoster ? poster.contactEmail : seeker.email).trim();
    const password = isPoster ? poster.password : seeker.password;
    // Keys must match what handle_new_user reads; email comes from the auth user, never the profile
    const profile = isPoster ? {
      company_name: poster.companyName.trim(), contact_name: poster.contactName.trim(),
      contact_phone: poster.contactPhone.trim(), company_zip: poster.companyZip.trim(),
    } : {
      first_name: seeker.firstName.trim(), last_name: seeker.lastName.trim(),
      dob: seeker.dob, gender: seeker.gender, gender_custom: seeker.genderCustom.trim(),
      interests: seeker.interests, experiences: seeker.experiences,
      availability: seeker.availability, distance: seeker.distance,
      phone: seeker.phone.trim(), zip_code: seeker.zipCode.trim(),
      contact_preference: seeker.contactPreference, parent_email: seeker.parentEmail.trim(),
    };

    try {
      const { needsConfirmation, user: newUser } = await signUp(email, password, role, profile);
      resetOnboarding();
      if (needsConfirmation) {
        setPendingEmail(email);
        setAuthView("checkEmail");
      } else {
        await enterApp(newUser);
      }
    } catch (e) {
      setSubmitError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = (notice = "") => { setLoginNotice(notice); setAuthView("login"); };

  const tagline = role === "poster" ? "Find young talent nearby" : "Find gigs. Build skills. Earn money.";

  /* ─── Dashboards / homepage render outside the onboarding card ─── */
  if (authView === "dashboard" && (userRole === "seeker" || userRole === "poster")) {
    const dashProps = {
      user,
      onSignOut: handleSignOut,
      onBrowse: () => setAuthView("home"),
    };
    return userRole === "seeker" ? <SeekerDashboard {...dashProps} /> : <EmployerDashboard {...dashProps} />;
  }

  if (authView === "home") {
    return (
      <HomePage
        user={user}
        onLogin={() => goToLogin()}
        onRegister={() => { resetOnboarding(); setAuthView("onboarding"); }}
        onSignOut={handleSignOut}
        onDashboard={() => user && enterApp(user)}
      />
    );
  }

  if (authView === "loading" || authView === "dashboard") {
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

  const shownError = stepError || submitError;

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
                notice={loginNotice}
                onSuccess={enterApp}
                onBack={() => setAuthView("home")}
                onForgot={() => setAuthView("forgotPassword")}
              />
            </div>
          )}

          {authView === "forgotPassword" && (
            <div className="gs-step in">
              <ForgotPasswordForm onBack={() => goToLogin()} />
            </div>
          )}

          {authView === "resetPassword" && (
            <div className="gs-step in">
              <ResetPasswordForm
                onDone={async () => {
                  recoveryRef.current = false;
                  window.history.replaceState(null, "", window.location.pathname);
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) enterApp(session.user);
                  else goToLogin("Password updated — please sign in.");
                }}
              />
            </div>
          )}

          {authView === "checkEmail" && (
            <div className="gs-step in">
              <CheckEmail email={pendingEmail} onSignIn={() => goToLogin()} />
            </div>
          )}

          {authView === "incomplete" && (
            <div className="gs-step in">
              <AccountIncomplete
                failed={roleFailed}
                onRetry={() => user && enterApp(user)}
                onSignOut={handleSignOut}
              />
            </div>
          )}

          {/* ── Onboarding flow ── */}
          {authView === "onboarding" && (
            <>
              {legalSection && <LegalModal section={legalSection} onClose={() => setLegalSection(null)} />}
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
                {currentStep === "contact" && <StepContact d={seeker} set={uS} age={age} />}
                {currentStep === "seekerReview" && (
                  <SeekerReview d={seeker} age={age}
                    termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed}
                    onShowTerms={() => setLegalSection("terms")}
                    onShowPrivacy={() => setLegalSection("privacy")} />
                )}

                {currentStep === "businessInfo" && <StepBusinessInfo d={poster} set={uP} />}
                {currentStep === "posterReview" && (
                  <PosterReview d={poster}
                    termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed}
                    onShowTerms={() => setLegalSection("terms")}
                    onShowPrivacy={() => setLegalSection("privacy")} />
                )}
              </div>

              {shownError && (
                <p role="alert" style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", margin: "4px 0 0", padding: "6px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>
                  {shownError}
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
                  <button className={`gs-next ${currentStep === "role" && !role ? "disabled" : ""}`}
                    onClick={handleContinue}>Continue →</button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
