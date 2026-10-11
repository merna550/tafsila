---
paths:
  - "packages/engine/**"
---

# Engine drafting

- Pure functions: no I/O, no `Math.random`, no `Date`, no mutation of inputs. Same input, same output.
- All lengths are millimetres; every numeric name ends with its unit (`Mm`, `Rad`, `Deg`). Convert only at the edges (`@tafsila/utils` units).
- Every number with meaning is a named constant in `src/constants/` with its unit and the reason in a comment (source or sew-test result).
- A garment feature is a `FeatureModule` that registers its own geometry, its own validation rules and its own tests. Modules do not import each other.
- Each validation rule lives next to its module, returns a typed result (`ok` or a coded issue), and has a property test (fast-check) across the size matrix.
- A change that alters output geometry for an existing input bumps `ENGINE_VERSION` and updates the snapshot in the same PR.
- Each drafting function cites its method or source in its JSDoc. Failures throw `DraftingError` with a stable `code`.

```ts
// WRONG: magic number, no unit, hidden clock
const ease = 4;
export function draft(m) {
  return { at: Date.now(), width: m.chest / 2 + ease };
}

// RIGHT
/** Woven bodice ease at the chest, in mm (source: sew-test 2026-10, ADR-xxx). */
export const CHEST_EASE_WOVEN_MM = 40;
/**
 * Drafts the front width of a bodice block.
 *
 * @param chestMm - Full chest circumference in mm.
 * @returns Front half width in mm.
 */
export function frontWidthMm(chestMm: number): number {
  return (chestMm + CHEST_EASE_WOVEN_MM) / 4;
}
```
