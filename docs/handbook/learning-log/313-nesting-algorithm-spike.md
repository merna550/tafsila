---
date: "2026-10-27"
issue: "#313"
title: "Nesting algorithm spike"
---

Nesting uses our own bottom-left fill on 3 mm column slices with three fixed piece orders. It gives the same layout every time, its worker chunk is 2.8 kB gzip, and the slowest test pattern takes under 2 s with a 4× slower CPU. The SVGnest port was checked for licences and size, but its strip lengths could not be measured in this run. The polygon simplification tolerance is 2 mm.

Read: [ADR-313](../../decisions/313-nesting-algorithm.md) · [Bottom-left fill](../glossary.md#bottom-left-fill)
