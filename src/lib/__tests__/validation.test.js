import { describe, it, expect } from "vitest";
import {
  ageFromDob, todayIso, isValidEmail, isValidZip, validateSeekerStep, validatePosterStep,
  parseMinAge, meetsMinAge,
} from "../validation";

// Local-time date, matching how the app reads "today"
const TODAY = new Date(2026, 8, 26); // 2026-09-26

const seeker = (over = {}) => ({
  firstName: "Jo", lastName: "", dob: "2010-01-15", email: "jo@example.com",
  phone: "", zipCode: "07030", parentEmail: "mom@example.com",
  password: "longenough", confirmPassword: "longenough", ...over,
});

const poster = (over = {}) => ({
  companyName: "Acme", contactName: "Pat", contactEmail: "pat@acme.com",
  contactPhone: "", companyZip: "07030", password: "longenough", confirmPassword: "longenough", ...over,
});

describe("ageFromDob", () => {
  it("counts the birthday itself as the new age", () => {
    expect(ageFromDob("2012-09-26", TODAY)).toBe(14);
  });
  it("is one less the day before the birthday", () => {
    expect(ageFromDob("2012-09-27", TODAY)).toBe(13);
  });
  it("handles a Feb 29 birthday in a non-leap year", () => {
    expect(ageFromDob("2012-02-29", new Date(2026, 1, 28))).toBe(13);
    expect(ageFromDob("2012-02-29", new Date(2026, 2, 1))).toBe(14);
  });
  it("returns null for missing or malformed input", () => {
    expect(ageFromDob("", TODAY)).toBeNull();
    expect(ageFromDob("not-a-date", TODAY)).toBeNull();
  });
});

describe("formats", () => {
  it("todayIso uses local date parts", () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
  it("validates emails", () => {
    expect(isValidEmail(" a@b.co ")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
  it("validates zip codes", () => {
    expect(isValidZip("07030")).toBe(true);
    expect(isValidZip("07030-1234")).toBe(true);
    expect(isValidZip("7030")).toBe(false);
    expect(isValidZip("abcde")).toBe(false);
  });
});

describe("validateSeekerStep", () => {
  it("requires a first name", () => {
    expect(validateSeekerStep("name", seeker({ firstName: "  " }), TODAY)).toMatch(/first name/);
    expect(validateSeekerStep("name", seeker(), TODAY)).toBe("");
  });

  it("enforces the minimum age of 14", () => {
    expect(validateSeekerStep("dob", seeker({ dob: "2012-09-26" }), TODAY)).toBe("");
    expect(validateSeekerStep("dob", seeker({ dob: "2012-09-27" }), TODAY)).toMatch(/at least 14/);
  });

  it("rejects missing, future and implausible dates of birth", () => {
    expect(validateSeekerStep("dob", seeker({ dob: "" }), TODAY)).toMatch(/date of birth/);
    expect(validateSeekerStep("dob", seeker({ dob: "2027-01-01" }), TODAY)).toMatch(/future/);
    expect(validateSeekerStep("dob", seeker({ dob: "1900-01-01" }), TODAY)).toMatch(/check/);
  });

  it("accepts a complete contact step", () => {
    expect(validateSeekerStep("contact", seeker(), TODAY)).toBe("");
  });

  it("requires a parent email under 18", () => {
    expect(validateSeekerStep("contact", seeker({ parentEmail: "" }), TODAY)).toMatch(/parent or guardian/);
  });

  it("does not require a parent email at 18", () => {
    expect(validateSeekerStep("contact", seeker({ dob: "2008-09-26", parentEmail: "" }), TODAY)).toBe("");
  });

  it("rejects a parent email that is the seeker's own", () => {
    expect(validateSeekerStep("contact", seeker({ parentEmail: "JO@example.com" }), TODAY)).toMatch(/different/);
  });

  it("checks email, phone and zip", () => {
    expect(validateSeekerStep("contact", seeker({ email: "nope" }), TODAY)).toMatch(/valid email/);
    expect(validateSeekerStep("contact", seeker({ phone: "555-12" }), TODAY)).toMatch(/phone/);
    expect(validateSeekerStep("contact", seeker({ phone: "(555) 123-4567" }), TODAY)).toBe("");
    expect(validateSeekerStep("contact", seeker({ zipCode: "" }), TODAY)).toMatch(/zip/);
  });

  it("checks password length and confirmation", () => {
    expect(validateSeekerStep("contact", seeker({ password: "short", confirmPassword: "short" }), TODAY)).toMatch(/at least 8/);
    expect(validateSeekerStep("contact", seeker({ confirmPassword: "different1" }), TODAY)).toMatch(/do not match/);
  });

  it("does not block optional steps", () => {
    expect(validateSeekerStep("interests", seeker(), TODAY)).toBe("");
  });
});

describe("validatePosterStep", () => {
  it("accepts complete business info", () => {
    expect(validatePosterStep("businessInfo", poster())).toBe("");
  });
  it("requires company and contact name", () => {
    expect(validatePosterStep("businessInfo", poster({ companyName: "" }))).toMatch(/company/);
    expect(validatePosterStep("businessInfo", poster({ contactName: " " }))).toMatch(/contact person/);
  });
  it("checks email, zip and password", () => {
    expect(validatePosterStep("businessInfo", poster({ contactEmail: "x" }))).toMatch(/valid email/);
    expect(validatePosterStep("businessInfo", poster({ companyZip: "1" }))).toMatch(/zip/);
    expect(validatePosterStep("businessInfo", poster({ password: "short", confirmPassword: "short" }))).toMatch(/at least 8/);
  });
});

describe("parseMinAge", () => {
  it("parses the stored text value", () => {
    expect(parseMinAge("18")).toBe(18);
    expect(parseMinAge("21")).toBe(21);
  });
  it("falls back to the platform minimum when missing or blank", () => {
    expect(parseMinAge(null)).toBe(14);
    expect(parseMinAge(undefined)).toBe(14);
    expect(parseMinAge("")).toBe(14);
  });
});

describe("meetsMinAge", () => {
  it("allows the seeker on their birthday", () => {
    expect(meetsMinAge("2008-09-26", "18", TODAY)).toBe(true);
  });
  it("blocks the seeker the day before their birthday", () => {
    expect(meetsMinAge("2008-09-27", "18", TODAY)).toBe(false);
  });
  it("blocks a 15-year-old from a 21+ job", () => {
    expect(meetsMinAge("2011-01-01", "21", TODAY)).toBe(false);
  });
  it("uses the platform minimum when the job has no min_age", () => {
    expect(meetsMinAge("2012-09-26", null, TODAY)).toBe(true);
    expect(meetsMinAge("2012-09-27", "", TODAY)).toBe(false);
  });
  it("blocks when the dob is unknown", () => {
    expect(meetsMinAge(null, "14", TODAY)).toBe(false);
  });
});
