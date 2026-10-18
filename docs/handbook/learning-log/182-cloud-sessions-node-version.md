---
date: "2026-10-18"
issue: "#182"
title: "Cloud sessions run the same checks as CI"
---

The cloud setup script now checks Node against `engines`, downloads a matching Node 22 (SHA-256 checked) when the image is too old, and fails loudly with the fix otherwise; builders run `pnpm quality && pnpm test` as written and stop with `BLOCKED: environment` instead of skipping checks.

Read: [Node.js](../tech/nodejs.md)
