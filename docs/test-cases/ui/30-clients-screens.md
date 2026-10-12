# Test cases — Clients list and profile screens

| Field        | Value                            |
| ------------ | -------------------------------- |
| Issue        | #30                              |
| SRS          | FR-MEAS-04                       |
| Area         | ui                               |
| Last updated | 2026-10-12 (by PR for issue #30) |

## Test data

Seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name           | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Empty user     | a new sign-up (no clients)                                                |
| User with data | `pro@tafsila.test` / `Test1234!` (5 clients with a set, later 25 clients) |
| Other user     | `trial@tafsila.test` / `Test1234!`                                        |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                        | Priority | Preconditions             | Steps                                               | Expected result                                                             | Automated by                                  | dev | staging |
| ----------- | ---------------------------- | -------- | ------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- | --- | ------- |
| TC-UI-30-01 | Empty list on first visit    | High     | Empty user                | 1. Open `/clients`                                  | "لا توجد عميلات بعد" with "إضافة أول عميلة"                                 | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-02 | Add a client (name only)     | High     | Signed in                 | 1. New client 2. Type a name 3. Save                | Profile opens; success toast                                                | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-03 | Add a client with notes      | Medium   | Signed in                 | 1. As above with notes                              | Notes show on the profile card                                              | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-04 | Name is required             | High     | Dialog open               | 1. Save with an empty name                          | "اكتب اسم العميلة" under the field; nothing saved                           | `model/client-form.schema.test.ts`            | ⬜  | ⬜      |
| TC-UI-30-05 | Search by part of the name   | High     | User with data            | 1. Type part of a name                              | Only matching clients, after a short pause                                  | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-06 | Search without result        | Medium   | User with data            | 1. Type a word nobody has                           | "لا توجد نتائج" and "مسح البحث" restores the list                           | `components/clients-components.test.tsx`      | ⬜  | ⬜      |
| TC-UI-30-07 | Open a profile from the list | High     | User with data            | 1. Click a row                                      | Profile with name, since date, notes, sets                                  | manual only                                   | ⬜  | ⬜      |
| TC-UI-30-08 | Edit name and notes          | High     | On a profile              | 1. Edit details 2. Change 3. Save                   | Card shows the new values; toast                                            | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-09 | Delete confirmation          | High     | On a profile              | 1. Delete 2. Cancel (kept) 3. Delete again, confirm | Dialog names her and mentions her measurements; confirm returns to the list | `e2e/clients.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-30-10 | Another user's client URL    | High     | Two users                 | 1. Copy a client URL 2. Open it as the other user   | Not-found page, no data                                                     | `packages/api/src/services/clients.test.ts`   | ⬜  | ⬜      |
| TC-UI-30-11 | 25+ clients, "show more"     | Medium   | `pro` user                | 1. Open `/clients` 2. Click "عرض المزيد"            | 20 rows then the rest, no duplicates                                        | manual only                                   | ⬜  | ⬜      |
| TC-UI-30-12 | Meta line forms              | Medium   | Clients with/without sets | 1. Look at rows                                     | "مقاس M · أمس", "مقاسات مخصّصة · …", "لا توجد مقاسات بعد"                   | `components/clients-components.test.tsx`      | ⬜  | ⬜      |
| TC-UI-30-13 | English mode mirrored        | Medium   | -                         | 1. Open `/en/clients`                               | Left to right, chevrons point right, English text                           | manual only                                   | ⬜  | ⬜      |
| TC-UI-30-14 | Mobile 390 px                | Medium   | Phone-size window         | 1. Open list and profile                            | No horizontal scroll, controls at least 44 px                               | manual only                                   | ⬜  | ⬜      |
| TC-UI-30-15 | Signed-out visit             | High     | Signed out                | 1. Open `/clients`                                  | Redirect to sign-in with `next=/clients`                                    | `e2e/clients.spec.ts`, `access-guard.test.ts` | ⬜  | ⬜      |
| TC-UI-30-16 | Measurement links            | Low      | On a profile              | 1. Click "مقاسات جديدة"                             | Not-found page until #31 merges                                             | manual only                                   | ⬜  | ⬜      |
| TC-UI-30-17 | Slow and offline network     | Low      | Throttled network         | 1. Open `/clients` throttled 2. Go offline          | Skeleton while loading; connection banner offline                           | manual only                                   | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
