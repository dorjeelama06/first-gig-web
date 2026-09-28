import { supabase } from "./supabase";

/* Edge Functions return { error, message } on failure; surface the message. */
async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const payload = await error.context?.json?.().catch(() => null);
    throw new Error(payload?.message ?? "Something went wrong. Please try again.");
  }
  return data;
}

/* Email the signed-in seeker's parent an approval link.
   With auto, an unexpired pending link is left alone (used on dashboard load).
   Returns { status: "sent" | "pending" | "verified" | "not_required", parentEmail? }. */
export async function sendParentVerification({ auto = false } = {}) {
  return invoke("parent-verification-send", { auto });
}

/* Record a parent's approval from the emailed link. Returns { status, firstName }. */
export async function confirmParentVerification(token) {
  return invoke("parent-verification-confirm", { token });
}
