---
date: "2026-10-19"
issue: "#242"
title: "Designs API: one query for the list"
---

The designs list shows how many versions each design has, its status and the client's name. Instead of asking the database once per design, one query joins the current version, its measurement set and the client, and counts versions in a subquery. Row level security still decides what the caller sees, so another user's design simply does not exist for them (404).

Read: [Add an endpoint](../../backend/tutorials/add-endpoint.md)
