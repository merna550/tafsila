---
date: "2026-10-14"
issue: "#32 (part A)"
title: "Admin-only data without a back door"
---

Admin-only data without a back door: `security definer` functions that re-check the admin role inside the database (the token role can be an hour stale), counts instead of private rows, a chart write and its audit row in one transaction through the normal RLS, and a role-guarded route that answers 403

Read: [Stale token role](../glossary.md#stale-token-role) · [Security definer function](../glossary.md#security-definer) · [decision 32a](../../decisions/32a-mini-admin-api.md)
