---
date: "2026-10-28"
issue: "#316"
title: "Placing pattern pieces on fabric and counting the metres"
---

The placement cuts the fabric strip into 3 mm columns and keeps, for each column, the heights already used. Each piece becomes the same kind of column list, so "does it fit here?" is a handful of interval comparisons. Pieces go to the first column where they fit (bottom-left fill), the whole layout is tried in three piece orders and the shortest wins. The metres to buy add shrinkage and one pattern repeat per row of pieces, then round up to 0.1 m; a version string is stored with each saved result so a later algorithm never changes an old layout.

Read: [Column profile](../glossary.md#column-profile) · [Bottom-left fill](../glossary.md#bottom-left-fill) · [Pattern repeat](../glossary.md#pattern-repeat) · [Nesting page](../../engine/nesting.md)
