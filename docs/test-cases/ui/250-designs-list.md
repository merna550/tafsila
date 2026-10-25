# Test cases - Designs list and New pattern entry points

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #250                           |
| SRS          | FR-DES-08                      |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #250) |

## Test data

A user with two clients and more than 20 designs (use the seed designs, plus designs created from the category step), one design without a version, and a second user with no designs.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID               | Title                    | Priority | Preconditions              | Steps                                                                                                 | Expected result                                                                                                                                        | Automated by                                              | dev | staging |
| ---------------- | ------------------------ | -------- | -------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --- | ------- |
| TC-DESIGN-250-01 | List and paging          | High     | Signed in, over 20 designs | 1. Open "My designs". 2. Press "Show more".                                                           | Cards show title, type, client, last change, versions and state; the count is in the heading; more cards load.                                         | `designs-components.test.tsx`, `e2e/designs-list.spec.ts` | ⬜  | ⬜      |
| TC-DESIGN-250-02 | Empty state              | High     | A user with no designs     | 1. Open "My designs".                                                                                 | "No designs yet" with the "Create your first pattern" button, no search box; the button opens the type step.                                           | `e2e/designs-list.spec.ts`                                | ⬜  | ⬜      |
| TC-DESIGN-250-03 | Search and client filter | High     | Designs for two clients    | 1. Type part of a title. 2. Clear it. 3. Choose a client. 4. Choose "All clients".                    | The list narrows after a short pause; the address holds `?clientId=` while a client is chosen; "No results" with "Clear filters" when nothing matches. | `designs-components.test.tsx`                             | ⬜  | ⬜      |
| TC-DESIGN-250-04 | Delete with confirmation | High     | At least one design        | 1. Press "Delete" on a card. 2. Cancel. 3. Press "Delete" again and confirm.                          | Cancel keeps the design; confirm shows "Design deleted" and the card goes. A failure shows the error toast.                                            | `e2e/designs-list.spec.ts`                                | ⬜  | ⬜      |
| TC-DESIGN-250-05 | New pattern from clients | High     | A client                   | 1. On the clients page press "New pattern" on her row. 2. On her profile press "New pattern for her". | Both open the type step with her chip ("For: name"); the profile lists her latest 5 designs and "See all" opens the filtered list.                     | `clients` component tests, `e2e/designs-list.spec.ts`     | ⬜  | ⬜      |
| TC-DESIGN-250-06 | Design without a version | Medium   | A design never saved       | 1. Open "My designs".                                                                                 | The card says "No version" and "No pattern"; it opens the editor.                                                                                      | `entities/design/design.test.tsx`                         | ⬜  | ⬜      |
| TC-DESIGN-250-07 | Another user's designs   | High     | Two users                  | 1. Sign in as the second user.                                                                        | Only that user's designs are listed; a foreign `?clientId=` shows no results.                                                                          | API integration (#242)                                    | ⬜  | ⬜      |
| TC-DESIGN-250-08 | RTL and 360 px           | Medium   | Arabic and English         | 1. Open the list at 360 px width in both languages.                                                   | One column, no sideways scroll, filters stack, buttons at least 44 px, text and arrows follow the direction; matches the approved screen.              | manual only (visual baselines: #265)                      | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
