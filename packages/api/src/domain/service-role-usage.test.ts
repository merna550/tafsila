import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(__dirname, "..");
/** The only files that may hold the Supabase service role key (decision 27a, 8) besides the container that wires them. */
const ALLOWED = [
  "adapters/supabase/gotrue-account-deleter.ts",
  "adapters/supabase/storage-files-remover.ts",
  "container.ts",
];

/**
 * Lists every non-test TypeScript file under a folder.
 *
 * @param dir - Folder to scan.
 * @returns Absolute file paths.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

describe("service role key usage", () => {
  it("is read only by the two admin adapters and the container", () => {
    const users = sourceFiles(SRC_DIR)
      .filter((file) => /serviceRoleKey|SERVICE_ROLE/.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC_DIR, file));
    expect([...users].sort((a, b) => a.localeCompare(b))).toEqual(ALLOWED);
  });
});
