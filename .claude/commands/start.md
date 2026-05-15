You have CLAUDE.md loaded. Before doing anything else:

1. Confirm in one sentence what you understand the task to be. If anything is
   ambiguous, ask me ONE clarifying question before proceeding.

2. Enter plan mode. Produce a plan with:
   - Exact files you'll create or modify (full paths)
   - Function/component signatures for anything new
   - How frontend and backend changes connect (API contract, types, etc.)
   - Testing approach
   - Anything you're unsure about, marked explicitly

3. Wait for my response. If I send notes, address them and DO NOT implement yet.
   Re-present the plan. Only implement after I say "go" or "implement."

4. During implementation:
   - Touch only files in the plan. If you find you need another file, stop and
     tell me before editing it.
   - Run lint + typecheck after edits.
   - If a test fails or a type doesn't resolve, fix it before moving on.

5. When done, give me:
   - One-line summary of what changed
   - Any new gotchas to add to CLAUDE.md
   - Suggested commit message

Task: <PASTE TASK HERE>