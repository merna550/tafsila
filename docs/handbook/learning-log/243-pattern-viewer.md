---
date: "2026-10-25"
issue: "#243"
title: "Pattern viewer: scene data, pointer gestures, no geometry in the page"
---

The viewer draws a `PatternScene` the engine builds in the worker, so the page never does geometry. Zoom and pan are pure functions (easy to test); gestures use Pointer Events so mouse, touch and pen share one path, and a pinch is just two pointers. The canvas never mirrors in Arabic; only the buttons do.

Read: [PatternScene](../glossary.md#pattern-scene)
