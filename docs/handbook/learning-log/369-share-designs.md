---
date: "2026-11-03"
issue: "#369"
title: "Consent before admins look"
---

Consent before admins look: a boolean on the profile gates what an admin can list, the database function (not the route) does the filtering, never returns measurements, and writes an audit row on every read, so even a buggy route cannot leak more than the function returns.

Read: [Row Level Security](../tech/supabase.md)
