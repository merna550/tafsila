---
date: "2026-10-19"
issue: "#239"
title: "Pattern preview in a Web Worker"
---

The browser drafts the pattern in a Web Worker so typing never freezes the page: a small client keeps only the latest request, a controller debounces by 250 ms, and a build-output scan fails CI if the engine geometry ever leaks into a page bundle. A barrel import (`@tafsila/engine`) had silently put the whole engine into two pages, so validation now has its own entry point.

Read: [Web Worker](../glossary.md#web-worker)
