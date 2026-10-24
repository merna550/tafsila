# ADR-240 · 2026-10-24 · OptionCardGroup is data-driven and owns the keyboard

**Context:** The design picker (#244, #246) needs picture cards for one choice (necklines) and several (pockets), with a disabled state that explains itself and a low-confidence highlight for M6 (FR-DES-04).
**Decision:**

1. `OptionCardGroup` takes an `options` array (like `SegmentedControl`), so the group owns the keyboard behaviour.
2. Single choice uses the radio pattern (Radix `RadioGroup`: arrows, roving focus; Enter also selects). Several choices use the checkbox pattern (Tab, Space or Enter toggles).
3. A disabled card is skipped by arrows and shows its reason as visible text linked with `aria-describedby`; no tooltip (not reachable on touch).
4. Low confidence is a dashed warning border plus a text badge; the translated badge text comes from the caller (the UI package has no i18n).
5. The drawing is an opaque `ReactNode` slot filled by the feature (drawings come from #241).

**Reason:** One accessible, reusable component for every picker, with no per-screen keyboard code.
**Alternatives:** children-based cards (every screen would repeat keyboard handling); tooltip for the disabled reason (hidden on touch and for screen readers in browse mode).
