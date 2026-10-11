# ADR-97 · 2026-10-11 · UI copy is simple Modern Standard Arabic, and the approved screen designs live in the repo

**Context:** Merna approved the M1 screen designs on a private canvas that agents cannot open, and the designs are drawn in Arabic only while the product is bilingual (issue #97). The first Arabic strings mixed Egyptian dialect with feminine imperatives, although tailors may be women or men.
**Decision:**

1. **UI copy is simple Modern Standard Arabic**, gender-neutral toward the user (verbal nouns for actions, passive or "يمكن" for instructions), with `عميلة` for the client and never `زبونة`. English is plain, sentence case, second person. The rules and the glossary are in `docs/design/copy.md`.
2. **Designs are Arabic-first and mirrored for English**: one layout, logical CSS, directional icons flip, LTR only for phone, email and OTP. The designs and images are copied to `docs/design/screens/`; the `.dc.html` file wins over the image; values always come from tokens and `packages/ui`, never raw hex or px.
3. **The logo is a placeholder** (`Logo` in `packages/ui`) until after M1, so the real one is a one-file change.
4. `ar.json` and `en.json` keep the same key set (already tested since #90).
   **Reason:** One tone for every screen, copy that reads the same to women and men tailors, and designs that agents can read and match.
   **Alternatives:** keep Egyptian dialect (hard to keep consistent, less professional); keep the designs outside the repo (agents cannot match what they cannot open).
