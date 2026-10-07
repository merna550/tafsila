---
paths:
  - "packages/engine/**"
---

# Engine drafting

- Engine code has no I/O, no `Math.random`, no `Date`, and never mutates its inputs.
- All lengths are millimetres, and every numeric name ends with its unit (`Mm`, `Rad`).
- Every number with meaning is a named constant in `src/constants/`.
- A garment feature is a `FeatureModule` that registers its own validation rules and tests.
- A change that alters output geometry for an existing input bumps `ENGINE_VERSION`.
- Each drafting function cites its method or source in its JSDoc.
