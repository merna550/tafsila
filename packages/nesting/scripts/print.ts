/** Prints the prepared shapes of a fixture design (#315): `pnpm --filter @tafsila/nesting print <fixture> [folded|open] [widthCm] [size]`. */
import { generatePattern } from "@tafsila/engine";
import { fabricOptionsSchema } from "@tafsila/schemas";
import * as fixtures from "@tafsila/test-fixtures";
import { preparePieces } from "../src";

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

const [name = "seedDress", layout = "folded", widthCm = "140", size = "M"] = process.argv.slice(2);
const spec = (fixtures as Record<string, unknown>)[name];
const measurements = fixtures.egyptianSizeChart[size];
if (!spec || !measurements) {
  console.error(
    "Usage: pnpm --filter @tafsila/nesting print <fixture, e.g. seedDress> [folded|open] [widthCm] [size]",
  );
  process.exit(1);
}
const options = fabricOptionsSchema.parse({ layout, widthMm: Number(widthCm) * MM_PER_CM });
const prepared = preparePieces(generatePattern(spec, measurements), options);
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
