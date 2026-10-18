---
date: "2026-10-11"
issue: "#91"
title: "Session and API auth"
---

Session and API auth: Supabase session in cookies refreshed by the proxy, a pure route guard with a safe `next`, and an API that trusts only a token verified once with `jose`, with the role added by a custom access token hook ([decision 25a](../../decisions/25a-auth.md))

Read: [jose](../tech/jose.md) · [Access token hook](../glossary.md#access-token-hook)
