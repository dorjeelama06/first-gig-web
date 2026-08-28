# User Reporting

## Goal

A seeker or employer who has an actual relationship with another user — an existing conversation, or (for employers) an applicant relationship — can report that user for Harassment, Scam/fraud, Inappropriate behavior, Spam, or Other, from two places: the chat conversation header (both directions) and the employer's applicant list (employer → seeker). This is distinct from the existing job-report feature (`job_reports` table, `reportJob()`, `ReportModal.jsx`/`ReportSheet.jsx` on the job detail screen), which reports a *posting*, not a *person*, and is untouched by this work. The new report is written to a `user_reports` table shared across both apps via Supabase, write-only from the client (no admin panel exists — rows are reviewed manually via the Supabase dashboard, exactly like the `job_reports` precedent). The reporter gets a confirmation that explicitly states the reported user won't be notified. A reporter can't report the same user twice.

## Out of scope

- Any admin/moderation review UI — reports are reviewed via the Supabase table editor, same as `job_reports` today.
- Automatic consequences: no auto-blocking, hiding, muting, or rate-limiting of the reported user or the conversation.
- A "my reports" history view for the reporter (write-only RLS, no select policy at all — matches `job_reports`).
- Retroactively adding the missing migration for the *existing* `job_reports` table — that gap is real (confirmed via repo-wide search) but is a separate pre-existing issue, not part of this feature.
- Reporting a user from the job detail page — that surface keeps its existing "🚩 Report this job posting" link, which reports the posting, not the employer. No changes to `JobDetail.jsx`/`JobDetailScreen.jsx`.
- Notifying the reported user that they were reported.
- Reporting a user with no prior relationship (cold report by user id) — blocked by RLS by design.

## Files and interfaces

### Schema (canonical source: `first-gig-mobile/supabase/migrations/`)

New file: `first-gig-mobile/supabase/migrations/20260828_user_reports.sql`

```sql
create table if not exists user_reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references auth.users(id) on delete cascade,
  reported_user_id  uuid not null references auth.users(id) on delete cascade,
  reason            text not null,
  details           text,
  status            text not null default 'pending',  -- pending | reviewed | actioned | dismissed
  created_at        timestamptz not null default now()
);

-- One open report per (reporter, reported user) pair
create unique index if not exists user_reports_unique_reporter
  on user_reports (reporter_id, reported_user_id);

alter table user_reports enable row level security;

-- Insert-only: reporter must be the authenticated user, can't self-report,
-- and must share an existing conversation or application with the reported user.
create policy "Users can report a related user"
  on user_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and reporter_id <> reported_user_id
    and (
      exists (
        select 1 from public.conversations
        where (seeker_id = reporter_id and employer_id = reported_user_id)
           or (employer_id = reporter_id and seeker_id = reported_user_id)
      )
      or exists (
        select 1 from public.applications
        where (seeker_id = reporter_id and employer_id = reported_user_id)
           or (employer_id = reporter_id and seeker_id = reported_user_id)
      )
    )
  );

-- No select policy at all, by design: nobody can read reports from the client.
```

(`seekers.id`/`employers.id` are themselves `auth.users.id` per `schema.sql`, so comparing `conversations.seeker_id`/`employer_id` directly against `auth.uid()`-equivalent values is consistent with the rest of the schema.)

### Web (`gig-app`)

- **`src/lib/reports.js`** — add:
  ```js
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
  ```
