---
date: "2026-10-19"
issue: "#237"
title: "Append-only versions with a composite foreign key"
---

A version table that users can only read and add to (no update or delete grant) keeps history honest, and a composite foreign key on (design_id, owner_id) lets the database itself refuse a version that points at someone else's design. The hash that detects "same inputs" is only indexed, not unique, so a restore can still add a new row.

Read: [Row Level Security](../tech/supabase.md)
