import { ENGINE_VERSION } from "@tafsila/engine";
import type { DesignSpec } from "@tafsila/schemas";
import { egyptianSizeChart, seedDress, sideZipDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryDesignRepository } from "../adapters/memory/design-repository";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryPatternVersionRepository } from "../adapters/memory/pattern-version-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { NotFoundError } from "../domain/errors";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { getPatternVersion } from "./get-pattern-version";
import { listPatternVersions } from "./list-pattern-versions";
import { restorePatternVersion } from "./restore-pattern-version";
import { savePatternVersion } from "./save-pattern-version";

const a = authFor(USER_A);
const b = authFor(USER_B);
const OPTIONS = {
  fabricWidthMm: 1400,
  seamAllowance: { defaultsMm: { side: 15, neckline: 10, armhole: 10, hem: 30, other: 15 }, perEdgeMm: {} },
};

/**
 * Fresh memory dependencies with a design of user A and a size M measurement set (the set belongs to a client).
 *
 * @returns Dependencies and the ids.
 */
async function setup() {
  const store = createMemoryStore();
  const events: { event: string; properties: unknown }[] = [];
  const deps = {
    designs: createMemoryDesignRepository(store),
    measurementSets: createMemoryMeasurementSetRepository(store),
    clients: createMemoryClientRepository(store),
    versions: createMemoryPatternVersionRepository(store),
    clock: { now: () => new Date(Date.UTC(2026, 9, 19, 10)) },
    analytics: {
      capture: (_id: string, event: string, properties?: unknown) => {
        events.push({ event, properties });
      },
    },
  };
  const client = await deps.clients.create(a, { name: "منى" });
  const set = await deps.measurementSets.create(a, {
    clientId: client.id,
    label: "منى M",
    sizeLabel: "M",
    measurements: sizeM,
  });
  const design = await deps.designs.create(a, { category: "dress", title: "d" });
  return { store, deps, events, set, design };
}

/**
 * Builds a save body.
 *
 * @param spec - Design spec.
 * @param measurementSetId - Set id.
 * @returns The input.
 */
const body = (spec: DesignSpec, measurementSetId: string) => ({
  spec,
  measurementSetId,
  easeProfile: "regular" as const,
  options: OPTIONS,
});

