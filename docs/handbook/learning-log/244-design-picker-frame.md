---
date: "2026-10-25"
issue: "#244"
title: "Design picker frame and editor store"
---

The design picker keeps the spec being edited in a small Zustand store whose steps are plain functions, so undo, dirty checks and the browser draft are tested without React; the sections shown come from the engine's `specOptions`, and the engine rules are imported by a subpath so the geometry stays out of page bundles

Read: [Zustand](../tech/zustand.md)
