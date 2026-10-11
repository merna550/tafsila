# Test cases — Local dev auto-sync

| Field        | Value               |
| ------------ | ------------------- |
| Issue        | #95                 |
| SRS          | none (dev tooling)  |
| Area         | infra               |
| Last updated | 2026-10-11 (by #95) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                     | Priority | Preconditions                    | Steps                                                      | Expected result                                                       | Automated by                  | dev | staging |
| -------------- | ------------------------- | -------- | -------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------- | --- | ------- |
| TC-INFRA-95-01 | Pull with lockfile change | High     | Local clone behind main          | 1. `git pull`                                              | "Dependencies changed, running pnpm install…", then `pnpm dev` starts | manual only                   | ⬜  | ⬜      |
| TC-INFRA-95-02 | Branch switch             | Medium   | Two branches with different lock | 1. `git switch other`                                      | Install runs automatically                                            | manual only                   | ⬜  | ⬜      |
| TC-INFRA-95-03 | Missing package           | High     | Clean checkout                   | 1. Delete a package folder in `node_modules` 2. `pnpm dev` | Reinstalled before Next.js starts                                     | `scripts/check-deps.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-95-04 | No change is silent       | Medium   | Up to date                       | 1. `git pull` 2. `pnpm dev`                                | No extra output, no noticeable delay                                  | manual only                   | ⬜  | ⬜      |
| TC-INFRA-95-05 | Root env file             | High     | Filled root `.env.local`         | 1. Delete `apps/web/.env.local` 2. `pnpm dev`              | App starts and reads the root file                                    | manual only                   | ⬜  | ⬜      |
| TC-INFRA-95-06 | Placeholder keys          | High     | Placeholders in `.env.local`     | 1. `pnpm dev`                                              | One message listing key names, no values, no stack                    | `scripts/check-deps.test.mjs` | ⬜  | ⬜      |
| TC-INFRA-95-07 | CI does nothing           | Medium   | `CI=true`                        | 1. `CI=true pnpm dev` or the hooks                         | No install, no env check                                              | manual only                   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
