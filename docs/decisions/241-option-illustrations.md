# ADR-241 · 2026-10-24 · Option drawings are path data in grouped files with one renderer

**Context:** The design picker (#246) needs a line drawing for each of 60 catalogue options (issue #241); final art comes before the beta.
**Decision:**

1. Drawings are SVG path data in files grouped per feature, drawn by one `OptionIllustration` component (`stroke="currentColor"`, `fill="none"`, viewBox `0 0 64 64`), not 60 files. A swap is a one-entry edit.
2. Keys come from the DesignSpec schema enums and are typed, so a new enum value fails the type check and the completeness test.
3. Every `none` option shares one drawing.
4. Fit, waist seam, closure position and slit position have no drawing (text choices).
5. Review happens in a dev-only gallery route (`/dev/option-illustrations`, 404 in production), not Storybook, because Storybook lives in `packages/ui`, which cannot import from `apps/web`.

**Reason:** Small files, theme-safe colours by construction, easy replacement.
**Alternatives:** one file per drawing (60 files for placeholders); a second Storybook in `apps/web` (not worth it).
