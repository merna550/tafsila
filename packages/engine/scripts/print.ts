/** `pnpm engine:print <fixture> <size> [--out file.svg]`: writes a 1:1 SVG toile sheet for a plotter print shop. */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { rectanglePattern, SIZE_MATRIX, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import type { PatternResult } from "@tafsila/schemas";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../src/pipeline";
import { rectangleRegistry } from "../src/pipeline/test-support/rectangle-module";
import { renderPrintSheet } from "../src/render";

/** Exit code: success. */
const EXIT_OK = 0;
/** Exit code: the pattern could not be produced. */
const EXIT_NO_PIECES = 1;
/** Exit code: wrong arguments. */
const EXIT_USAGE = 2;

/** Design fixtures the script can draft, by name. */
const DESIGN_FIXTURES = { vNeckHalfCircleDress } as const;

/** Name of the ready-made rectangle test pattern. */
const RECTANGLE = "rectangle";

/** Name of the test rectangle run through the pipeline, so its cut line shows the seam allowances (#130). */
const SEAM_RECTANGLE = "seam-rectangle";

/** Where the script writes its messages; replaced in tests. */
export interface PrintIo {
  /** Normal output. */
  readonly out: (line: string) => void;
  /** Error output. */
  readonly err: (line: string) => void;
}

/** Writes to the terminal. */
const DEFAULT_IO: PrintIo = {
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => console.error(line),
};

/** Parsed command line. */
interface Parsed {
  readonly fixture: string;
  readonly size: string;
  readonly out?: string;
}

/**
 * Usage text.
 *
 * @returns The help lines.
 */
function usage(): string {
  const names = [RECTANGLE, SEAM_RECTANGLE, ...Object.keys(DESIGN_FIXTURES)].join(" | ");
  const sizes = SIZE_MATRIX.map((e) => e.id).join(" ");
  return `Usage: pnpm engine:print <fixture> <size> [--out file.svg]\n  fixture: ${names}\n  size: ${sizes}`;
}

/**
 * Reads the command line.
 *
 * @param argv - Arguments after the script name.
 * @returns The parsed arguments, or undefined when they are wrong.
 */
function parseArgs(argv: readonly string[]): Parsed | undefined {
  const outAt = argv.indexOf("--out");
  const rest = outAt === -1 ? argv : argv.filter((_, i) => i !== outAt && i !== outAt + 1);
  const out = outAt === -1 ? undefined : argv[outAt + 1];
  if (rest.length !== 2 || (outAt !== -1 && !out)) return undefined;
  return { fixture: rest[0]!, size: rest[1]!, out };
}

/**
 * Builds the pattern for a fixture and size.
 *
 * @param fixture - Fixture name.
 * @param sizeId - Size matrix id.
 * @returns The pattern, or undefined when the fixture or size is unknown.
 */
function buildPattern(fixture: string, sizeId: string): PatternResult | undefined {
  const entry = SIZE_MATRIX.find((e) => e.id === sizeId);
  if (!entry) return undefined;
  if (fixture === RECTANGLE) return rectanglePattern;
  if (fixture === SEAM_RECTANGLE) {
    const options = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: entry.id };
    return generatePattern(vNeckHalfCircleDress, entry.measurements, options, rectangleRegistry);
  }
  const spec = DESIGN_FIXTURES[fixture as keyof typeof DESIGN_FIXTURES];
  return spec ? generatePattern(spec, entry.measurements, { sizeLabel: entry.id }) : undefined;
}

/**
 * Runs the command.
 *
 * @param argv - Arguments after the script name.
 * @param io - Output functions; defaults to the console.
 * @returns The exit code: 0 done, 1 no pieces to print, 2 wrong arguments.
 */
export function run(argv: readonly string[], io: PrintIo = DEFAULT_IO): number {
  const args = parseArgs(argv);
  const pattern = args && buildPattern(args.fixture, args.size);
  if (!args || !pattern) {
    io.err(usage());
    return EXIT_USAGE;
  }
  if (pattern.pieces.length === 0) {
    io.err(`Nothing to print: "${args.fixture}" produced no pieces yet (its garment modules are not built).`);
    return EXIT_NO_PIECES;
  }
  const file = args.out ?? `toile-${args.fixture}-${args.size}.svg`;
  writeFileSync(file, renderPrintSheet(pattern));
  io.out(`Wrote ${file}. Print at 100% (actual size) and check that the square measures 100 mm.`);
  return EXIT_OK;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = run(process.argv.slice(2));
}
