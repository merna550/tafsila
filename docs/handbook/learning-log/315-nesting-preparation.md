---
date: "2026-10-28"
issue: "#315"
title: "Preparing pattern pieces for fabric nesting"
---

Before pieces can be placed on fabric, each one becomes a plain polygon in a common frame: x along the selvedge, y across the fabric. Curves are flattened and simplified with Douglas-Peucker, then pushed out by the same tolerance so the outline never cuts inside the real line. The folded layout changes what is cut: a fold piece is half a shape lying on the fold, and a left-and-right pair is cut once through both layers; the open layout unfolds the half and flips every second piece of a pair.

Read: [Douglas-Peucker](../glossary.md#douglas-peucker) · [Folded and open layout](../glossary.md#folded-layout) · [Usable width](../glossary.md#usable-width) · [Nesting page](../../engine/nesting.md)
