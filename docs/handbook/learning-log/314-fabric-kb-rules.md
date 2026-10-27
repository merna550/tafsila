---
date: "2026-10-27"
issue: "#314"
title: "Fabric recommendation as a small rule table"
---

Fabric advice is a table of rules, not code: each rule says "when the design has X, the fabric needs property P in a range" and is either a preference (changes the score) or a must (puts the fabric on the avoid list). The score is a plain sum, so a tailor can predict it. A test cross-checks the allowed rule paths against the DesignSpec schema, so a schema change cannot silently leave a rule pointing nowhere.

Read: [Drape](../glossary.md#drape) · [Body of a fabric](../glossary.md#fabric-body)
