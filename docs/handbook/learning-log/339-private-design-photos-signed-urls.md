---
date: "2026-11-02"
issue: "#339"
title: "Private design photos with signed URLs"
---

Garment photos go straight from the browser to a private bucket through signed URLs: the API checks the design is yours, hands out a short-lived URL, and storage policies repeat the check in the database. AI usage rows are written through private functions, because the API role has no table access.

Read: [Signed URL](../glossary.md#signed-url)