- **`src/lib/chat.js`** — `fetchConversations` and `fetchConversationById` currently select `seekers(first_name, last_name, email)` and no `employers(...)` id at all. Add `id` to the `seekers(...)` embed and add `employers(id, company_name)` so `ChatWindow` has both participant ids available.
- **`src/components/shared/ReportUserModal.jsx`** (new) — standalone component, own `REASONS` array (`harassment`, `scam`, `inappropriate`, `spam`, `other`), independent of `ReportModal.jsx`. Props: `{ reportedName, onClose, onSubmit }`. Same internal state/flow shape as `ReportModal.jsx` (`reason`, `details`, `loading`, `done`, `error`), but done-screen copy: *"Thanks for the report — we'll review it within 24 hours. The other person won't be notified."*
- **`src/components/chat/ChatWindow.jsx`** — add a kebab (`⋮`) button to `.dash-chat-header` (currently has no trailing element), opening a small dropdown (mirror `Navbar.jsx`'s `menuRef`/`mousedown` click-outside pattern) with a single "🚩 Report user" item. Resolves `otherId` from the new `seekers.id`/`employers.id` fields based on `role`; menu item is disabled/hidden until `otherId` is defined. Owns `reportOpen` state locally, renders `ReportUserModal` on demand, calls `reportUser(otherId, userId, reason, details)`.
- **`src/pages/EmployerDashboard.jsx`** — in the applicant row (~lines 403-449), add a third stacked button "🚩 Report" next to the existing status `<select>` and "💬 Message" button, using `a.seeker_id` and `a.seekers` for the modal. Owns per-row or single shared `reportTarget` state, renders `ReportUserModal`.
- **`src/styles/dashboard.css`** — new classes for the kebab button/dropdown (`dash-chat-menu`, `dash-chat-menu-btn`, `dash-chat-menu-item`, `dash-chat-menu-item--danger`, following the `dash-` prefix convention and reusing `Navbar.jsx`'s dropdown visual style) and the applicant-row report button (`dash-badge`/red palette `#c0392b`/`#fdf2f2` already used for danger states elsewhere).
- Report-modal-body styles reuse the same visual pattern already added for `ReportModal.jsx` in `homepage.css` (reason list, textarea, submit button) — new rules scoped under `.report-user-modal` / `.report-user-*` class names to avoid colliding with the existing `.report-*` job-report classes.

### Mobile (`first-gig-mobile`)

- **`src/lib/reports.js`** — add the same `reportUser(reportedUserId, reporterId, reason, details = "")`, identical body/error-handling to the web version.
- **`src/lib/chat.js`** — same change as web: ensure `seeker_id`/`employer_id` (or nested `seekers.id`/`employers.id`) are present in whatever `fetchConversations`/`fetchConversationById`-equivalent queries back `ChatView`, so the other participant's id is available.
- **`src/components/chat/ReportUserSheet.jsx`** (new) — mirrors `ReportSheet.jsx` structure/styling (`COLORS`, `RADIUS`, bottom-sheet `Modal`), own `REASONS` list matching the web modal, done-screen copy identical to web's privacy-reassurance text. Props: `{ visible, reportedName, onClose, onSubmit }`.
- **`src/components/chat/ChatView.jsx`** — add a kebab/options `TouchableOpacity` (e.g. "⋮" or "🚩") to the header row after the `flex:1` name block (currently nothing sits there), opening `ReportUserSheet`. Same `otherId`-undefined guard as web.
- **`src/screens/employer/tabs/EmployerMessagesTab.jsx`** and **`src/screens/seeker/tabs/MessagesTab.jsx`** — own `reportOpen`/`reportTarget` state (mirroring how `JobDetailScreen.jsx` owns `reportOpen` today), pass a report-trigger callback down into `ChatView`.
- **`src/screens/employer/tabs/EmployerApplicantsTab.jsx`** — add a "🚩 Report" `TouchableOpacity` inside `s.cardActions`, alongside the existing `StatusPicker`, using `a.seeker_id`/`a.seekers`.
- New `StyleSheet` entries in each touched file, following the existing co-located `const s = StyleSheet.create({...})` convention and `COLORS`/`RADIUS` tokens from `src/constants/theme.js` (red/danger accents matching `ReportSheet.jsx`'s existing usage of `COLORS.red`).

## Edge cases

| Case | Expected behavior |
|---|---|
| Reporter reports the same user twice | Second insert hits the unique index (`23505`); `reportUser()` catches it and throws `"You've already reported this user."`; the modal/sheet surfaces that exact message instead of the generic fallback. |
| Reporter has no conversation or application with the target user | RLS `with check` fails, insert throws; UI shows the generic "Something went wrong" message (unreachable via normal UI since triggers only ever target a known relationship, but RLS is the real enforcement, not the UI). |
| Self-report | Blocked by `reporter_id <> reported_user_id` in the RLS check as defense-in-depth; UI never offers a "report yourself" path since the trigger always targets the *other* party. |
| `details` field | Optional, `maxLength={500}`, trimmed; empty string stored as `null` — same as existing `reportJob`. |
| Chat header rendered before participant id has loaded | `chat.js` queries are updated to include the id fields, but as a guard, the "Report user" menu item stays disabled/hidden until `otherId` is defined, so `reportUser` is never called with `undefined`. |
| Employer reports a seeker from the applicant list with no conversation yet | Allowed — the RLS check's `applications` branch covers this (application-only relationship, no conversation required). |
| Generic network/Supabase failure (not a duplicate) | Falls back to the existing generic error copy: "Something went wrong. Please try again." |
| Successful submit | Done-screen shows: *"Thanks for the report — we'll review it within 24 hours. The other person won't be notified."* — same copy on web and mobile. |
| `role` prop values | Both `ChatWindow`/`ChatView` use `role === "poster"` for employers (not `"employer"`) — the report-target resolution logic must branch on the same value already used for name resolution, not introduce a new convention. |
| Web kebab menu interaction | Must close on outside click, mirroring `Navbar.jsx`'s existing `menuRef` + `mousedown`-listener pattern, so it doesn't stay stuck open. |

## Verification

```bash
# gig-app
npm run lint
npm test        # vitest run — no new test files added; repo has zero existing
                 # src/ tests today despite vitest being configured, so this
                 # feature follows that same convention rather than introducing one.

# first-gig-mobile
npm run lint
npm test        # jest --passWithNoTests — same rationale as above.
```

No new automated test files are part of this spec (matches current repo convention on both sides — `npm test` exists but nothing under `src/` uses it yet). Verification is lint + the manual walkthrough below.

**Manual end-to-end check** (apply the migration first, in the Supabase SQL editor, against the shared project):

1. Log in as a seeker who has an open conversation with an employer (web: `npm run dev`, or mobile: `npm start` in `first-gig-mobile`). Open Messages → open that conversation.
2. Click/tap the new "⋮" button in the conversation header → "🚩 Report user" → select "Harassment or bullying" → optionally type details → Submit. Expect the success screen with the privacy-reassurance copy.
3. In the Supabase table editor, confirm a new `user_reports` row: `reporter_id` = the seeker's auth id, `reported_user_id` = the employer's auth id, `reason = 'harassment'`, `status = 'pending'`.
4. Repeat step 2 against the same employer. Expect the error message "You've already reported this user." and no second row in the table.
5. Log in as the employer. Go to the Applicants tab for a job with at least one applicant. Click the new "🚩 Report" button on an applicant row → submit with reason "Scam or fraud". Expect success, then confirm a `user_reports` row with `reporter_id` = employer's auth id, `reported_user_id` = that seeker's auth id.
6. Repeat steps 2–5 in the other client (if you started on web, repeat on the Expo app, or vice versa) to confirm both platforms behave identically against the same shared table.
7. From the browser console (or any authenticated client), attempt `supabase.from('user_reports').select('*')` — confirm it returns no rows / a permissions error, verifying the write-only RLS policy actually blocks reads.
