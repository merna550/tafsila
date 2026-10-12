# Auth screens: screenshots for PR #104 (issue #25)

Taken from a production build with Playwright (Chromium), with the non-secret CI placeholders as configuration and no Supabase, so only the screens are shown: no submit, no Google button (`AUTH_GOOGLE_ENABLED` is off). Name: `<screen>.<language>.<viewport>.png`; mobile is 390 px wide and desktop 1280 px, full page.

| Screen          | Arabic (RTL)                                                                        | English (LTR)                                                                       |
| --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sign up         | [mobile](sign-up.ar.mobile.png) · [desktop](sign-up.ar.desktop.png)                 | [mobile](sign-up.en.mobile.png) · [desktop](sign-up.en.desktop.png)                 |
| Sign in         | [mobile](sign-in.ar.mobile.png) · [desktop](sign-in.ar.desktop.png)                 | [mobile](sign-in.en.mobile.png) · [desktop](sign-in.en.desktop.png)                 |
| Forgot password | [mobile](forgot-password.ar.mobile.png) · [desktop](forgot-password.ar.desktop.png) | [mobile](forgot-password.en.mobile.png) · [desktop](forgot-password.en.desktop.png) |

The reset-password screen needs the link from the email, so it is covered by the e2e flow, not here.

## Verify phone screen (PR #116, issue #26)

Same method (production build, Playwright, Chromium), signed in through a fake Supabase user endpoint and with the phone API calls answered by the test, so only the screen shows. Step 1 is the number step, the plain name is the code step with `481` typed and the countdown at 1:00.

| Step                   | Arabic (RTL)                                                                              | English (LTR)                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Number step            | [mobile](verify-phone-step1.ar.mobile.png) · [desktop](verify-phone-step1.ar.desktop.png) | [mobile](verify-phone-step1.en.mobile.png) · [desktop](verify-phone-step1.en.desktop.png) |
| Code step (half-typed) | [mobile](verify-phone.ar.mobile.png) · [desktop](verify-phone.ar.desktop.png)             | [mobile](verify-phone.en.mobile.png) · [desktop](verify-phone.en.desktop.png)             |
