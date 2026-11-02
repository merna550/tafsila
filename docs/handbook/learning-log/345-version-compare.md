---
date: "2026-11-02"
issue: "#345"
title: "Compare versions in the browser"
---

Comparing two saved versions needs no new API: the browser already has the stored inputs and the preview worker, so it drafts both and draws them in one SVG. Each piece of the second version is moved onto the corner of the same piece in the first (matched by id), so a longer sleeve grows in place instead of jumping to wherever the sheet packing put it. The list of changes is plain data: flatten both designs into one value per feature, keep the ones that differ, and word them with the messages the design picker already has.

Read: [Overlay](../glossary.md#overlay-compare)
