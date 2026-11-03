---
date: "2026-11-03"
issue: "#370"
title: "A trial that can only happen once"
---

A trial that can only happen once: the grant is a SQL function that locks the user's phone row and stamps `trial_granted_at`, and it runs in the same transaction as the phone verification, so a crash or a second call can never give the credits twice or lose them. A lazy path on the credits read repairs users verified before the feature existed.

Read: [Row Level Security](../tech/supabase.md)
