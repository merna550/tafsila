---
date: "2026-10-18"
issue: "#188"
title: "Run a check only when a change can affect it"
---

Each CI check has a rule table of paths that can change its result; a skipped job or step still reports success so required checks never block, unknown changes run everything, and a nightly run is the safety net. The table in the workflow doc is generated from the rules.

Read: [Turborepo](../tech/turborepo.md)
