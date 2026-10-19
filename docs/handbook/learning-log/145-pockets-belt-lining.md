---
date: "2026-10-19"
issue: "#145"
title: "Pockets, belt and lining"
---

Pockets, belt and lining are late engine modules that only add or copy pieces: a pocket is a notch on the side seam plus a bag, the belt is a strip split at the fabric width, and the lining is a copy of the shell with its hem lifted. The shared "find the side seam by piece id" helper moved to `pieces/seam-chain.ts` because modules must not import each other. What to do about a refused combination is data (`POCKET_MATRIX`), not code.

Read: [Garment assembly](../../decisions/144-garment-assembly.md), [Pockets, belt and lining](../../decisions/145-pockets-belt-lining.md)
