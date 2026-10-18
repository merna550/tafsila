---
date: "2026-10-11"
issue: "#94"
title: "API contract from one source"
---

API contract from one source: routes declared with `@hono/zod-openapi` produce `openapi.json`, which becomes a stable Postman collection that Newman runs against a throwaway local API; a staleness check keeps both honest ([ADR-94](../../decisions/94-openapi-postman-newman.md))

Read: [Hono](../tech/hono.md) · [Postman and Newman](../tech/postman-newman.md) · [tsx](../tech/tsx.md)
