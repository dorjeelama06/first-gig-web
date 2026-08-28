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
