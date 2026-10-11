# Test cases — Sign up, sign in, reset and sign out

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #25 (part C)               |
| SRS          | FR-AUTH-01, FR-AUTH-04     |
| Area         | ui                         |
| Last updated | 2026-10-11 (by PR for #25) |

## Test data

Create a fresh account with your own email for each run (staging: only project team members receive mail, about 2 per hour). Locally the mails are in the mail catcher at `http://127.0.0.1:54324`. Seeded accounts (`trial@tafsila.test`, password `Test1234!`) can sign in directly.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                    | Priority | Preconditions                 | Steps                                                                      | Expected result                                                                     | Automated by                                   | dev | staging |
| ------------- | ---------------------------------------- | -------- | ----------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- | --- | ------- |
| TC-AUTH-25-01 | Sign up with email (Arabic)              | High     | Signed out                    | Open `/sign-up`, enter email and a password of 8+ characters twice         | "تحقق من البريد الإلكتروني" notice; same notice for an address that already exists  | `e2e/auth.spec.ts` (account flow)              | ⬜  | ⬜      |
| TC-AUTH-25-02 | Confirmation link signs in               | High     | Mail from 01                  | Open the link in the mail                                                  | `/dashboard`, welcome toast, `signup_completed` fired once                          | `e2e/auth.spec.ts`, `auth-redirects.test.ts`   | ⬜  | ⬜      |
| TC-AUTH-25-03 | Wrong password                           | High     | Confirmed account             | Sign in with a wrong password                                              | Arabic error under the form: "البريد الإلكتروني أو كلمة المرور غير صحيحة"           | `e2e/auth.spec.ts`, `map-auth-error.test.ts`   | ⬜  | ⬜      |
| TC-AUTH-25-04 | Unconfirmed email                        | Medium   | Sign-up done, link not opened | Sign in                                                                    | Error "لم يتم تأكيد البريد الإلكتروني بعد..." under the form                        | `map-auth-error.test.ts`                       | ⬜  | ⬜      |
| TC-AUTH-25-05 | Forgot and reset password                | High     | Confirmed account             | Forgot password, open the mail link, set a new password, sign out, sign in | Lands on dashboard after reset; the new password works, the old one does not        | `e2e/auth.spec.ts`                             | ⬜  | ⬜      |
| TC-AUTH-25-06 | Expired or used reset link               | Medium   | Used link                     | Open the link again                                                        | `/sign-in` with "الرابط غير صالح أو انتهت صلاحيته"                                  | `e2e/auth.spec.ts`, `route-handlers.test.ts`   | ⬜  | ⬜      |
| TC-AUTH-25-07 | Sign out clears the session              | High     | Signed in                     | Sign out, press the browser back button                                    | Home page; `/dashboard` redirects to sign-in                                        | `e2e/auth.spec.ts`                             | ⬜  | ⬜      |
| TC-AUTH-25-08 | Protected page returns to `next`         | High     | Signed out                    | Open `/dashboard`, sign in                                                 | Back on `/dashboard`; an off-site `next` is ignored                                 | `e2e/auth.spec.ts`, `next-path.test.ts`        | ⬜  | ⬜      |
| TC-AUTH-25-09 | Google sign-in                           | High     | Staging with Google enabled   | Press "المتابعة بحساب Google"                                              | Signed in; new account sees the welcome toast                                       | manual only                                    | ⬜  | ⬜      |
| TC-AUTH-25-10 | English mode is LTR                      | Medium   | None                          | Open `/en/sign-in` and `/en/sign-up`                                       | LTR, English texts, tabs and hero mirrored                                          | `e2e/auth.spec.ts`                             | ⬜  | ⬜      |
| TC-AUTH-25-11 | Mobile width (390 px)                    | High     | None                          | Open the four screens at 390 px in ar and en                               | Hero above card, no horizontal scroll, buttons 44 px high                           | manual only (screenshots in PR)                | ⬜  | ⬜      |
| TC-AUTH-25-12 | Too many attempts                        | Medium   | None                          | Submit sign-in repeatedly past the limit                                   | Toast "عدد الطلبات كبير..." (`RATE_LIMITED`)                                        | `map-auth-error.test.ts`                       | ⬜  | ⬜      |
| TC-AUTH-25-13 | Validation texts                         | High     | None                          | Submit empty, invalid email, 7-character password, mismatched passwords    | Each error under its field, in Arabic and English                                   | `e2e/auth.spec.ts`, `auth.schema.test.ts`      | ⬜  | ⬜      |
| TC-AUTH-25-14 | Message parity and no email in analytics | Medium   | None                          | Run unit tests                                                             | `ar.json` and `en.json` have the same keys; `signup_completed` rejects extra fields | `messages.test.ts`, `analytics-events.test.ts` | ⬜  | ⬜      |
