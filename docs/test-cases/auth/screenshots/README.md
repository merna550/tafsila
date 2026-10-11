# Auth screens: screenshots for PR #104 (issue #25)

Taken from a production build with Playwright (Chromium), with the non-secret CI placeholders as configuration and no Supabase, so only the screens are shown: no submit, no Google button (`AUTH_GOOGLE_ENABLED` is off). Name: `<screen>.<language>.<viewport>.png`; mobile is 390 px wide and desktop 1280 px, full page.

| Screen          | Arabic (RTL)                                                                        | English (LTR)                                                                       |
| --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sign up         | [mobile](sign-up.ar.mobile.png) · [desktop](sign-up.ar.desktop.png)                 | [mobile](sign-up.en.mobile.png) · [desktop](sign-up.en.desktop.png)                 |
| Sign in         | [mobile](sign-in.ar.mobile.png) · [desktop](sign-in.ar.desktop.png)                 | [mobile](sign-in.en.mobile.png) · [desktop](sign-in.en.desktop.png)                 |
| Forgot password | [mobile](forgot-password.ar.mobile.png) · [desktop](forgot-password.ar.desktop.png) | [mobile](forgot-password.en.mobile.png) · [desktop](forgot-password.en.desktop.png) |

The reset-password screen needs the link from the email, so it is covered by the e2e flow, not here.
