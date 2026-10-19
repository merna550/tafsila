---
date: "2026-10-19"
issue: "#245"
title: "Pattern versions: the server re-runs the engine"
---

The browser never sends a finished pattern. It sends the inputs (spec, measurement set, ease, options) and the API runs the same engine again, then stores the result's status and hash. To keep history safe, the design row is locked while a version is added, so two saves cannot get the same number, and restoring an old version adds a new one instead of changing the past.

Read: [Add an endpoint](../../backend/tutorials/add-endpoint.md)
