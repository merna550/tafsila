# Seed data (dev, preview, staging — never prod)

`supabase/seed.sql` runs automatically on `supabase db reset` (local) and on preview branches; a staging seed job runs on demand. Every new table or feature adds seed rows here in the same PR.

| Account              | Password    | Plan / credits                        | Has data                                                                           |
| -------------------- | ----------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| `trial@tafsila.test` | `Test1234!` | Free trial, 3 credits, phone verified | 1 client with 1 measurement set (now), 1 design                                    |
| `hobby@tafsila.test` | `Test1234!` | Hobby, 8 credits                      | 3 clients, 4 designs with versions                                                 |
| `pro@tafsila.test`   | `Test1234!` | Pro, 30 credits                       | 5 clients with a measurement set each (now), later 25 clients, 10 designs, exports |
| `empty@tafsila.test` | `Test1234!` | Trial, 0 credits, phone NOT verified  | none (paywall + verification tests)                                                |
| `admin@tafsila.test` | `Test1234!` | admin role                            | —                                                                                  |

Today (issue #24) the seed creates the four accounts with their profiles, the demo data below marked "now", and sets the phone and role of the profiles directly (users cannot change them). The plan, credits and design columns arrive in later milestones; until then they are documentation only. Seed phone numbers are `+20100000000n` (trial 1, pro 2, admin 4); their keyed hashes are in `trial_phones` (computed with the local `PHONE_HASH_SECRET` from `.env.example`). `empty@tafsila.test` verifies with `+201000000003` (code `123456`); `+201000000005` to `07` are for e2e, `08` and `09` for manual tests.

| Data             | Content                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Size charts      | now: one system chart `PLACEHOLDER Egyptian/EU S-XXL (demo values)` (size M scaled by 0.95 to 1.15; real values come from #32). Egyptian/EU S–XXL |
| Measurement sets | Size S, M, L, XL + 3 custom real-body sets                                                                                                        |
| Designs          | V-neck half-circle dress, A-line skirt, basic blouse (+ photos in local storage)                                                                  |
| Fabrics & rules  | Full catalogue (crepe, chiffon, georgette, satin, linen, poplin, viscose, taffeta, tulle)                                                         |
| Products         | All plans and prices (sandbox)                                                                                                                    |

## Account deletion tests (issue #27)

No seed user is ever deleted. The tests that delete accounts create a throwaway user themselves and remove it, so nothing is seeded for them.
