---
date: "2026-10-28"
issue: "#317"
title: "Fabric data in the database, edited by an admin"
---

The fabric catalogue and recommendation rules moved from code into tables, so an admin can fix a rule without a release. The migration seeds them from the package through a generated SQL block that a test keeps equal to the package data. Each admin change and its audit row are written in one transaction, and the database re-checks the admin role, so an old token cannot slip a write through. A saved fabric calculation is an upsert: one row per version and options, and the last save wins.

Read: [Fabric catalogue and rules](../glossary.md#fabric-catalogue) · [Upsert](../glossary.md#upsert) · [Row level security](../glossary.md#rls) · [Edit a fabric rule](../../backend/tutorials/edit-fabric-rules.md)
