import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../supabase";
import {
  signUp, signOut, fetchRole, resendConfirmation, requestPasswordReset, updatePassword,
} from "../auth";

vi.mock("../supabase", () => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return {
    supabase: {
      auth: {
        signUp: vi.fn(), signOut: vi.fn(), resend: vi.fn(),
        resetPasswordForEmail: vi.fn(), updateUser: vi.fn(),
      },
      from: vi.fn(() => query),
      __query: query,
    },
  };
});

const ORIGIN = "https://firstgigapp.com";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("window", { location: { origin: ORIGIN } });
});

describe("signUp", () => {
  it("sends role and profile as user metadata, with the site as redirect", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{}] }, session: null }, error: null,
    });
    await signUp("a@b.com", "secret123", "seeker", { first_name: "Jo" });
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret123",
      options: { data: { role: "seeker", profile: { first_name: "Jo" } }, emailRedirectTo: ORIGIN },
    });
  });

  it("reports that confirmation is needed when there is no session", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{}] }, session: null }, error: null,
    });
    await expect(signUp("a@b.com", "x", "poster", {})).resolves.toMatchObject({ needsConfirmation: true });
  });

  it("returns the user and no confirmation needed when a session is returned", async () => {
    const user = { id: "u1", identities: [{}] };
    supabase.auth.signUp.mockResolvedValue({ data: { user, session: { access_token: "t" } }, error: null });
    await expect(signUp("a@b.com", "x", "poster", {})).resolves.toEqual({ needsConfirmation: false, user });
  });

  it("rejects an email that already has an account", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [] }, session: null }, error: null,
    });
    await expect(signUp("a@b.com", "x", "seeker", {})).rejects.toThrow(/already exists/);
  });

  it("replaces the trigger's opaque database error with a readable message", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: new Error("Database error saving new user") });
    await expect(signUp("a@b.com", "x", "seeker", {})).rejects.toThrow(/couldn't create your account/);
  });

  it("passes other Supabase errors through", async () => {
    const err = new Error("Password should be at least 8 characters");
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: err });
    await expect(signUp("a@b.com", "x", "seeker", {})).rejects.toBe(err);
  });
});

describe("signOut", () => {
  it("signs out normally", async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("falls back to clearing the local session when the server call fails", async () => {
    const err = new Error("network");
    supabase.auth.signOut.mockResolvedValueOnce({ error: err }).mockResolvedValueOnce({ error: null });
    await expect(signOut()).rejects.toBe(err);
    expect(supabase.auth.signOut).toHaveBeenLastCalledWith({ scope: "local" });
  });
});

describe("fetchRole", () => {
  it("returns the role", async () => {
    supabase.__query.maybeSingle.mockResolvedValue({ data: { role: "seeker" }, error: null });
    await expect(fetchRole("u1")).resolves.toBe("seeker");
  });

  it("returns null when there is no profile row", async () => {
    supabase.__query.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(fetchRole("u1")).resolves.toBeNull();
  });

  it("throws on a query error instead of treating it as no role", async () => {
    supabase.__query.maybeSingle.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(fetchRole("u1")).rejects.toThrow("network");
  });
});

describe("email links", () => {
  it("resends the signup email back to the site", async () => {
    supabase.auth.resend.mockResolvedValue({ error: null });
    await resendConfirmation("a@b.com");
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: "signup", email: "a@b.com", options: { emailRedirectTo: ORIGIN },
    });
  });

  it("requests a password reset back to the site", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await requestPasswordReset("a@b.com");
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.com", { redirectTo: ORIGIN });
  });

  it("throws when the reset request fails", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: new Error("rate limited") });
    await expect(requestPasswordReset("a@b.com")).rejects.toThrow("rate limited");
  });
});

describe("updatePassword", () => {
  it("updates the signed-in user's password", async () => {
    supabase.auth.updateUser.mockResolvedValue({ error: null });
    await updatePassword("newpassword");
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword" });
  });

  it("throws when the session is missing or expired", async () => {
    supabase.auth.updateUser.mockResolvedValue({ error: new Error("Auth session missing!") });
    await expect(updatePassword("newpassword")).rejects.toThrow("Auth session missing!");
  });
});
