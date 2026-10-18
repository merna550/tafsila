---
date: "2026-10-11"
issue: "#83"
title: "Finishing the CI minutes cut"
---

Finishing the CI minutes cut: every heavy job gets a scope job and a job-level `if` (skipped counts as passed), PR runs cancel superseded ones, Playwright browsers are cached, and the dispatcher cron is 12 hours ([ADR-83](../../decisions/83-ci-minutes.md))

Read: [What costs Actions minutes](../../backend/ci-minutes.md)
