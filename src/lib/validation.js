export const MIN_SEEKER_AGE = 14;
export const MIN_PASSWORD = 8;

/* Whole years between a YYYY-MM-DD date of birth and `today`; null if no/invalid dob. */
export function ageFromDob(dob, today = new Date()) {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = today.getFullYear() - y;
  const month = today.getMonth() + 1;
  if (month < m || (month === m && today.getDate() < d)) age--;
  return age;
}

/* A job's min_age (stored as text) as a number; blank/missing falls back to the platform minimum. */
export function parseMinAge(minAge) {
  const n = parseInt(String(minAge ?? "").replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? MIN_SEEKER_AGE : n;
}

/* Whether a seeker with this dob can apply to a job with this min_age. Mirrors the applications RLS policy. */
export function meetsMinAge(dob, minAge, today = new Date()) {
  const age = ageFromDob(dob, today);
  return age !== null && age >= parseMinAge(minAge);
}

/* Local-time YYYY-MM-DD, for date input `max` attributes. */
export function todayIso(today = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? "").trim());
export const isValidZip   = (v) => /^\d{5}(-\d{4})?$/.test((v ?? "").trim());

function passwordError(password, confirmPassword) {
  if ((password ?? "").length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
}

/* Returns an error message for the given onboarding step, or "" if it's valid. */
export function validateSeekerStep(stepId, s, today = new Date()) {
  switch (stepId) {
    case "name":
      return s.firstName.trim() ? "" : "Please enter your first name.";
    case "dob": {
      const age = ageFromDob(s.dob, today);
      if (age === null) return "Please enter your date of birth.";
      if (age < 0) return "Date of birth can't be in the future.";
      if (age > 100) return "Please check your date of birth.";
      if (age < MIN_SEEKER_AGE) return `You need to be at least ${MIN_SEEKER_AGE} to use First Gig.`;
      return "";
    }
    case "contact": {
      if (!isValidEmail(s.email)) return "Please enter a valid email address.";
      if (s.phone.trim() && s.phone.replace(/\D/g, "").length < 10) return "Please enter a 10-digit phone number, or leave it blank.";
      if (!isValidZip(s.zipCode)) return "Please enter a 5-digit zip code.";
      if (!isValidEmail(s.parentEmail)) return "A parent or guardian email is required.";
      if (s.parentEmail.trim().toLowerCase() === s.email.trim().toLowerCase()) {
        return "Your parent or guardian email must be different from your own.";
      }
      return passwordError(s.password, s.confirmPassword);
    }
    default:
      return "";
  }
}

export function validatePosterStep(stepId, p) {
  if (stepId !== "businessInfo") return "";
  if (!p.companyName.trim()) return "Please enter your company or business name.";
  if (!p.contactName.trim()) return "Please enter a contact person.";
  if (!isValidEmail(p.contactEmail)) return "Please enter a valid email address.";
  if (p.contactPhone.trim() && p.contactPhone.replace(/\D/g, "").length < 10) return "Please enter a 10-digit phone number, or leave it blank.";
  if (!isValidZip(p.companyZip)) return "Please enter a 5-digit zip code.";
  return passwordError(p.password, p.confirmPassword);
}
