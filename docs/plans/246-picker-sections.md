# Plan: #246 picker feature sections and length overrides

## Plan: #246 Picker feature sections and length overrides

Plan wave M3 (planned with #244 and #250; shared names fixed there). Screens (#236) are not in the repo yet: the build must match `docs/design/screens/` once #236 lands. [ADR-236](../decisions/236-m3-scope.md) items 8, 9, 11.

### Approach

Fill the `SectionPanel` stub of #244 (same feature `apps/web/src/features/design-picker/`). One generic, data-driven panel; no per-feature component.

- **Config** `model/section-fields.ts`:
  ```ts
  type FieldConfig =
    | { kind: "choice"; path: FeaturePath } // one OptionCard group
    | { kind: "multi"; path: "pockets" } // checkbox group, value = array
    | { kind: "number"; path: OverridePath; unit: "cm" }; // optional override
  const FIELDS_BY_SECTION: Record<SectionId, FieldConfig[]>;
  ```
  Sections and ids as in #244 (`bodice, neckline, sleeve, skirt, waistband, closure, pockets, extras`). Bodice: `bodice.fit`, `bodice.shaping`, `bodice.waistSeam`; neckline: `neckline.front`, `neckline.back`, `neckline.collar`, number `neckline.depthFrontMm`; sleeve: `sleeve.type`, `sleeve.length`, `sleeve.cuff`; skirt: `skirt.type`, `skirt.length`, number `skirt.lengthMm`, `skirt.slit` (position choice + number `skirt.slit.lengthMm`, with a "no slit" choice); waistband; closure: `closure.type`, `closure.position`; pockets; extras: `lining`, `belt`. A test asserts every path of `FeaturePath` (#238) appears in exactly one field, so a new engine path fails the test until it is shown.
- **Choice fields**: `FieldChoice` renders `OptionCardGroup` (#240). Items come from `specOptions(spec)[path].values` (#238): label from `designPicker.options.<path>.<value>` messages, drawing from the #241 export (use what #241 exports; a missing drawing falls back to no illustration), `disabled` + reason = the engine's `{ar,en}` refusal text picked by locale. Selecting calls `setFeature(path, value)` of the #244 store (normalisation and the reset notice are already there). `specOptions` is computed with `useMemo` from the store spec (pure, fast).
- **Number fields**: `model/length-units.ts` `mmToCm` / `cmToMm` (round to 1 mm; reuse the `@tafsila/utils` helper if one exists). Input shows cm, store gets mm, empty input removes the override (`setFeature(path, undefined)`). Min and max come from a new engine export `OVERRIDE_LIMITS_MM` (`packages/engine/src/spec-rules/override-limits.ts`, re-exported by the `spec-rules` subpath from #244), built from the clamps the modules already use (find them with `code-search`: neckline depth, skirt length, slit length) and not copied as new numbers. Out-of-range input shows an inline error under the field and is not written; no hard-coded limits in the UI.
- Structure: `components/{SectionPanel,FieldChoice,FieldMulti,FieldNumber}.tsx` take props only (components do not call hooks: `DesignEditorScreen` passes `spec`, `options`, `onChange`).
- Copy: `designPicker.fields.<path>` (field titles), `designPicker.options.<path>.<value>` for every enum value read from `designSpecSchema` (a test fails when a value has no key in ar or en), `designPicker.overrides.*` (labels, hint "cm", range error). Follow `docs/design/copy.md` (glossary, gender-neutral Arabic).

### Files

Create: `features/design-picker/model/{section-fields,length-units}.ts`, `components/{FieldChoice,FieldMulti,FieldNumber}.tsx` (+ `.test.ts(x)`), `docs/test-cases/ui/246-picker-sections.md`, `packages/engine/src/spec-rules/override-limits.ts` (+ test).
Change: `features/design-picker/components/SectionPanel.tsx`, `DesignEditorScreen.tsx` (pass options), `messages/{ar,en}.json`, `packages/engine/src/spec-rules/index.ts`, `docs/engine/README.md` (limits line), `docs/SRS.md`.

### Data / API

None. Reads `specOptions` and `OVERRIDE_LIMITS_MM` from the engine; writes only the store.

### Tests

- Walk test (AC): for each category (`defaultSpec(c)`), for each section from `sectionsFor`, for each choice field and each `allowed` value: `setFeature` then the store spec passes `designSpecSchema.safeParse` and `specRefusals` is empty (value may be changed by normalisation, never invalid).
- Every enum value of `designSpecSchema` has an `ar` and `en` option key; every `FeaturePath` is in exactly one field.
- Refused value: `skirt.type = "gathered"` on a one-piece dress renders disabled with the Arabic reason from `INPUT_ERROR_MESSAGES`; clicking does nothing.
- Numbers: typing `60` cm writes `600` mm; empty removes the key; below min or above max shows the error and the store is unchanged; `OVERRIDE_LIMITS_MM` values equal the engine clamps (unit test imports the same constants the modules use).
- Pockets multi-select adds and removes `patch` and `side-seam`.
- Visual/manual in ar and en at 360 px: TC-DESIGN-246-01 every section on a dress; -02 skirt sections; -03 refused value shows reason; -04 cm override; -05 slit; -06 RTL arrows and keyboard.

### Decisions (build writes `docs/decisions/246-picker-sections.md`)

1. One config table `FIELDS_BY_SECTION`, one generic panel; a new engine path must be added there (test enforces).
2. Override limits are an engine export (`OVERRIDE_LIMITS_MM`) taken from the existing clamps; the UI has no numbers of its own.
3. Empty override input removes the field (engine default applies).
4. Refusal reasons come from the engine texts; option labels from messages.

### Risks

- `OptionCard` props (#240) and drawing export (#241) are assumed; adapt to the merged code.
- Engine bugs #229-#232 make some offered values fail at generate time; not this issue (the preview error state, #239, handles it; the M3 exit waits).
- Many message keys (about 80 per language): keep them generated by the test list above so none is missed.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- Field titles reuse `designPicker.paths.*` (added in #244) instead of a new `designPicker.fields.*`; option names are `designPicker.options.<path with _>.<value>` (dots are separators in next-intl keys).
- The length fields sit in a second card below the options ("Adjust lengths (optional)"), as in the approved screen; the panel stays one generic component.
- `OVERRIDE_LIMITS_MM` minimums come from the engine constants (`FRONT_NECK_DEPTH_MIN_MM`, `MIN_SKIRT_LENGTH_MM`); maximums depend on the body, which the picker does not have, so they are fixed upper bounds (140 mm neck, 1400 mm skirt, 1000 mm slit) and the body-specific check stays in the engine. The slit minimum (50 mm) is new.
- An empty slit length goes back to `PICKER_SLIT_LENGTH_MM` because a slit always has a length.
- New store action `setOverride`; `FieldNumber` keeps its text locally, so undo does not rewrite a box that is open.
- Pockets and other multi-selects use the shared `OptionCardGroup` in `multiple` mode.
- The placeholder is "Default" (the engine default depends on the body). No visual baselines (no Docker; tracked in #265).
