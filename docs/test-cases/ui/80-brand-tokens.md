# Test cases — Approved brand tokens

| Field        | Value                  |
| ------------ | ---------------------- |
| Issue        | #80                    |
| SRS          | NFR-14, NFR-06, NFR-07 |
| Area         | ui                     |
| Last updated | 2026-10-11 (by #80)    |

## Test data

`docs/design-system/tokens.json` (the brand source).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                        | Priority | Preconditions    | Steps                                             | Expected result                                                | Automated by                              | dev | staging |
| ----------- | -------------------------------------------- | -------- | ---------------- | ------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- | --- | ------- |
| TC-UI-80-01 | tokens.css matches the brand source          | High     | Repo checked out | Run `pnpm tokens` twice, then `pnpm tokens:check` | No diff; hand-editing the generated block makes the check fail | `scripts/gen-tokens.test.mjs`             | ⬜  | ⬜      |
| TC-UI-80-02 | Every allowed text pair has enough contrast  | High     | Repo checked out | Run `pnpm test:docs`                              | Text pairs at least 4.5:1; control borders and focus ring 3:1  | `scripts/design-tokens-contrast.test.mjs` | ⬜  | ⬜      |
| TC-UI-80-03 | Secondary button is outlined                 | Medium   | Repo checked out | Run `pnpm --filter @tafsila/ui test`              | Secondary has `border-border`, `bg-surface`, no grey fill      | `packages/ui/src/button.test.tsx`         | ⬜  | ⬜      |
| TC-UI-80-04 | Stories match the approved look in RTL + LTR | High     | Chromium present | Run `pnpm --filter @tafsila/ui test:visual`       | All snapshots match                                            | `packages/ui/e2e/stories.spec.ts`         | ⬜  | ⬜      |
| TC-UI-80-05 | The app loads IBM Plex Sans Arabic           | Medium   | `pnpm dev:all`   | Open `/`, inspect the body font                   | Computed font is IBM Plex Sans Arabic; body text is 17px       | Manual                                    | ⬜  | ⬜      |
| TC-UI-80-06 | Controls are at least 44px tall              | Medium   | Storybook open   | Inspect Button, Input, Select, Tabs, label rows   | Each tappable row is at least 44px high                        | Manual                                    | ⬜  | ⬜      |
