import { supabase } from "./supabase";

export async function reportJob(jobId, reporterId, reason, details = "") {
  const { error } = await supabase.from("job_reports").insert({
    job_id:      jobId,
    reporter_id: reporterId,
    reason,
    details:     details.trim() || null,
    status:      "pending",
  });
  if (error) throw error;
}

export async function reportUser(reportedUserId, reporterId, reason, details = "") {
  const { error } = await supabase.from("user_reports").insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
    details: details.trim() || null,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") throw new Error("You've already reported this user.");
    throw error;
  }
}
