# ADR-285 · 2026-10-25 · Projector calibration: px per mm per axis, stored per device

**Context:** FR-PROJ-02 and NFR-01 need a projector scale within 2 mm over 50 cm. [ADR-281](281-m4-scope.md) items 2, 6 and 7 fix the routes and say calibration lives in `localStorage` of the device. The approved screen is `docs/design/screens/ProjectorCalibrate.dc.html`. #286 and #287 build on this feature (`features/projector/`).
**Decision:**

1. **Unit:** the factors are **CSS px per real mm**, separately for X and Y (`pxPerMmX`, `pxPerMmY`). CSS px and SVG user units are the same thing, so the projector view needs no pixel-ratio maths. Screen size and pixel ratio are stored only to detect a changed setup.
2. **The square is drawn in CSS px, not CSS mm.** A projector shows about one CSS px per real mm or less, so a 300 CSS-mm square (1134 px) would not fit its picture. The square fills 60 % of the shorter screen side (steps of 10 px, at least 100); `factor = squarePx / measuredMm`. This replaces the "300 x 300 mm nominal square" of the issue text; the accuracy is the same because only the measured size matters.
3. **Sizes are typed in mm** (the design says so; the plan said cm). Latin or Arabic digits, `.`, `,` or the Arabic decimal mark, up to two decimals. Valid range 50 mm to 5000 mm (5 cm to 5 m), one message for both ends.
4. **Stored** under `tafsila.projector.calibration` as `{ version: 1, pxPerMmX, pxPerMmY, screen, calibratedAt }`, validated with Zod on read. `missing` for nothing, bad data or failing storage; `stale` when screen width, height or pixel ratio (within 0.01) differ. A stale or missing state shows the form again, with a hint when stale.
5. **Read after mount**; the server render shows a loading line, never a guessed calibration. The screen is re-read on `resize`.
6. **Fullscreen** is entered by a button (browsers need a click); the page works without the Fullscreen API (button hidden). Escape leaves it natively.
7. **Routes** live in a `(projector)` group under `[locale]` with their own layout (session check only, no app navigation); the page covers the shell with a fixed black container (new token `--color-stage`).
8. The "use this version" bar on the version view (projector, direct cut, export buttons) is added by #286 together with the projector route; this issue's result page links to `.../projector`.
   **Reason:** a single unit that the drawing code already uses, a square that always fits, and no wrong guess when the setup changed.
   **Alternatives:** CSS mm square as in the issue (does not fit a projector); storing the calibration on the server (a factor belongs to one projector and screen, ADR-281 item 7); one uniform factor (hides lens and aspect errors the X/Y pair corrects).
