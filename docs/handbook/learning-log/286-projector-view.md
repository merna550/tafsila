---
date: "2026-10-25"
issue: "#286"
title: "Projector view: physical keys and non-scaling strokes"
---

The projector page scales an SVG group by two px-per-mm factors; `vector-effect: non-scaling-stroke` keeps line width in screen px, pan is stored in screen mm outside the mirror flip so arrow keys stay physical, and keys are matched by `event.code` so an Arabic layout works

Read: [Projector](../../frontend/README.md#projector)
