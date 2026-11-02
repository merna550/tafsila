# Upload photos and analysing: screenshots for issue #341

Taken from a production build with Playwright (Chromium), with placeholder configuration and no Supabase. The photo step runs for real in the browser (the image-prepare worker resizes the generated photos, the unreadable file fails to decode); only the analysis status answers are fixed (pending, then failed after a clock jump of 46 s for the "taking longer" note). A temporary page hosting the two screens was used and not committed. Name: `upload.<state>.<language>.<viewport>.png`; mobile is 390 px wide and desktop 1280 px, full page.

States: `photos-empty`, `photos-filled` (two photos), `photos-error` (an unreadable third file), `analysing-running`, `analysing-slow`, `analysing-failed`. Languages: `ar` (RTL) and `en`. Viewports: `mobile`, `desktop`.
