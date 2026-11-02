---
date: "2026-11-02"
issue: "#346"
title: "An AI text with a guard"
---

The fabric explanation is the only free text the AI writes in Tafsila, so it is the one that needs a plain check after the model. The prompt gives only the fabrics and the rules' reasons, and a small function then looks for any other fabric name in the answer, in Arabic or English, and for a text that is too long. A bad text is sent back once with the problem, then refused. Good texts are saved per version, language and recommendation, so asking twice costs one call, and an admin editing a rule changes the key and gets a fresh text.

Read: [AI package guide](../../backend/ai.md)
