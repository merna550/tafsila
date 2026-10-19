/** Benchmark of the heaviest catalogue design (issue #147): run with `pnpm --filter @tafsila/engine exec vitest bench`. */
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { bench, describe } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";

describe("generatePattern", () => {
  bench("dress with half-circle skirt on size M", () => {
    generatePattern(vNeckHalfCircleDress, sizeM, DEFAULT_ENGINE_OPTIONS);
  });
});
