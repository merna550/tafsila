---
date: "2026-10-26"
issue: "#289"
title: "The export runs in its own worker"
---

Building a PDF takes seconds, so it runs in a second Web Worker (not the preview one) and the page only sees progress messages and the finished bytes. Cancel cannot interrupt a synchronous build, so it throws the worker away and makes a new one. The build guard now checks two marker groups (engine and pdf): each must be in a worker chunk and in no page chunk.

Read: [pdf-lib](../tech/pdf-lib.md)
