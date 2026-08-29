# User Blocking

## Goal

A seeker or employer can block the person on the other end of a conversation,
from the chat header or (employer only) the applicant list, after a one-step
confirmation. Once blocked: neither side can send new messages in that
conversation, the seeker can no longer apply to that employer's jobs (and the
employer's active listings drop out of the seeker's job browse), and the
existing conversation/application relationship disappears from **the
blocker's** views only — the blocked party's own view is unaffected and they
are never told they were blocked. Existing applications/messages are left
alone in the database; only what's fetched going forward is filtered. Both
sides get a "Blocked" management list (in Profile/Settings) showing everyone
they've blocked, with an Unblock button that immediately restores visibility
and messaging/applying. This is additive to the existing user-reporting
feature (`specs/user-reporting.md`), not a replacement — Report stays a
moderation-queue signal with no automatic effect; Block is the self-service
tool that actually changes what the two users can do to each other, and
spans both `first-gig-web` and the sibling `first-gig-mobile` repo the same
way user-reporting did.

## Out of scope

- Any admin/moderation UI for blocks — enforcement is pure RLS + client
  filtering, no review queue (unlike reports, blocks don't need one).
- Changing the status of an existing application/conversation on block — rows
  are left exactly as they are, only hidden from future fetches for the
  blocker.
- Notifying the blocked user, in any form.
- Blocking a user with no prior conversation or application relationship
  (cold block by id) — blocked by RLS, mirrors `user_reports`.
- Any change to the existing `user_reports`/`ReportUserModal` flow — block is
  additive, added as a second menu item / button next to Report.
- Preventing a blocked seeker from being *read* by the employer (or vice
  versa) at the database level — only the pre-existing participant-read
  policies are relied on; no new read grant is added since hiding is done
  client-side, not via RLS (see the note under Files and interfaces).
- Automated tests — no new test files, matches this repo's and
  `first-gig-mobile`'s current convention (`npm test` / `jest --passWithNoTests`
  exist but nothing under `src/` uses them yet, per `specs/user-reporting.md`
  and confirmed in both `package.json`s).

## Files and interfaces

### Schema (canonical source: `first-gig-mobile/supabase/migrations/`)

New file: `first-gig-mobile/supabase/migrations/20260828c_blocked_users.sql`

```sql
create table if not exists blocked_users (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create unique index if not exists blocked_users_unique_pair
  on blocked_users (blocker_id, blocked_id);

alter table blocked_users enable row level security;

-- Insert-only relationship gate, same shape as user_reports' check.
create policy "Users can block a related user"
  on blocked_users for insert
  to authenticated
  with check (
    blocker_id = auth.uid()
    and blocker_id <> blocked_id
    and (
      exists (
        select 1 from public.conversations
        where (seeker_id = blocker_id and employer_id = blocked_id)
           or (employer_id = blocker_id and seeker_id = blocked_id)
      )
      or exists (
        select 1 from public.applications
        where (seeker_id = blocker_id and employer_id = blocked_id)
           or (employer_id = blocker_id and seeker_id = blocked_id)
      )
    )
  );

-- A blocker can see and remove their own blocks (powers the "Blocked" list + Unblock).
create policy "Users can view their own blocks"
  on blocked_users for select
  using (blocker_id = auth.uid());

create policy "Users can unblock"
  on blocked_users for delete
  using (blocker_id = auth.uid());

-- Security boundary: block new messages in both directions once either side
-- has blocked the other. Deliberately does NOT touch conversations' own SELECT
-- policy (see note below) — it only reads conversations to resolve the other
-- participant, which stays fully visible to both existing participants.
create policy "Blocked participants cannot message each other"
  on public.messages as restrictive for insert
  with check (
    not exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and exists (
          select 1 from blocked_users b
          where (b.blocker_id = c.seeker_id and b.blocked_id = c.employer_id)
             or (b.blocker_id = c.employer_id and b.blocked_id = c.seeker_id)
        )
    )
  );

-- Security boundary: block new applications in both directions.
create policy "Blocked pairs cannot create new applications"
  on public.applications as restrictive for insert
  with check (
    not exists (
      select 1 from blocked_users
      where (blocker_id = applications.seeker_id and blocked_id = applications.employer_id)
         or (blocker_id = applications.employer_id and blocked_id = applications.seeker_id)
    )
  );
```

