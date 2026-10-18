# Plan: cloud sessions run the same checks as CI (#182)

No separate plan (`plan:none`); the issue is the plan.

- `scripts/agent-setup.sh`: check Node against `engines`; fetch matching Node 22 from nodejs.org when too old; fail with the one-line fix; remove the `engine-strict=false` retry.
- `.claude/procedures/build.md` step 4: run `pnpm quality && pnpm test` as written; `BLOCKED: environment` on Node mismatch.
- Docs: cloud tutorial (setup script steps for Merna), handbook troubleshooting.

## Deviations

None.
