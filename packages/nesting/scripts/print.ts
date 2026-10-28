/**
 * Prints the prepared shapes of a fixture design (#315), or with `nest` first its placement and length to buy (#316):
 * `pnpm --filter @tafsila/nesting print [nest] <fixture> [folded|open] [widthCm] [size]`.
 */
import { generatePattern } from "@tafsila/engine";
import { fabricOptionsSchema } from "@tafsila/schemas";
import * as fixtures from "@tafsila/test-fixtures";
import { fabricResult, preparePieces } from "../src";

/** Millimetres in a centimetre. */
const MM_PER_CM = 10;
/** Column width of the shape id. */
const ID_COLUMN = 36;

/**
 * Writes one line to standard output.
 *
 * @param line - The text.
 */
function out(line: string): void {
  process.stdout.write(`${line}\n`);
}

const args = process.argv.slice(2);
const placing = args[0] === "nest";
const [name = "seedDress", layout = "folded", widthCm = "140", size = "M"] = placing ? args.slice(1) : args;
const spec = (fixtures as Record<string, unknown>)[name];
const measurements = fixtures.egyptianSizeChart[size];
if (!spec || !measurements) {
  console.error(
    "Usage: pnpm --filter @tafsila/nesting print [nest] <fixture, e.g. seedDress> [folded|open] [widthCm] [size]",
  );
  process.exit(1);
}
const options = fabricOptionsSchema.parse({ layout, widthMm: Number(widthCm) * MM_PER_CM });
const pattern = generatePattern(spec, measurements);
if (placing) {
  const result = fabricResult(pattern, options);
  out(`${name} size ${size}, ${widthCm} cm ${layout}, nesting ${result.nestingVersion}`);
  for (const kind of ["main", "lining", "interfacing"] as const) {
    const r = result[kind];
    out(
      `\n${kind}: buy ${r.lengthM} m (strip ${r.stripLengthMm.toFixed(0)} mm, ${r.rows} rows, order ${r.order})`,
    );
    for (const p of r.placements) {
      out(`  ${p.shapeId.padEnd(ID_COLUMN)} x ${p.xMm.toFixed(0)} y ${p.yMm.toFixed(0)} turn ${p.rotation}`);
    }
    for (const d of r.doesNotFit) out(`  does not fit: ${d.pieceId}`);
  }
  process.exit(0);
}
const prepared = preparePieces(pattern, options);
out(`${name} size ${size}, ${widthCm} cm ${layout}: usable width ${prepared.usableWidthMm} mm`);
for (const kind of ["main", "lining", "interfacing"] as const) {
  out(`\n${kind} (${prepared[kind].length} shapes)`);
  for (const s of prepared[kind]) {
    const flags = [s.fold ? "fold" : "", s.mirrored ? "mirrored" : ""].filter(Boolean).join(", ");
    out(
      `  ${s.id.padEnd(ID_COLUMN)} ${s.bbox.lengthMm.toFixed(0)} x ${s.bbox.widthMm.toFixed(0)} mm ${flags}`,
    );
  }
}
for (const d of prepared.doesNotFit) {
  out(`\ndoes not fit: ${d.pieceId} is ${d.widthMm.toFixed(0)} mm across (usable ${d.usableWidthMm} mm)`);
}
if (prepared.suggestOpen) out("suggest: open layout");
