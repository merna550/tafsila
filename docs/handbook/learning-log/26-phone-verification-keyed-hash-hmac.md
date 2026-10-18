---
date: "2026-10-12"
issue: "#26"
title: "Phone verification"
---

Phone verification: keyed hash (HMAC) instead of a plain hash, a `private` schema with `security definer` functions as the one narrow write door, and rate limits counted in the database under a lock ([decision 26](../../decisions/26a-phone-otp-trial.md))

Read: [Glossary](../glossary.md#hmac-keyed-hash)
