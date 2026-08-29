import { supabase } from "./supabase";

export async function blockUser(blockedUserId, blockerId) {
  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: blockerId,
    blocked_id: blockedUserId,
  });
  if (error) {
    if (error.code === "23505") throw new Error("You've already blocked this user.");
    throw error;
  }
}

export async function unblockUser(blockedUserId, blockerId) {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedUserId);

  if (error) throw error;
}

/* Fetch the raw list of blocked_id values for a blocker — used to filter fetches. */
export async function fetchBlockedIds(blockerId) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", blockerId);

  if (error) throw error;
  return (data || []).map(b => b.blocked_id);
}

/* Fetch the full "Blocked" list for a profile/settings tab, with the other party's name. */
export async function fetchBlockedUsers(blockerId, blockerRole) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const table = blockerRole === "seeker" ? "employers" : "seekers";
  const fallback = blockerRole === "seeker" ? "Employer" : "Applicant";
  const ids = data.map(b => b.blocked_id);

  const { data: targets } = await supabase
    .from(table)
    .select(blockerRole === "seeker" ? "id, company_name" : "id, first_name, last_name, email")
    .in("id", ids);

  const nameFor = (id) => {
    const t = (targets || []).find(t => t.id === id);
    if (!t) return fallback;
    if (blockerRole === "seeker") return t.company_name || fallback;
    const fullName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim();
    return fullName || t.email || fallback;
  };

  return data.map(b => ({ ...b, name: nameFor(b.blocked_id) }));
}
