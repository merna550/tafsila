## Why

Merna approved the M1 screen designs on her private design canvas. Agents cannot open that canvas, so the designs must live in the repo, and every screen issue must point to them. The product is bilingual (Arabic default, English), but the designs are drawn in Arabic only, so the repo also needs explicit rules for how a design becomes both languages.

## What to do

All source files are in `setup/design-screens/` (Merna's local folder, not committed). Move them into the repo:

1. `setup/design-screens/screens/` (the `*.dc.html` files, `README.md` and the `images/` folder with a desktop and a mobile PNG per screen) → `docs/design/screens/`.
2. `setup/design-screens/copy.md` → `docs/design/copy.md`.
3. `docs/design/README.md`: short index linking `screens/README.md`, `copy.md`, `docs/design-system/`, and `docs/frontend/design-system.md`.
4. `CLAUDE.md` "Where to look" table: add rows
   - `Screen designs (match these for any UI work)` → `docs/design/screens/`
   - `UI copy rules and glossary (Arabic + English)` → `docs/design/copy.md`
5. `docs/CODING_STANDARDS.md`, UI section, add rules:
   - A screen issue must match its file in `docs/design/screens/` (layout, spacing, states, copy).
   - Values come from tokens / `packages/ui` components, never raw hex or px from the design files.
   - Arabic copy from the design goes to `ar.json`; the English equivalent to `en.json`, following `docs/design/copy.md`.
   - Logical CSS only; LTR exceptions (phone, email, OTP) and icon flipping as listed in `screens/README.md`.
   - The PR for a screen includes screenshots of the built screen in **both** `ar` and `en`, at 1280 px and 360 px.
6. `docs/CONTEXT_MAP.md`: add `docs/design/` where UI tasks look.
7. Add a "Design" line to the body of each M1 screen issue (#25, #26, #27, #30, #31, #32) pointing to its `.dc.html` file(s) and images, as listed in the table in `screens/README.md`. Use `gh issue edit` to append, do not rewrite the body.
8. Placeholder logo: if no `Logo` component exists in `packages/ui`, add one from the SVG in the design files (with a JSDoc that says it is a placeholder until after M1) and use it in the existing app header.
9. Copy check in tests: add a unit test that fails when `ar.json` and `en.json` do not have the same key set (if one does not exist already).
10. `docs/DECISIONS.md`: log "UI copy is simple Modern Standard Arabic, gender-neutral toward the user, `عميلة` for the client; designs are Arabic-first and mirrored for English".
11. Update existing Arabic strings in `apps/web/messages/ar.json` that break the copy rules (dialect, feminine/masculine imperatives, `زبونة`). Keep keys unchanged.

## Acceptance criteria

- [ ] `docs/design/screens/` contains the 10 design files, the 20 images (desktop + mobile) and the README with the screen → route → issue table.
- [ ] `docs/design/copy.md` exists with the rules and glossary.
- [ ] `CLAUDE.md`, `CODING_STANDARDS.md`, `CONTEXT_MAP.md` point to them.
- [ ] Each of #25, #26, #27, #30, #31, #32 has a "Design" line linking its file(s).
- [ ] `Logo` component exists in `packages/ui` and is used by the header.
- [ ] A test fails if `ar.json` and `en.json` keys differ; it passes now.
- [ ] `ar.json` follows `copy.md`.
- [ ] Decision logged.
- [ ] `pnpm quality && pnpm test` pass.

## Out of scope

- Building the screens themselves (their own issues).
- The final logo (after M1).

## After merge (Merna)

Delete the local folder `setup/design-screens/`.
