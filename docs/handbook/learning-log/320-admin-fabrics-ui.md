---
date: "2026-10-28"
issue: "#320"
title: "Admin fabric catalogue and rules editor"
---

A rule condition is never typed: the editor offers only the paths and values that the engine's `RULE_PATHS` lists, so a wrong rule cannot be saved. The preview reuses the same pure `recommend` function the server runs, in the browser, on the unsaved edit, so the admin sees the effect before saving and the logic is not written twice.

Read: [Rule preview](../glossary.md#rule-preview)
