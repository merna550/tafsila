/** Spike 282 script: writes spike-out/spike.pdf (and a PNG when pdftoppm exists) and prints sizes. Run `pnpm --filter @tafsila/export spike:pdf`. */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { buildSync } from "esbuild";
import { tileInput } from "../src/tiles/tile-input";
import { buildSpikePdf } from "../src/pdf/spike-pdf";

/**
 * Prints one line to stdout.
 *
 * @param line - The text to print.
 */
function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

const fontDir = new URL("../../../apps/web/public/fonts/", import.meta.url);
const outDir = new URL("../spike-out/", import.meta.url).pathname;
/**
 * Reads one font file.
 *
 * @param name - File name in the fonts folder.
 * @returns The font bytes.
 */
const read = (name: string): Uint8Array => new Uint8Array(readFileSync(new URL(name, fontDir)));
const fonts = { regular: read("IBMPlexSansArabic-Regular.ttf"), bold: read("IBMPlexSansArabic-Bold.ttf") };

mkdirSync(outDir, { recursive: true });
const outline = tileInput(generatePattern(seedDress, sizeM)).outlines[0]!;
const pdf = await buildSpikePdf(fonts, outline);
writeFileSync(`${outDir}spike.pdf`, pdf);
try {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- dev-only script; pdftoppm is optional and found on PATH
  execFileSync("pdftoppm", ["-png", "-r", "40", "-singlefile", `${outDir}spike.pdf`, `${outDir}spike`]);
} catch {
  out("pdftoppm not found: PNG skipped");
}

const bundle = buildSync({
  stdin: {
    contents: 'export * from "./src/pdf/arabic-text"; export * from "./src/pdf/fonts";',
    resolveDir: new URL("..", import.meta.url).pathname,
  },
  bundle: true,
  minify: true,
  write: false,
  format: "esm",
  platform: "browser",
}).outputFiles[0]!.contents;
/** Bytes in a kilobyte. */
const BYTES_PER_KB = 1024;

/**
 * Formats a byte count.
 *
 * @param n - Bytes.
 * @returns The size in KB.
 */
const kb = (n: number): string => `${(n / BYTES_PER_KB).toFixed(1)} KB`;
out(`spike.pdf (font subset included): ${kb(pdf.length)}`);
out(
  `PDF code chunk (pdf-lib + fontkit + drawLabel): ${kb(bundle.length)} min, ${kb(gzipSync(bundle).length)} gzip`,
);
out(
  `Full fonts the worker fetches: Regular ${kb(fonts.regular.length)}, Bold ${kb(fonts.bold.length)}; gzip ${kb(gzipSync(fonts.regular).length + gzipSync(fonts.bold).length)}`,
);