**Why not RLS for hiding (avoids a footgun):** an earlier draft of this
migration also added a `restrictive` SELECT policy to `conversations` (and
`applications`, and `jobs`) to hide blocked pairs at the database level.
That's wrong: Postgres RLS applies even to subqueries inside *other* tables'
policies, so once `conversations` hides a blocked pair from the blocker, the
`employers`/`seekers` participant-read policies (which subquery
`conversations`/`applications` to decide if you can read the other party's
row) silently stop resolving for that exact pair too — breaking the name
lookup the "Blocked" list itself needs, in a way that's easy to miss in
testing. Hiding is therefore a *display* concern handled in the JS lib layer
below, not a security boundary — it doesn't need to be one, since the real
guarantee ("can't message/apply") is already enforced by the two restrictive
policies above, which only touch `blocked_users` and (for messages) the
untouched `conversations` table.

### Web (`first-gig-web`)

- **`src/lib/blocks.js`** (new) — thin wrapper, same convention as
  `src/lib/reports.js`:
  ```js
  export async function blockUser(blockedUserId, blockerId)          // insert; 23505 -> "You've already blocked this user."
  export async function unblockUser(blockedUserId, blockerId)        // delete where blocker_id/blocked_id match
  export async function fetchBlockedIds(blockerId)                  // -> string[] of blocked_id, for filtering
  export async function fetchBlockedUsers(blockerId, blockerRole)    // -> [{ id, blocked_id, created_at, name }], role picks seekers|employers lookup table
  ```
- **`src/lib/chat.js`** — `fetchConversations(userId, role)`: after the
  existing query, call `fetchBlockedIds(userId)` and filter out rows where
  the other participant's id (`c.employers?.id` for seekers, `c.seekers?.id`
  for employers) is in that list, before returning. No change to
  `fetchConversationById`, `sendMessage`, or the realtime subscriptions.
- **`src/lib/applications.js`** — `fetchSeekerApplications(seekerId)`: filter
  out rows whose `employers.id` is blocked. `fetchEmployerApplicants(employerId)`:
  filter out rows whose `seekers.id` is blocked. Both call `fetchBlockedIds`
  from `blocks.js` the same way `fetchConversations` does.
