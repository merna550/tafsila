---
date: "2026-10-25"
issue: "#247"
title: "Pattern options panel"
---

The options panel is a controlled component: the page owns the value, the panel only shows it and reports edits. Its numbers come from the engine (ease table) and from `@tafsila/schemas` (limits, `buildEngineOptions`), so the browser preview and the API save build identical options. Ease constants come through a constants-only engine entry so no geometry reaches the main bundle.

Read: [React](../tech/react.md)
