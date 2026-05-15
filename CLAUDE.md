## Project
GigSpark is a mobile-first job marketplace connecting teen/young job seekers with local employers. Seekers build a profile through a guided onboarding flow and apply to posted gigs. Employers post jobs, review applicants, and initiate chat. There is no admin panel; the MVP is entirely client-side backed by Supabase.

## Stack
- **Frontend**: React 18 + Vite 5, pure CSS (no component library), DM Sans font
- **Backend**: None — Supabase handles auth, database (PostgreSQL), and Realtime
- **Supabase client**: `@supabase/supabase-js` ^2 (`src/lib/supabase.js`)
- **Deployment**: GitHub Pages via `gh-pages`, CI via `.github/workflows/`
- **Package manager**: npm
- **Node**: 20 (pinned in CI)

## Architecture
- **No router** — view switching is a single `authView` state enum in `App.jsx`: `loading | home | login | onboarding | dashboard`
- **Role routing**: `profiles` table stores `seeker | poster` per auth user; fetched immediately after login via `fetchRole()` which **must be awaited** before `setAuthView("dashboard")` or the dashboard renders blank
- **Profile data split**: `profiles` (role only) → `seekers` or `employers` (all other data)
- **Onboarding state**: entire multi-step form lives in `App.jsx` as `seeker` / `poster` objects; step IDs are string arrays in `src/constants/steps.js`
- **Data access**: all reads/writes go through thin wrappers in `src/lib/` (`applications.js`, `chat.js`); RLS on every table — no server API layer
- **Realtime**: Supabase `postgres_changes` subscriptions for messages and applications; `subscribeToConversationUpdates()` requires a unique `tag` string per caller to avoid channel name conflicts (crash if two components share the same channel name)
- **SQL migrations**: `.sql` files in `src/lib/` (schema, chat, applications) — run manually in Supabase SQL editor; no migration runner
- **CSS split**: onboarding styles injected as a JS string (`src/styles/styles.js`), homepage in `src/styles/homepage.css`, dashboards in `src/styles/dashboard.css`
- **Responsive breakpoints**: `≤900px` hides sidebar; `≤768px` shows bottom tab nav instead

## Commands
```bash
npm install          # install deps
npm run dev          # dev server → http://localhost:5173
npm run build        # production build → dist/
npm run deploy       # build + push dist/ to gh-pages branch
```
No test, lint, or typecheck commands exist yet.

## Conventions
- **Files**: PascalCase components (`StepName.jsx`), camelCase lib/constants (`applications.js`, `steps.js`)
- **Structure**: `src/components/<domain>/`, `src/pages/`, `src/lib/`, `src/constants/`, `src/styles/`
- **Onboarding steps**: string IDs matched with `if (currentStep === "name")` in `App.jsx` — add new steps to both `steps.js` array and the JSX render block
- **Supabase wrappers**: each lib function is async, throws on error (callers catch), returns data directly (not the raw Supabase response object)
- **Realtime cleanup**: every `subscribe*` function returns an unsubscribe fn; always call it in `useEffect` cleanup
- **Mobile messages**: `has-active` CSS class on `.dash-messages-layout` toggles between convo list and chat panel; `activeConvo` state drives this in both dashboard components
- **Employer-initiated chat only**: RLS on `conversations` only allows employers to INSERT; seekers cannot start conversations

## Gotchas
<!-- Add lessons here as they come up -->

## Workflow rules
- Default to plan mode for any change touching >2 files. Wait for my approval before implementing.
- Never push to main, never run destructive db commands without confirmation.
- Run lint + typecheck after edits; fix what you broke before declaring done.
- If you correct yourself twice on the same issue, stop and ask me.
