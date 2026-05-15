-- ── Run this in Supabase SQL Editor ────────────────────────

-- Applications table
create table public.applications (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.jobs(id) on delete cascade,
  seeker_id   uuid references public.seekers(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete cascade,
  status      text default 'pending',   -- pending | reviewed | accepted | rejected
  created_at  timestamptz default now(),
  unique(job_id, seeker_id)
);

alter table public.applications enable row level security;

-- Seekers can view their own applications
create policy "Seekers can view own applications"
  on public.applications for select
  using (auth.uid() = seeker_id);

-- Employers can view applications to their jobs
create policy "Employers can view job applications"
  on public.applications for select
  using (auth.uid() = employer_id);

-- Seekers can apply
create policy "Seekers can apply"
  on public.applications for insert
  with check (auth.uid() = seeker_id);

-- Employers can update application status
create policy "Employers can update status"
  on public.applications for update
  using (auth.uid() = employer_id);

-- ── Fix conversations: employers initiate, not seekers ───────────
drop policy if exists "Seekers can start conversations" on public.conversations;

create policy "Employers can start conversations"
  on public.conversations for insert
  with check (auth.uid() = employer_id);
