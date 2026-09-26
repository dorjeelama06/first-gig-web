import { supabase } from "./supabase";

// Where confirmation / password-reset links send the user back to.
// Must be listed under Supabase Auth → URL Configuration → Redirect URLs.
const redirectUrl = () => window.location.origin;

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/* Profile rows are created server-side by the handle_new_user trigger from this metadata. */
export async function signUp(email, password, role, profile) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, profile }, emailRedirectTo: redirectUrl() },
  });
  if (error) {
    // The trigger rejected the profile (missing field, under age); GoTrue hides the reason
    if (/database error saving new user/i.test(error.message ?? "")) {
      throw new Error("We couldn't create your account. Please check your details and try again.");
    }
    throw error;
  }
  // With email confirmation on, Supabase returns a user with no identities for an existing email.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("An account with this email already exists. Try signing in instead.");
  }
  return { needsConfirmation: !data.session, user: data.user };
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup", email, options: { emailRedirectTo: redirectUrl() },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Server unreachable: still clear this device's session so a shared computer is signed out
    await supabase.auth.signOut({ scope: "local" });
    throw error;
  }
}

/* Returns the role, or null when the user has no profile row. Throws on a query error. */
export async function fetchRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
  if (error) throw error;
}

/* Sets a new password for the signed-in user (used after a password-recovery link). */
export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
