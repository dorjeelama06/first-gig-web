-- Run this in Supabase SQL Editor to populate sample job data
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Fake employer auth users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'springfield.rec@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'community.center@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Profiles
INSERT INTO public.profiles (id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'poster'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'poster')
ON CONFLICT (id) DO NOTHING;

-- 3. Employers
INSERT INTO public.employers (id, company_name, contact_name, contact_email, contact_phone, company_zip) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Springfield Recreation Center', 'Mike Johnson', 'mike@springfieldrec.com', '(555) 123-4567', '62701'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Community Youth Center', 'Sarah Williams', 'sarah@communityyouth.org', '(555) 987-6543', '62702')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample jobs
INSERT INTO public.jobs (
  employer_id, job_title, job_desc, job_category,
  positions_count, min_age, skills, dress_code, requirements,
  pay_type, pay_min, pay_max, hours_per_week,
  schedule, start_date, end_date,
  job_city, job_state, job_zip, is_remote
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Front Desk Assistant',
  'Greet visitors, answer phones, and help with check-ins at our busy recreation center front desk. You will be the first face people see when they walk in — friendly, professional, and organized is what we are looking for. Great opportunity to build customer service skills.',
  ARRAY['errands'], 2, '16', NULL,
  'Polo shirt (provided); closed-toe shoes', NULL,
  'hourly', 14, 17, 15,
  ARRAY['weekday_afternoon', 'saturday'],
  '2026-06-01', NULL, 'Springfield', 'IL', '62701', false
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Summer Camp Counselor',
  'Lead daily activities and supervise groups of kids aged 6–12 during our summer camp sessions. Activities include sports, arts & crafts, swimming, and outdoor games. You will plan activities, manage groups, and ensure a safe and fun environment for all campers.',
  ARRAY['camps'], 4, '16',
  'CPR Certified (or willing to get certified before start date)',
  'Athletic wear; closed-toe shoes',
  'Must be available for the full summer break period.',
  'hourly', 15, 18, 35,
  ARRAY['summer'],
  '2026-06-16', '2026-08-22', 'Springfield', 'IL', '62701', false
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Swim Lesson Assistant',
  'Assist the lead instructor during youth swim lessons for kids aged 4–10. Help beginners feel comfortable in the water, demonstrate basic techniques, and ensure all participants follow safety rules. Prior swim team or lessons experience is a bonus but not required.',
  ARRAY['lifeguarding'], 3, '15',
  'Lifeguard certification a plus',
  'Rec Center swimsuit (provided)', NULL,
  'hourly', 13, 16, 10,
  ARRAY['weekday_morning', 'saturday'],
  '2026-06-01', NULL, 'Springfield', 'IL', '62701', false
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fitness Room Monitor',
  'Monitor the fitness room, ensure equipment is used safely, wipe down machines between uses, and help members with any questions. You will also track room capacity and assist new members with equipment orientation. Training provided.',
  ARRAY['sports'], 1, '17', NULL,
  'Rec Center staff shirt (provided); athletic pants',
  'Must complete in-house equipment safety training before first shift.',
  'hourly', 15, 17, 12,
  ARRAY['weekday_evening', 'saturday', 'sunday'],
  '2026-06-01', NULL, 'Springfield', 'IL', '62701', false
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Youth Sports Referee',
  'Officiate youth basketball and soccer games for kids aged 8–14. Must be able to enforce rules fairly, manage game flow, and communicate clearly with coaches and players. No prior refereeing experience required — paid training is provided for all new referees.',
  ARRAY['refereeing', 'sports'], 5, '16', NULL,
  'Black and white referee shirt (provided)', NULL,
  'hourly', 16, 20, 8,
  ARRAY['saturday', 'sunday'],
  '2026-05-15', '2026-08-30', 'Springfield', 'IL', '62702', false
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Lifeguard',
  'Supervise swimmers at our outdoor community pool, enforce pool rules, and respond to emergencies. Must maintain constant vigilance during all shifts. Lifeguard certification is required — if you are currently in the process, we will hold your spot. Certification course reimbursed after 30 days.',
  ARRAY['lifeguarding'], 4, '15',
  'Valid Lifeguard Certification (or currently in certification course)',
  'Red lifeguard swimsuit (provided)', NULL,
  'hourly', 16, 19, 20,
  ARRAY['weekday_morning', 'saturday', 'sunday', 'summer'],
  '2026-06-01', '2026-08-31', 'Springfield', 'IL', '62702', false
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Arts & Crafts Instructor',
  'Lead 90-minute arts and crafts sessions for kids aged 5–10 on Saturday mornings. You will plan the project for each week, gather materials (provided by us), and guide kids through the activity. Creative freedom is encouraged — we want someone who loves making things and can get kids excited about art.',
  ARRAY['crafts', 'camps'], 1, '15', NULL,
  'Casual — expect to get a little messy!', NULL,
  'flat', 75, NULL, 3,
  ARRAY['saturday'],
  '2026-05-10', NULL, 'Springfield', 'IL', '62702', false
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'After-School Program Aide',
  'Supervise and engage kids in our after-school program from 3pm–6pm on weekdays. Help with homework, organize group activities, and provide a safe and supportive environment. Snack preparation is occasionally required. Great role for someone who enjoys working with kids and wants experience in education or childcare.',
  ARRAY['camps', 'errands'], 2, '16', NULL,
  'Casual comfortable clothing', NULL,
  'hourly', 14, NULL, 15,
  ARRAY['weekday_afternoon'],
  '2026-05-01', NULL, 'Springfield', 'IL', '62702', false
);
