---
date: "2026-11-02"
issue: "#367"
title: "A ledger instead of a balance column"
---

Credits are stored as signed rows (grants positive, debits negative and pointing at the grant they draw from), and the balance is always computed. Expiry then needs no cron job, and a unique key on (reason, ref_id) makes charging a design or granting a payment safe to retry. All writes go through security-definer functions, so even a buggy API route cannot edit money rows.

Read: [Row Level Security](../tech/supabase.md)
