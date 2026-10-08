# Seed data (dev, preview, staging — never prod)

`supabase/seed.sql` runs automatically on `supabase db reset` (local) and on preview branches; a staging seed job runs on demand. Every new table or feature adds seed rows here in the same PR.

| Account              | Password    | Plan / credits                        | Has data                            |
| -------------------- | ----------- | ------------------------------------- | ----------------------------------- |
| `trial@tafsila.test` | `Test1234!` | Free trial, 3 credits, phone verified | 1 client, 1 design                  |
| `hobby@tafsila.test` | `Test1234!` | Hobby, 8 credits                      | 3 clients, 4 designs with versions  |
| `pro@tafsila.test`   | `Test1234!` | Pro, 30 credits                       | 25 clients, 10 designs, exports     |
| `empty@tafsila.test` | `Test1234!` | Trial, 0 credits, phone NOT verified  | none (paywall + verification tests) |
| `admin@tafsila.test` | `Test1234!` | admin role                            | —                                   |

| Data             | Content                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Size charts      | Egyptian/EU S–XXL                                                                         |
| Measurement sets | Size S, M, L, XL + 3 custom real-body sets                                                |
| Designs          | V-neck half-circle dress, A-line skirt, basic blouse (+ photos in local storage)          |
| Fabrics & rules  | Full catalogue (crepe, chiffon, georgette, satin, linen, poplin, viscose, taffeta, tulle) |
| Products         | All plans and prices (sandbox)                                                            |
