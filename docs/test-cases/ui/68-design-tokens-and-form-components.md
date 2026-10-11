# Test cases — Design tokens, Storybook and form components

| Field        | Value                  |
| ------------ | ---------------------- |
| Issue        | #68 (part of #66)      |
| SRS          | NFR-14, NFR-06, NFR-07 |
| Area         | ui                     |
| Last updated | 2026-10-11 (by #68)    |

## Test data

None. Stories use the sample Arabic and English strings in `packages/ui/src/sample-text.ts`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                           | Priority | Preconditions    | Steps                                                    | Expected result                                                        | Automated by                             | dev | staging |
| ----------- | ----------------------------------------------- | -------- | ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- | --- | ------- |
| TC-UI-68-01 | Tokens file has no raw colour outside itself    | High     | Repo checked out | Run `pnpm tokens:check`                                  | Passes; a raw colour in another CSS file fails                         | `scripts/check-design-tokens.test.mjs`   | ⬜  | ⬜      |
| TC-UI-68-02 | FormField shows the error under the control     | High     | Repo checked out | Run `pnpm --filter @tafsila/ui test`                     | Error is after the input, `role="alert"`, linked by describedby        | `packages/ui/src/form-controls.test.tsx` | ⬜  | ⬜      |
| TC-UI-68-03 | Controls expose roles and 44px targets          | High     | Repo checked out | Run `pnpm --filter @tafsila/ui test`                     | checkbox, radio, switch, combobox roles; buttons `min-h-11`            | `packages/ui/src/*.test.tsx`             | ⬜  | ⬜      |
| TC-UI-68-04 | Storybook builds                                | High     | Repo checked out | Run `pnpm --filter @tafsila/ui build-storybook`          | `storybook-static` is produced                                         | CI job `storybook`                       | ⬜  | ⬜      |
| TC-UI-68-05 | Every story matches its snapshot in 4 modes     | High     | Chromium present | Run `pnpm --filter @tafsila/ui test:visual`              | RTL/LTR at mobile and desktop all match; a changed token makes it fail | `packages/ui/e2e/stories.spec.ts`        | ⬜  | ⬜      |
| TC-UI-68-06 | Stories look right by eye in RTL                | Medium   | Storybook open   | Run `pnpm --filter @tafsila/ui storybook`, set Direction | Labels start on the right, switch thumb slides to the left when on     | Manual                                   | ⬜  | ⬜      |
| TC-UI-68-07 | Select opens and is keyboard operable in Arabic | Medium   | Storybook open   | Open Forms / Text fields / Dropdown, press Space, arrows | List opens under the field, arrows move, Enter picks                   | Manual                                   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
