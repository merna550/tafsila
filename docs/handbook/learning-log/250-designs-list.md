---
date: "2026-10-25"
issue: "#250"
title: "A shared entity keeps two features apart"
---

When two screens need the same data and the same link, the code goes in a small shared "entity" folder (hooks, row view model, link) that both features import through its index, so the features never import each other's insides; the client filter lives in the URL so the filtered list can be linked and survives a reload

Read: [decision 250](../../decisions/250-designs-list.md)
