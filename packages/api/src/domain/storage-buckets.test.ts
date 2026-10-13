import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORAGE_BUCKETS } from "./storage-buckets";

const CONFIG_PATH = join(__dirname, "../../../../supabase/config.toml");

/**
 * Reads the bucket names declared as `[storage.buckets.<name>]` in supabase/config.toml (commented lines are ignored).
 *
 * @returns Bucket names in file order.
 */
function declaredBuckets(): string[] {
  return [...readFileSync(CONFIG_PATH, "utf8").matchAll(/^\[storage\.buckets\.([A-Za-z0-9_-]+)\]/gm)].map(
    (match) => match[1] ?? "",
  );
}

describe("storage bucket registry", () => {
  it("equals the buckets declared in supabase/config.toml, so account deletion cannot miss one", () => {
    expect([...STORAGE_BUCKETS].sort((a, b) => a.localeCompare(b))).toEqual(
      declaredBuckets().sort((a, b) => a.localeCompare(b)),
    );
  });
});
