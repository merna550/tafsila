/** Tests for chat edits with the fake provider and scripted test models (issue #337). */
import { aLineMidiSkirt, setInSleeveBlouse, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createFakeAi } from "./index";
import { collectPatch, proposeEdit } from "./propose-edit";
import { scriptedDeps, scriptedModel } from "./test-models";

describe("proposeEdit", () => {
  it("adds side pockets with the fake provider", async () => {
    const { patch, outcome } = await proposeEdit(
      { spec: vNeckHalfCircleDress, message: "add side pockets" },
      createFakeAi(),
    );
    expect(patch.ops).toEqual([{ op: "addPocket", type: "side-seam" }]);
    expect(outcome.ok).toBe(true);
  });

  it("explains an unsupported request with the closest option", async () => {
    const { patch } = await proposeEdit(
      { spec: aLineMidiSkirt, message: "make it a jumpsuit" },
      createFakeAi(),
    );
    expect(patch.ops).toEqual([]);
    expect(patch.unsupported?.closest).toEqual([{ op: "set", path: "category", value: "dress" }]);
  });

  it("understands an Arabic request with the fake provider", async () => {
    const { patch } = await proposeEdit(
      { spec: setInSleeveBlouse, message: "خلي الكم أطول" },
      createFakeAi(),
    );
    expect(patch.ops).toEqual([{ op: "set", path: "sleeve.length", value: "long" }]);
  });

  it("sends the history before the request", async () => {
    const model = scriptedModel([{ calls: [{ toolName: "addPocket", input: { type: "patch" } }] }]);
    const history = [
      { role: "user" as const, text: "hello" },
      { role: "assistant" as const, text: "hi" },
    ];
    await proposeEdit({ spec: aLineMidiSkirt, message: "pocket", history }, scriptedDeps(model));
    const roles = model.doGenerateCalls[0]!.prompt.map((message) => message.role);
    expect(roles).toEqual(["system", "user", "assistant", "user"]);
  });

  it("retries once after an invalid tool call", async () => {
    const model = scriptedModel([
      { calls: [{ toolName: "setFeature", input: { path: "sleeve.colour", value: "red" } }] },
      { calls: [{ toolName: "setFeature", input: { path: "sleeve.length", value: "elbow" } }] },
    ]);
    const { patch, usage } = await proposeEdit(
      { spec: setInSleeveBlouse, message: "x" },
      scriptedDeps(model),
    );
    expect(patch.ops).toEqual([{ op: "set", path: "sleeve.length", value: "elbow" }]);
    expect(usage.attempts).toBe(2);
  });

  it("returns unsupported after two refused patches", async () => {
    const refused = { calls: [{ toolName: "setFeature", input: { path: "skirt.type", value: "a-line" } }] };
    const model = scriptedModel([refused, refused]);
    const { patch, outcome } = await proposeEdit(
      { spec: setInSleeveBlouse, message: "x" },
      scriptedDeps(model),
    );
    expect(patch.ops).toEqual([]);
    expect(patch.unsupported?.text.en).toMatch(/could not apply/);
    expect(outcome).toMatchObject({ ok: true, changes: [] });
  });
});

describe("collectPatch", () => {
  it("turns each tool into its op", () => {
    const { patch } = collectPatch([
      { toolName: "setLength", input: { path: "skirt.lengthMm", mm: 600 } },
      { toolName: "removePocket", input: { type: "patch" } },
    ]);
    expect(patch.ops).toEqual([
      { op: "setLength", path: "skirt.lengthMm", mm: 600 },
      { op: "removePocket", type: "patch" },
    ]);
  });
});
