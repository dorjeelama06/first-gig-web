-- ── Run this in Supabase SQL Editor ────────────────────────

-- Conversations table (one per seeker+job pair)
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.jobs(id) on delete cascade,
  seeker_id   uuid references public.seekers(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(job_id, seeker_id)
);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = seeker_id or auth.uid() = employer_id);

create policy "Seekers can start conversations"
  on public.conversations for insert
  with check (auth.uid() = seeker_id);

-- Messages table
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id       uuid references auth.users(id) on delete cascade,
  content         text not null,
  read            boolean default false,
  created_at      timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and (seeker_id = auth.uid() or employer_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where id = conversation_id
      and (seeker_id = auth.uid() or employer_id = auth.uid())
    )
  );

-- Enable Realtime for instant message delivery
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
