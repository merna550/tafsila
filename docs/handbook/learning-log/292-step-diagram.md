---
date: "2026-10-26"
issue: "#292"
title: "Highlighting the current step on the diagram"
---

The current step is plain state: the tapped step, else the first unticked one. The diagram only reads the plan, so the distance lines come from the worker adapter, not from the component, and the drawing stays out of the main bundle's geometry. SVG with `data-` attributes keeps the highlight testable without a DOM.

Read: [Web Worker](../tech/README.md)