- **`src/pages/HomePage.jsx`** — the inline job fetch (lines 34-49): add `id`
  to the existing `employers(company_name)` embed (`employers(id, company_name)`),
  and when `user` is present, fetch `fetchBlockedIds(user.id)` and filter
  `data` before `setJobs(data)`. No filtering when logged out (anon browsing
  is unaffected — there's no blocker to filter for).
- **`src/components/shared/BlockUserModal.jsx`** (new) — confirm-step modal,
  same visual family as `ReportUserModal.jsx` but simpler (no reason list).
  Props: `{ blockedName, onClose, onConfirm }`. Body: *"Block {blockedName}?
  They won't be notified, and you won't see this conversation anymore."* with
  Cancel / "🚫 Block" buttons. `onConfirm` is async; on failure shows an
  inline error and stays open (mirrors `ReportUserModal`'s `error` state); on
  success just calls `onClose()` — the caller owns any follow-up UI change.
- **`src/components/chat/ChatWindow.jsx`** — add a second item "🚫 Block user"
  to the existing `dash-chat-menu-dropdown` (below "🚩 Report user"), same
  `disabled={!otherId}` guard. Owns `blockOpen` state, renders
  `BlockUserModal` on demand with
  `onConfirm={() => blockUser(otherId, userId).then(() => onBlocked?.())}`.
  New optional prop `onBlocked` (called after a successful block, no args) —
  the parent uses it to clear `activeConvo` and force `ConversationList` to
  refetch.
- **`src/pages/SeekerDashboard.jsx`** — in the `"messages"` tab: add
  `const [convoRefreshKey, setConvoRefreshKey] = useState(0)`, pass
  `key={convoRefreshKey}` to `<ConversationList>`, and pass
  `onBlocked={() => { setActiveConvo(null); setConvoRefreshKey(k => k + 1); }}`
  to `<ChatWindow>`. In the `"profile"` tab (view mode), add a "Blocked
  Employers" section below Experience: fetch
  `fetchBlockedUsers(user.id, "seeker")` on mount into local state, render
  each as a `dash-list-item`-style row with an "Unblock" button calling
  `unblockUser(b.blocked_id, user.id)` then removing it from local state.
- **`src/pages/EmployerDashboard.jsx`** — same `convoRefreshKey`/`onBlocked`
  wiring in the `"messages"` tab. In the `"applicants"` tab, add a "🚫 Block"
  button next to the existing "🚩 Report" button (same stacked-button column,
  ~line 449); owns `blockTarget` state (`{ id, name } | null`, sibling to
  `reportTarget`), renders `BlockUserModal` with
  `onConfirm={() => blockUser(blockTarget.id, user.id).then(() => setApplicants(prev => prev.filter(a => a.seeker_id !== blockTarget.id)))}`.
  In the `"settings"` tab, add a "Blocked Applicants" section below the
  company-info list, same fetch/unblock pattern as the seeker side but with
  `fetchBlockedUsers(user.id, "poster")`.
- **`src/styles/dashboard.css`** — new rules for the block confirm modal
  (`.block-user-backdrop`/`.block-user-modal`/etc., copy the `.report-user-*`
  shape from `homepage.css` but drop the reason list) and the "🚫 Block"
  button (reuse the same red/danger palette already used for
  `.dash-chat-menu-item--danger` and the applicant-row report button).

### Mobile (`first-gig-mobile`)

- **`src/lib/blocks.js`** (new) — identical exports/bodies to the web version.
- **`src/lib/chat.js`** — same `fetchConversations` filtering change as web.
- **`src/lib/applications.js`** — same filtering change to
  `fetchSeekerApplications`/`fetchEmployerApplicants` as web.
- **`src/lib/jobs.js`** — `fetchJobs(userId)`: add `id` to the existing
  `employers(company_name)` embed, accept an optional `userId`, and when
  present filter out jobs whose `employers.id` is in `fetchBlockedIds(userId)`.
- **`src/screens/seeker/tabs/BrowseTab.jsx`** — already receives `userId` as
  a prop (line 50); pass it through to `fetchJobs(userId)` at its call site.
- **`src/components/chat/BlockUserSheet.jsx`** (new) — bottom-sheet confirm,
  mirrors `ReportUserSheet.jsx`'s structure/styling (`COLORS`/`RADIUS` tokens,
  `Modal` + backdrop). Props: `{ visible, blockedName, onClose, onConfirm }`,
  same copy/behavior as the web modal.
- **`src/components/chat/ChatView.jsx`** — add a second `TouchableOpacity`
  "🚫 Block user" to the existing header options `Modal`/`menuSheet` (below
  "🚩 Report user"), same `!otherId` disabled guard. New prop `onBlock(otherId,
  otherName)` (mirrors the existing `onReport` prop exactly).
- **`src/screens/seeker/tabs/MessagesTab.jsx`** /
  **`src/screens/employer/tabs/EmployerMessagesTab.jsx`** — add
  `blockTarget`/`convoRefreshKey` state (siblings to the existing
  `reportTarget`), pass `key={convoRefreshKey}` to `<ConversationList>` and
  `onBlock={(id, name) => setBlockTarget({ id, name })}` to `<ChatView>`,
  render `<BlockUserSheet visible={!!blockTarget} ... onConfirm={...}>` that
  calls `blockUser`, then `setActiveConvo(null)` +
  `setConvoRefreshKey(k => k + 1)`.
- **`src/screens/employer/tabs/EmployerApplicantsTab.jsx`** — add a "🚫 Block"
  `TouchableOpacity` next to the existing "🚩 Report" button in `cardActions`.
  New prop `onBlock(seekerId, name)` (mirrors how `reportTarget` is currently
  local-only, but block needs to reach the parent's `applicants` state, so
  this one is lifted — see below).
- **`src/screens/employer/EmployerDashboardScreen.jsx`** — add
  `handleBlock = async (seekerId) => { await blockUser(seekerId, userId); setApplicants(prev => prev.filter(a => a.seeker_id !== seekerId)); }`
  (sibling to the existing `handleStatusChange`), pass as `onBlock` to
  `<EmployerApplicantsTab>`. `EmployerApplicantsTab` owns the confirm-sheet
  UI state itself and calls `onBlock` only after the user confirms.
- **`src/screens/seeker/tabs/ProfileTab.jsx`** — add a "Blocked Employers"
  section (same fetch-on-mount + Unblock pattern as web), placed after the
  existing profile `Row`-based sections.
- **`src/screens/employer/tabs/EmployerSettingsTab.jsx`** — add a "Blocked
  Applicants" section, same pattern, using `fetchBlockedUsers(userId, "poster")`.

## Edge cases

| Case | Expected behavior |
|---|---|
| Block with no prior conversation/application | Blocked by RLS `with check`; unreachable via normal UI since the button only ever appears next to an existing relationship. |
| Block the same user twice | Second insert hits `blocked_users_unique_pair` (23505); `blockUser()` throws `"You've already blocked this user."` — defensive only, since a blocked user's row/conversation is already filtered out of the UI that would offer the button again. |
| Self-block | Blocked by `blocker_id <> blocked_id`; unreachable via UI (target is always the other party). |
| Employer blocks a seeker | Seeker's existing application(s) to that employer disappear from the employer's Applicants tab and the conversation disappears from the employer's Messages list — both going forward only, row/status untouched in the DB. The seeker's own Applications/Messages views are unaffected (block is silent) but they can no longer send new messages in that conversation or apply to that employer's other jobs, and that employer's active listings drop out of their job browse. |
| Seeker blocks an employer | Symmetric to the above with roles swapped. |
| Blockee tries to send a message after being blocked | `messages` insert is denied by the restrictive RLS policy; `ChatWindow`/`ChatView`'s existing `catch` block (`console.error` + restore the typed text, no user-facing error) already handles this silently — no new UI needed, and this doubles as "block is silent" for the blockee. |
| Blockee tries to reach a "Message" button for a blocked seeker | Never appears — the blocked seeker's application row is filtered out of `fetchEmployerApplicants` entirely, so there's no row to click Message from. |
| Stale UI: seeker has a job's detail view open for an employer they just blocked (via chat, in another tab) | `jobs` table itself is unrestricted (still public `using (true)`); clicking Apply hits the new restrictive `applications` insert policy and `applyToJob` throws a plain Postgres RLS error (not `23505`) — falls through to whatever generic failure handling the Apply button already has today; not special-cased. |
| Unblock | Immediately restores visibility (next fetch of conversations/applications/jobs is unfiltered for that pair) and re-enables messaging/applying (restrictive policies re-evaluate live against current `blocked_users` rows). |
| Reporting a user after blocking them | No longer reachable — blocking removes the chat/applicant row that the Report entry points live on. Accepted: blocking already achieves the same protective outcome reporting would have led to. |
| `fetchBlockedUsers` target row missing (e.g. deleted account) | Name falls back to `"Applicant"`/`"Employer"`, matching the existing fallback convention in `ChatWindow`/`ConversationList`. |
| Confirm modal / sheet failure (network error, RLS edge case) | Inline generic error message, modal stays open for retry — same shape as `ReportUserModal`'s error handling. |
| `role`/`onBlock` prop naming | Mirrors the existing `onReport` prop and `role === "poster"` convention already used for report — no new naming pattern introduced. |

## Verification

```bash
# first-gig-web
npm run lint
npm test        # vitest run — no new test files, matches existing convention

# first-gig-mobile
npm run lint
npm test        # jest --passWithNoTests — same rationale
```

**Manual end-to-end check** (apply `20260828c_blocked_users.sql` in the
Supabase SQL editor against the shared project first):

1. Log in as an employer with at least one job and one applicant who has an
   open conversation. Open Messages → open that conversation → "⋮" → "🚫 Block
   user" → confirm. Expect: chat panel closes, the conversation is gone from
   the Messages list.
2. Go to Applicants tab: confirm that seeker's application row is also gone.
3. Go to the seeker's job browse (as that seeker, in a second browser/session):
   confirm this employer's job listings no longer appear.
4. As the seeker, try to open the employer's job directly (e.g. via a
   previously-open tab or bookmarked URL) and click Apply: expect it to fail
   silently/generically (no special message), not succeed.
5. As the seeker, confirm their own Applications tab *still* shows the old
   application to that employer (block was employer-initiated; seeker's view
   is unaffected) — but if they had an open conversation, trying to send a
   new message produces no visible effect (message doesn't appear, no error
   shown).
6. As the employer, go to Settings → Blocked Applicants: confirm the seeker
   appears with an Unblock button. Click Unblock.
7. Refresh the Applicants and Messages tabs: confirm the applicant and
   conversation reappear, and messaging/applying work again.
8. Repeat steps 1–7 with the seeker as the blocker (block via chat only, no
   applicant-list entry point on that side) to confirm the symmetric path.
9. Repeat the whole flow once on `first-gig-mobile` (`npm start`) to confirm
   parity with web against the same shared Supabase project.
