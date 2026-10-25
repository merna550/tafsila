---
date: "2026-10-25"
issue: "#282"
title: "Arabic labels in a PDF"
---

A PDF library can join Arabic letters, but it lays a mixed string out as one right-to-left run, so a Latin name like "Nour" comes out as "ruoN" and a digit group "١٢" as "٢١". We split each label into direction runs, order the runs ourselves and draw them one by one. The PDF measures in points (1/72 inch), so 100 mm is 283.46 pt, and the page's y axis points up while the engine's points down. Tests read numbers back from the PDF by wrapping the drawing in tagged marked content.

Read: [pdf-lib](../tech/pdf-lib.md)
