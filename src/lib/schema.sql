-- ─── Profiles (one row per auth user, stores their role) ───────────────────
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        text not null check (role in ('seeker', 'poster')),
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read/write own profile"
  on public.profiles for all using (auth.uid() = id);

-- ─── Seekers ────────────────────────────────────────────────────────────────
create table public.seekers (
  id                 uuid primary key references auth.users on delete cascade,
  first_name         text,
  last_name          text,
  dob                date,
  gender             text,
  gender_custom      text,
  interests          text[]  default '{}',
  experiences        jsonb   default '[]',
  availability       text[]  default '{}',
  distance           text,
  email              text,
  phone              text,
  zip_code           text,
  contact_preference text,
  parent_email       text,
  created_at         timestamptz default now()
);
alter table public.seekers enable row level security;
create policy "Seekers can read/write own row"
  on public.seekers for all using (auth.uid() = id);

-- ─── Employers ──────────────────────────────────────────────────────────────
create table public.employers (
  id             uuid primary key references auth.users on delete cascade,
  company_name   text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  company_zip    text,
  created_at     timestamptz default now()
);
alter table public.employers enable row level security;
create policy "Employers can read/write own row"
  on public.employers for all using (auth.uid() = id);

-- ─── Jobs ───────────────────────────────────────────────────────────────────
create table public.jobs (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid references public.employers on delete cascade,
  job_title       text,
  job_desc        text,
  job_category    text[]  default '{}',
  positions_count integer default 1,
  min_age         text,
  skills          text,
  dress_code      text,
  requirements    text,
  pay_type        text,
  pay_min         numeric,
  pay_max         numeric,
  hours_per_week  numeric,
  schedule        text[]  default '{}',
  start_date      date,
  end_date        date,
  job_address     text,
  job_city        text,
  job_state       text,
  job_zip         text,
  is_remote       boolean default false,
  created_at      timestamptz default now()
);
alter table public.jobs enable row level security;
create policy "Employers manage own jobs"
  on public.jobs for all using (auth.uid() = employer_id);
create policy "Seekers can view all jobs"
  on public.jobs for select using (true);
