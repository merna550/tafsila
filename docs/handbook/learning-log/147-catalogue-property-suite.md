---
date: "2026-10-19"
issue: "#147"
title: "One property test over the whole catalogue"
---

A property test draws random designs (filtered by the engine's own compatibility rules) and random bodies from the 25-body matrix, and checks that every result is valid. In its first runs it found five real bugs; they are listed with their issues and excluded in one commented function until fixed. Bugs found by a test are reported, not fixed in the same PR.

Read: [Property testing](../tech/fast-check.md)
