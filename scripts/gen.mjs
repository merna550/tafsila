// `pnpm gen <endpoint|feature|garment-module> [name] [issue]`: runs the matching `turbo gen` generator (issue #33).
// Without a name or issue the generator asks for them.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** The turbo binary installed in this repo (never looked up on PATH). */
const TURBO = fileURLToPath(new URL("../node_modules/.bin/turbo", import.meta.url));
const GENERATORS = ["endpoint", "feature", "garment-module"];

/**
 * Builds the `turbo gen` argument list for the command line given to `pnpm gen`.
 *
 * @param {string[]} argv Generator name followed by the optional answers (name, issue).
 * @returns {string[]} Arguments for the turbo binary.
 */
export function turboArgs(argv) {
  const [generator, ...answers] = argv;
  if (!GENERATORS.includes(generator)) {
    throw new Error(`Usage: pnpm gen <${GENERATORS.join("|")}> [name] [issue]`);
  }
  return ["gen", generator, ...(answers.length > 0 ? ["--args", ...answers] : [])];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = spawnSync(TURBO, turboArgs(process.argv.slice(2)), { stdio: "inherit" });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
