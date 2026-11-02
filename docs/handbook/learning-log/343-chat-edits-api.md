---
date: "2026-11-02"
issue: "#343"
title: "The model proposes, the server decides"
---

A chat edit never changes a design by itself. The model returns a small patch, the server checks it with the same rules the engine uses, and the user confirms before a new version is saved. The proposal remembers the version it was made on, so confirming after the design moved is refused instead of silently merged.

Read: [chat edits tutorial](../../backend/tutorials/chat-edits.md)
