# M1 - Accounts & data

## Goal

A user signs up, verifies a phone number, and saves a client with measurements. Data is protected by RLS.

## Scope

In: email and Google sign-in, password reset, phone OTP (test numbers) with one free trial per phone, account settings and delete account, DB schema with RLS and seed users, clients and measurement sets API, clients and measurement screens with the illustrated guide, standard sizes S-XXL with override, measurement validation, Egyptian size chart, mini admin (users list and size-chart editor), code generators, end-to-end exit check.
Out: ease preference (moved to M3, ADR-024), production OTP provider (decided at M8), billing and credits (M7), pattern generation.

## SRS IDs

FR-AUTH-01..05, FR-MEAS-01..05, FR-ADM-02 (size charts only), FR-BILL-02 trial flag only. Data model in SRS §7.

## Deliverables

- Migration with `profiles`, `clients`, `measurement_sets`, `size_charts`, RLS tests and seed users.
- Auth screens in Arabic RTL; OTP verified with the local and staging test numbers.
- Standard sizes S-XXL (ADR-024); anyone outside uses custom measurements; the chart is editable in the mini admin.
- Measurement form with guide and validation warnings; clients list and profile.

## Exit criteria

A user signs up, verifies phone, saves a client with measurements; RLS tests pass (SRS §12).

## Dependencies

M0 staging (#19) and local Supabase (#18) are closed. Inside M1: #23 spike then #24 schema, then #25, #26, #27, #29; #28 is independent; #30, #31 need #29; #32 needs #24; #34 needs all of them.

## Merna's tasks

- Compile the Egyptian size chart values S-XXL (SRS §13 item 4).
- Review the Arabic text of the measurement guide.
- Approve plans and PRs.

## Risks

- RLS mistakes leak client data: every table gets a permission test for another user's data.
- Size-chart values are founder-supplied; seed placeholders are marked as such until she provides them.
- Drizzle vs supabase-js (#23) is decided (ADR-032): Drizzle through `withUser`; #24 adds `DATABASE_URL`, the API login role and the first repository from the tutorial pattern.

## Issues

| Issue | Title                                                  | Wave |
| ----- | ------------------------------------------------------ | ---- |
| #23   | Spike: Drizzle vs supabase-js (confirm ADR-012)        | 1    |
| #24   | M1 schema with RLS and seed users                      | 1    |
| #28   | Measurement validation, standard sizes, size+override  | 1    |
| #33   | Code generators (endpoint, feature, garment module)    | 1    |
| #25   | Sign up / sign in, Google, reset, sign out             | 2    |
| #26   | Phone OTP + one free trial per phone                   | 2    |
| #27   | Settings (language, units) and delete account          | 2    |
| #29   | Clients and measurement sets API                       | 2    |
| #30   | Clients list and profile screens                       | 3    |
| #31   | Measurement form with size picker, overrides and guide | 3    |
| #32   | Mini admin: users list and size-chart editor           | 3    |
| #34   | End-to-end exit check                                  | 4    |
