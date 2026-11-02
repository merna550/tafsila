---
date: "2026-11-02"
issue: "#340"
title: "A background job behind a queue port"
---

Analysing photos takes seconds and costs money, so the API answers 202 and a job does the work. The job sits behind a `JobQueue` port: tests and local runs use an inline queue, staging uses Inngest. Cost controls (daily cap, per-minute limit, one run per design) sit in front of the queue.

Read: [Inngest](../tech/inngest.md), [ai-analysis tutorial](../../backend/tutorials/ai-analysis.md)
