# Test cases — Layout, overlay and feedback components

| Field        | Value                  |
| ------------ | ---------------------- |
| Issue        | #69 (part of #66)      |
| SRS          | NFR-14, NFR-06, NFR-07 |
| Area         | ui                     |
| Last updated | 2026-10-11 (by #69)    |

## Test data

None. Stories use the sample strings in `packages/ui/src/sample-text.ts`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                              | Priority | Preconditions    | Steps                                                   | Expected result                                                                      | Automated by                              | dev | staging |
| ----------- | -------------------------------------------------- | -------- | ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- | --- | ------- |
| TC-UI-69-01 | Display and state components render with tokens    | High     | Repo checked out | Run `pnpm --filter @tafsila/ui test`                    | Card, Badge, Avatar, Skeleton, Spinner, EmptyState, ErrorState, PageHeader pass      | `packages/ui/src/feedback.test.tsx`       | ⬜  | ⬜      |
| TC-UI-69-02 | ErrorState shows "Try again" only with a handler   | High     | Repo checked out | Run `pnpm --filter @tafsila/ui test`                    | Button present with a handler, absent without; root is `role="alert"`                | `packages/ui/src/feedback.test.tsx`       | ⬜  | ⬜      |
| TC-UI-69-03 | Dialog, Sheet, Tabs, Table, AppShell, Toast        | High     | Repo checked out | Run `pnpm --filter @tafsila/ui test`                    | Tab list named, table caption and headers, banner above header, sheet uses start/end | `packages/ui/src/overlay-layout.test.tsx` | ⬜  | ⬜      |
| TC-UI-69-04 | Every new story matches its snapshot in 4 modes    | High     | Chromium present | Run `pnpm --filter @tafsila/ui test:visual`             | RTL/LTR at mobile and desktop all match                                              | `packages/ui/e2e/stories.spec.ts`         | ⬜  | ⬜      |
| TC-UI-69-05 | Sheet opens from the start edge and mirrors in RTL | Medium   | Storybook open   | Open Overlays / Sheet start, switch Direction           | Panel on the right in Arabic, on the left in English                                 | Manual                                    | ⬜  | ⬜      |
| TC-UI-69-06 | Dialog traps focus and closes on Escape            | High     | Storybook open   | Open a dialog with a trigger, press Tab repeatedly, Esc | Focus stays inside; Escape closes and focus returns to the trigger                   | Manual                                    | ⬜  | ⬜      |
| TC-UI-69-07 | AppShell works at mobile and desktop widths        | Medium   | Storybook open   | Open Layout / Shell, switch Width                       | Navigation is a strip on mobile and a side column on desktop; banner on top          | Manual                                    | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
