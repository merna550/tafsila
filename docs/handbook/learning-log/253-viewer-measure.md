---
date: "2026-10-25"
issue: "#253"
title: "Viewer measure tool"
---

Measuring is a small state machine over snap points the engine already lists: a tap is converted from screen pixels to sheet mm, the nearest point within 16 px wins, and the distance is the engine's `measureBetween`, so the UI never does geometry. Snapping in screen pixels is what lets zooming in resolve crowded points.

Read: [Pattern viewer plan](../../plans/243-pattern-viewer.md)