describe("save-pattern-version", () => {
  it("saves a pass as v1 and a warn as v2, and moves the design's current version", async () => {
    const { deps, set, design, events } = await setup();
    const first = await savePatternVersion(deps, a, design.id, body(seedDress, set.id));
    expect(first.result.reused).toBe(false);
    expect(first.result.version).toMatchObject({
      versionNo: 1,
      validationStatus: "pass",
      engineVersion: ENGINE_VERSION,
      sizeLabel: "M",
    });
    expect(first.result.version.options).toMatchObject({ clientLabel: "منى", fabricWidthMm: 1400 });
    const second = await savePatternVersion(deps, a, design.id, body(sideZipDress, set.id));
    expect(second.result.version).toMatchObject({ versionNo: 2, validationStatus: "warn" });
    expect((await deps.designs.get(a, design.id))?.design.currentVersionId).toBe(second.result.version.id);
    expect(events.map((e) => e.event)).toEqual(["pattern_version_saved", "pattern_version_saved"]);
  });

  it("refuses a spec the engine fails with PATTERN_INVALID and writes nothing", async () => {
    const { store, deps, set, design } = await setup();
    const refused = {
      ...seedDress,
      bodice: { ...seedDress.bodice, waistSeam: false },
      skirt: { type: "gathered", length: "knee" },
    } as DesignSpec;
    const error = await savePatternVersion(deps, a, design.id, body(refused, set.id)).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ code: "PATTERN_INVALID", details: { report: { status: "fail" } } });
    expect(store.versions).toHaveLength(0);
    expect((await deps.designs.get(a, design.id))?.design.currentVersionId).toBeNull();
  });

  it("returns the same version for the same inputs and writes no second row", async () => {
    const { store, deps, set, design } = await setup();
    const first = await savePatternVersion(deps, a, design.id, body(seedDress, set.id));
    const again = await savePatternVersion(deps, a, design.id, body(seedDress, set.id));
    expect(again.result.reused).toBe(true);
    expect(again.result.version.id).toBe(first.result.version.id);
    expect(store.versions).toHaveLength(1);
  });

  it("rejects another category (VALIDATION_FAILED), a foreign set and a foreign design (404)", async () => {
    const { deps, set, design } = await setup();
    const skirt = { ...seedDress, category: "skirt" } as unknown as DesignSpec;
    await expect(savePatternVersion(deps, a, design.id, body(skirt, set.id))).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    await expect(savePatternVersion(deps, b, design.id, body(seedDress, set.id))).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const theirs = await deps.designs.create(b, { category: "dress", title: "b" });
    await expect(savePatternVersion(deps, b, theirs.id, body(seedDress, set.id))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("restore, list and read", () => {
  it("restores an older version as n+1 and returns the current one unchanged", async () => {
    const { deps, set, design } = await setup();
    const v1 = (await savePatternVersion(deps, a, design.id, body(seedDress, set.id))).result.version;
    const v2 = (await savePatternVersion(deps, a, design.id, body(sideZipDress, set.id))).result.version;
    const restored = await restorePatternVersion(deps, a, v1.id);
    expect(restored.result.reused).toBe(false);
    expect(restored.result.version).toMatchObject({ versionNo: 3, spec: v1.spec, inputHash: v1.inputHash });
    const same = await restorePatternVersion(deps, a, restored.result.version.id);
    expect(same.result).toMatchObject({ reused: true, version: { id: restored.result.version.id } });
    expect(v2.versionNo).toBe(2);
  });

  it("restores the measurements snapshot, not the edited set", async () => {
    const { deps, set, design } = await setup();
    const v1 = (await savePatternVersion(deps, a, design.id, body(seedDress, set.id))).result.version;
    await savePatternVersion(deps, a, design.id, body(sideZipDress, set.id));
    await deps.measurementSets.update(a, set.id, {
      label: set.label,
      measurements: { ...set.measurements, bust: set.measurements.bust + 20 },
    });
    const restored = await restorePatternVersion(deps, a, v1.id);
    expect(restored.result.version.inputHash).toBe(v1.inputHash);
    expect(restored.result.version.measurements).toEqual(v1.measurements);
  });

  it("lists newest first with isCurrent, and hides other users' versions", async () => {
    const { deps, set, design } = await setup();
    await savePatternVersion(deps, a, design.id, body(seedDress, set.id));
    const v2 = (await savePatternVersion(deps, a, design.id, body(sideZipDress, set.id))).result.version;
    const page = await listPatternVersions(deps, a, design.id, { limit: 20, offset: 0 });
    expect(page.items.map((i) => [i.versionNo, i.isCurrent])).toEqual([
      [2, true],
      [1, false],
    ]);
    expect(page.items[0]).not.toHaveProperty("spec");
    await expect(listPatternVersions(deps, b, design.id, { limit: 20, offset: 0 })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(getPatternVersion(deps, b, v2.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(restorePatternVersion(deps, b, v2.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reads a version with a fresh pattern and flags an older engine version", async () => {
    const { store, deps, set, design } = await setup();
    const v1 = (await savePatternVersion(deps, a, design.id, body(seedDress, set.id))).result.version;
    const fresh = await getPatternVersion(deps, a, v1.id);
    expect(fresh.pattern.pieces.length).toBeGreaterThan(0);
    expect(fresh.engineChanged).toBe(false);
    store.versions = store.versions.map((v) => ({ ...v, engineVersion: "0.0.1" }));
    expect((await getPatternVersion(deps, a, v1.id)).engineChanged).toBe(true);
  });
});

describe("engine speed", () => {
  it("drafts the seed dress in under 2 s for the smallest and the largest chart size", async () => {
    const { deps, design } = await setup();
    for (const size of ["S", "XXL"]) {
      const measurements = egyptianSizeChart[size];
      if (!measurements) throw new Error(`no size ${size}`);
      const set = await deps.measurementSets.create(a, { label: size, sizeLabel: size, measurements });
      const started = performance.now();
      const saved = await savePatternVersion(deps, a, design.id, body(seedDress, set.id));
      const ms = Math.round(performance.now() - started);
      console.warn(`engine save ${size}: ${ms} ms`);
      expect(saved.result.report.status).not.toBe("fail");
      expect(ms).toBeLessThan(2000);
    }
  });
});
