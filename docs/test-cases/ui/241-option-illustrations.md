# Test cases — Option illustrations

| Field        | Value                             |
| ------------ | --------------------------------- |
| Issue        | #241                              |
| SRS          | FR-DES-05, FR-DES-06              |
| Area         | ui                                |
| Last updated | 2026-10-24 (by PR for issue #241) |

## Test data

None. Run the web app outside production.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                         | Priority | Preconditions         | Steps                                                                     | Expected result                                                   | Automated by                       | dev | staging |
| ------------ | ----------------------------- | -------- | --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------- | --- | ------- |
| TC-UI-241-01 | Every drawing is recognisable | High     | App not in production | 1. Open `/ar/dev/option-illustrations`. 2. Look at each drawing at 64 px. | 60 drawings, each recognisable as its caption, in the text colour | `e2e/option-illustrations.spec.ts` | ⬜  | ⬜      |
| TC-UI-241-02 | Gallery hidden in production  | Medium   | Production build      | 1. Open `/ar/dev/option-illustrations`.                                   | 404 page                                                          | `page.test.tsx`                    | ⬜  | ⬜      |
