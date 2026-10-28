import { NESTING_VERSION } from "@tafsila/nesting";
import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { linedSidePocketDress, seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { runFabric } from "./fabric-handler";
import type { FabricMessage, FabricRequest } from "./protocol";

/**
 * Builds a request.
 *
 * @param spec - The design to draft.
 * @param options - Overrides of the default fabric options.
 * @returns The request.
 */
function request(spec: unknown, options: Partial<typeof DEFAULT_FABRIC_OPTIONS> = {}): FabricRequest {
  return { id: 4, input: { spec, measurements: sizeM }, options: { ...DEFAULT_FABRIC_OPTIONS, ...options } };
}

describe("runFabric", () => {
  it("returns a length for the main fabric and a scene with one piece per placement", () => {
    const seen: FabricMessage[] = [];
    const answer = runFabric(request(seedDress), (m) => seen.push(m));
    expect(answer).toMatchObject({ id: 4, ok: true, nestingVersion: NESTING_VERSION });
    if (!("ok" in answer) || !answer.ok) throw new Error("expected an answer");
    const main = answer.kinds.find((k) => k.kind === "main");
    expect(main?.lengthM).toBeGreaterThan(0);
    expect(main?.scene.pieces).toHaveLength(main?.placements.length ?? -1);
    expect(main?.scene.lines.map((l) => l.kind)).toContain("fold");
    expect(answer.doesNotFit).toEqual([]);
  });

  it("reports the draft and nest steps in order", () => {
    const seen: FabricMessage[] = [];
    runFabric(request(seedDress), (m) => seen.push(m));
    expect(seen).toEqual([
      { id: 4, progress: { stage: "draft" } },
      { id: 4, progress: { stage: "nest" } },
    ]);
  });

  it("lists a lining for a lined design", () => {
    const answer = runFabric(request(linedSidePocketDress), () => undefined);
    if (!("ok" in answer) || !answer.ok) throw new Error("expected an answer");
    expect(answer.kinds.map((k) => k.kind)).toContain("lining");
  });

  it("answers an error for an input the engine rejects, instead of throwing", () => {
    const answer = runFabric(request({ garment: "nope" }), () => undefined);
    expect(answer).toMatchObject({ id: 4, ok: false });
  });
});
