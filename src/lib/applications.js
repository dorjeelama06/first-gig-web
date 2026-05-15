import { supabase } from "./supabase";

/* Apply to a job — idempotent (safe to call twice).
   Returns { id, alreadyApplied } on success.
   Handles unique constraint violations (Postgres error code 23505) gracefully
   so a race condition or double-submit never surfaces as an unhandled error. */
export async function applyToJob(jobId, seekerId, employerId) {
  try {
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("seeker_id", seekerId)
      .maybeSingle();

    if (existing) return { id: existing.id, alreadyApplied: true };

    const { data, error } = await supabase
      .from("applications")
      .insert({ job_id: jobId, seeker_id: seekerId, employer_id: employerId })
      .select("id")
      .single();

    if (error) {
      // Postgres unique constraint violation — treat as a duplicate application
      if (error.code === "23505") return { alreadyApplied: true };
      throw error;
    }

    return { id: data.id, alreadyApplied: false };
  } catch (err) {
    // Re-throw anything that isn't a duplicate-application scenario
    throw err;
  }
}

/* Fetch all job IDs a seeker has applied to (for button state on homepage) */
export async function fetchAppliedJobIds(seekerId) {
  const { data } = await supabase
    .from("applications")
    .select("job_id")
    .eq("seeker_id", seekerId);

  return (data || []).map(a => a.job_id);
}

/* Fetch full applications list for a seeker's dashboard */
export async function fetchSeekerApplications(seekerId) {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id, status, created_at,
      jobs(id, job_title),
      employers(company_name)
    `)
    .eq("seeker_id", seekerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/* Fetch all applicants across an employer's jobs */
export async function fetchEmployerApplicants(employerId) {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id, status, created_at, seeker_id,
      jobs(id, job_title, employer_id),
      seekers(id, first_name, last_name, email, phone, interests, availability)
    `)
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/* Update an application's status */
export async function updateApplicationStatus(applicationId, status) {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) throw error;
}

/* Subscribe to new applications for an employer — returns an unsubscribe fn.
   Fires onNew(application) whenever a seeker applies to any of their jobs. */
export function subscribeToNewApplications(employerId, onNew) {
  const channel = supabase
    .channel(`applications-${employerId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "applications",
        filter: `employer_id=eq.${employerId}`,
      },
      payload => onNew(payload.new)
    )
    .subscribe();

  // Return a cleanup function so callers can unsubscribe (e.g. in useEffect)
  return () => supabase.removeChannel(channel);
}
