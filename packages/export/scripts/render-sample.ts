/** Writes the seed dress A4 PDF and PNGs of page 1 and one tile page (needs `pdftoppm`). Run `pnpm --filter @tafsila/export render:sample`. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { buildA4Pdf } from "../src/pdf/a4-pdf";
import { seedMeta, seedResult, seedScene, testFonts } from "../src/pdf/test-support/seed-pdf";

/**
 * Prints one line to stdout.
 *
 * @param line - The text to print.
 */
function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** Pages rendered to PNG: the cover and the first two tiles. */
const SAMPLE_PAGES = [1, 2, 3] as const; // eslint-disable-line no-magic-numbers -- page numbers, not magic
const outDir = new URL("../spike-out/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const started = performance.now();
const pdf = await buildA4Pdf(seedResult, seedScene, seedMeta, { fonts: testFonts });
out(
  `built ${pdf.pageCount} pages, ${pdf.bytes.length} bytes in ${Math.round(performance.now() - started)} ms`,
);
writeFileSync(`${outDir}a4.pdf`, pdf.bytes);
for (const page of SAMPLE_PAGES) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- dev-only script; pdftoppm is found on PATH
  execFileSync("pdftoppm", [
    "-png",
    "-r",
    "60",
    "-f",
    String(page),
    "-l",
    String(page),
    "-singlefile",
    `${outDir}a4.pdf`,
    `${outDir}a4-p${page}`,
  ]);
}
out(`wrote ${outDir}a4.pdf and a4-p1..p3.png`);
