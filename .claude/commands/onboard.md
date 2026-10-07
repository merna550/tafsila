---
description: Print the reading path for a role and a 30-minute plan
argument-hint: [role]
---

Follow CLAUDE.md. Role: $ARGUMENTS (default `beginner`). Read-only.

1. Open `docs/handbook/START_HERE.md` and pick the section that matches the role:
   `beginner` = section 1, `developer` = 2, `architect` = 3, `sewing` = 4, `agent` = 5. If the role is unclear, show the list of roles and ask which one, once.
2. Print the reading path exactly as in START_HERE (same order, same links, time estimates); do not invent steps.
3. Then print a **30-minute plan**: choose steps from that path that fit in 30 minutes (use the time estimates), add one hands-on step in the repo (for example run `pnpm docs:check`, or open `docs/handbook/map/repo-tour.md` next to the real folders), and finish with "what to read next" (the rest of the path).
4. Check the links exist before printing (`pnpm docs:check` must pass); if START_HERE has changed shape, tell Merna which section to fix.
