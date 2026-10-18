---
date: "2026-10-18"
issue: "#186"
title: "A PR that links and closes its issue by rule"
---

A merged PR closes its issue only through a closing keyword, so `Closes #N` is the first body line and a small workflow repairs a missing one. A PR whose base is another branch can merge "successfully" and still never reach `main`, so the same check fails any base other than `main`.

Read: [GitHub](../tech/github.md)
