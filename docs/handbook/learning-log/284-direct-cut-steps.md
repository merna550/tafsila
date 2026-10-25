---
date: "2026-10-25"
issue: "#284"
title: "Direct-cut steps: marking a piece with a ruler"
---

The engine now turns every piece into numbered marking steps (`cutSteps`), so a tailor can mark the cut line on fabric without paper. Each point is measured "down" from a top line and "across" from a reference: the fold, or a line parallel to the selvedge. Curves become points about every 25 mm, joined with a smooth curve. Where a smooth curve through those points would miss the line, such as a rounded collar end, the engine adds a point. A property test rebuilds every point and curve across the whole catalogue and checks they stay within 1 mm of the cut line.

Read: [Engine README, direct-cut steps](../../engine/README.md#direct-cut-steps-srccut) · [decision 284](../../decisions/284-cut-steps.md)
