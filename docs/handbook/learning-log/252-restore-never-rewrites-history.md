---
date: "2026-10-25"
issue: "#252"
title: "Restore never rewrites history"
---

A version is append-only: "restore" copies the inputs of an old version into a new version n+1, so nothing is lost and the number you see always comes from the server. Opening an old version is just another page that draws the stored inputs in the preview worker, so the editor state cannot be disturbed by looking at the past.

Read: [Frontend README, Pattern page](../../frontend/README.md)
