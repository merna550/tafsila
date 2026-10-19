---
date: "2026-10-19"
issue: "#146"
title: "Sewing order from the finished pieces"
---

The sewing order is not written per module. It is read from the finished pieces: each paired edge is one seam, a small rule table gives the seam a catalogue key from its edge ids, and the catalogue gives the phase, the action and the Arabic and English text. A coverage check proves that every seam is sewn in exactly one step, so a new module that adds a seam is caught by a test instead of printing wrong instructions.

Read: [Sewing order](../../decisions/146-sewing-order.md), [Engine docs](../../engine/README.md)
