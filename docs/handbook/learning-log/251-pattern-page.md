---
date: "2026-10-25"
issue: "#251"
title: "The pattern page is a pure pipeline"
---

The pattern page composes five features without owning their state: stores feed one pure `buildPreviewInput`, the worker drafts, and one pure function (`saveStateOf`) decides what the Save button does. A draft answers the exact input object it was given, so a stale drawing never enables Save and the main bundle needs no hash code.

Read: [Frontend README, Pattern page](../../frontend/README.md)
