---
packages: [pdf-lib, "@pdf-lib/fontkit", esbuild]
level: intermediate
adr: ADR-282
---

# pdf-lib, fontkit and esbuild

**In one line:** `pdf-lib` writes PDF files in the browser, `@pdf-lib/fontkit` lets it embed our Arabic font, and `esbuild` measures how big the PDF code is. Installed with #282.

## What it is (plain words)

A PDF page is a list of drawing instructions in points (1/72 inch). `pdf-lib` writes those instructions from JavaScript with no server. Embedding a custom font needs `fontkit`, which also joins Arabic letters into their connected shapes. `esbuild` is a fast bundler; we only use it in the spike script to measure the download size of the PDF code.

## Why we chose it

Print and projector PDFs (#288, #290) must be 1:1 in scale and carry Arabic labels, with no paid service and no server. See [ADR-282](../../decisions/282-pdf-library.md).

## Alternatives we considered (and why not)

pdfmake and jsPDF (no real Arabic shaping), glyph outlines drawn as paths (no selectable text), server-side rendering (paid tiers).

## When we would change it

A label that needs nested direction (brackets inside Arabic inside Latin), or a PDF code chunk over 500 KB gzip.

## Where it lives in our code

`packages/export/src/pdf/` (`units.ts`, `fonts.ts`, `arabic-text.ts`, `spike-pdf.ts`, `test-support/read-pdf.ts`); fonts in `apps/web/public/fonts/`; script `pnpm --filter @tafsila/export spike:pdf`.

## The 20% you need

- Points, not millimetres: `mmToPt(100)` is 283.46. The PDF origin is bottom-left, the engine's is top-left, so y flips (`drawSvgPath` does this).
- fontkit lays out a whole string as one direction. `shapeForPdf` splits a label into runs so Latin names and digits are not reversed.
- Embed with `subset: true` and a fixed `customName`: small files and byte-identical rebuilds.
- Tests wrap drawing in `/Tag BMC ... EMC` and read the numbers back with `read-pdf.ts`.

## Commands you'll use

`pnpm --filter @tafsila/export spike:pdf` writes `packages/export/spike-out/spike.pdf` and a PNG (needs `pdftoppm`).

## Common mistakes

Forgetting `registerFontkit` (custom fonts then fail); using millimetres as points; embedding without `customName` (random name, files differ every build).

## Learn more

[pdf-lib](https://pdf-lib.js.org/), [fontkit](https://github.com/foliojs/fontkit), [esbuild](https://esbuild.github.io/).
