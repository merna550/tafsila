# Plan: #240 OptionCard and OptionCardGroup

_Copy of the approved plan comment._

Plan wave M3, 2026-10-19, planned together with #241 (the card shows a drawing from #241 through one slot). Depends on #236 (screens): the build must match the picker option card in `docs/design/screens/` once #236 lands; if the files are not there yet, stop and wait (do not guess sizes or colours). The interface below is fixed, so the screen can only change classes, not props.

### Approach

Data-driven group (an `options` array, like `SegmentedControl`), not children, so the group owns keyboard behaviour. Single-select = Radix `RadioGroup` (`@radix-ui/react-radio-group` is already a dependency): arrow keys, roving focus, and disabled items skipped for free. Multi-select (pockets) = a `role="group"` of `<button role="checkbox" aria-checked>`: Tab moves between cards, Space or Enter toggles (the standard checkbox pattern, no arrows). Radix radio ignores Enter on purpose, so the single variant adds `onKeyDown` Enter -> select.
Disabled card: Radix `disabled` (skipped, not focusable); the short reason is **visible text inside the card** linked with `aria-describedby`, so screen readers read it in browse mode and as the card description. No tooltip (not reachable on touch).
Styling only with the existing tokens and `FOCUS_RING`/`cx` from `styles.ts`; min touch target 44 px; grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`; logical properties only (RTL).

### Files (exact)

Create in `packages/ui/src/`:

- `option-card.tsx`: `OptionCardFace` (presentational: slot, label, reason, badge, selected ring) shared by both variants. Props: `{ label: string; illustration?: ReactNode; selected: boolean; disabledReason?: string; lowConfidence?: boolean; lowConfidenceLabel?: string; reasonId?: string }`.
- `option-card-group.tsx`: `OptionCardGroup`, props below.
- `option-card.stories.tsx`: stories Default, Selected, Disabled, LowConfidence, MultiSelect. The existing `e2e/stories.spec.ts` already snapshots every story in RTL/LTR at mobile and desktop; no new spec. Stories use a small inline placeholder SVG (`currentColor`), Arabic and English labels from `sample-text.ts` style (add 4 option labels there).
- `option-card.test.tsx`.

Change: `packages/ui/src/index.ts` (export both); `packages/ui/e2e/__snapshots__/` (new PNGs from `pnpm --filter @tafsila/ui test:visual:update:docker`).

```ts
export interface OptionCardOption {
  readonly value: string;
  readonly label: string; // already translated
  readonly illustration?: ReactNode; // slot; wrapper sets text colour, drawing uses currentColor
  readonly disabledReason?: string; // present => disabled; shown on the card
  readonly lowConfidence?: boolean; // highlight only, unused until M6 (FR-DES-04)
}
type Common = {
  options: readonly OptionCardOption[];
  label: string /* group aria-label */;
  lowConfidenceLabel?: string;
  dir?: "rtl" | "ltr";
  className?: string;
};
export type OptionCardGroupProps = Common &
  (
    | { multiple?: false; value: string | undefined; onValueChange: (value: string) => void }
    | { multiple: true; value: readonly string[]; onValueChange: (value: string[]) => void }
  );
```

Low confidence = dashed warning-token border plus the text badge (`lowConfidenceLabel`), never colour alone.

### Data / API

None. No new dependency.

### Tests (Vitest + Testing Library in `option-card.test.tsx`, then the story snapshots)

- Single: 3 options, focus the selected one, ArrowRight/ArrowLeft move (in `dir="rtl"` ArrowLeft goes to the next), Space and Enter select, `onValueChange` called once with the value.
- Disabled middle option: arrows skip it; it has `aria-disabled`/`disabled` and `aria-describedby` pointing to its reason text; clicking it does not call the handler.
- Multi: Space and Enter toggle, value list grows and shrinks, order of `options` kept, disabled option cannot be toggled.
- Low confidence renders the badge text and a `data-low-confidence` attribute; absent by default.
- Visual: the 5 stories x RTL/LTR x mobile/desktop (360 px) in the existing story spec.

Manual test case: `docs/test-cases/ui/240-option-card.md` TC-UI-240-01 (Storybook: keyboard, VoiceOver/TalkBack reads the disabled reason).

### Docs to update

`docs/frontend/README.md` design-system list (one line), `docs/design/screens/README.md` mapping only if #236 names the card there.

### Decisions (build writes `docs/decisions/240-option-card.md`)

1. Data-driven `options` prop; the group owns keyboard behaviour.
2. Disabled cards are skipped by arrows and show the reason as visible text linked by `aria-describedby` (no tooltip).
3. Multi-select uses Tab navigation with Space and Enter (checkbox pattern), single uses arrows (radio pattern).
4. Low-confidence is a dashed border plus a text badge; the translated badge text comes from the caller (the UI package has no i18n).
5. The illustration is an opaque `ReactNode` slot; the drawings come from #241 and are passed by the feature.

### Risks

- Radix radio ignores Enter: handled by an explicit key handler, covered by a test.
- Snapshot PNGs differ by OS: generate them only with the docker script (existing rule).
- Screens (#236) not landed: the build waits; interface does not depend on them.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (script: `no`). Ready for approval.

## Deviations

- `packages/ui` has no DOM test library (no jsdom or Testing Library in the repo, and a new dependency needs a tech card), so `option-card.test.tsx` checks the rendered markup (roles, `aria-checked`, `disabled`, `aria-describedby`, badge) with `renderToStaticMarkup` and the pure `toggleValue`. Arrow, Space and Enter behaviour comes from Radix (radio) and native buttons (checkbox); the Enter handler is covered by TC-UI-240-01.
- Snapshot PNGs are not committed: this build had no Docker daemon. CI's storybook job runs the five stories; baselines must be generated with `pnpm --filter @tafsila/ui test:visual:update:docker`.
- Visual values follow `DesignPicker.dc.html`: 148 px tall tile, 2 px border, 16 px radius, check badge at the start-top corner, dashed border and muted fill when disabled.
