import { demoSizeChart, sizeM } from "@tafsila/test-fixtures";
import { fromStandardSize } from "@tafsila/engine";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { createClient } from "./create-client";
import { deleteMeasurementSet } from "./delete-measurement-set";
import { getMeasurementSet } from "./get-measurement-set";
import { listMeasurementSets } from "./list-measurement-sets";
import { saveMeasurementSet } from "./save-measurement-set";
import { updateMeasurementSet } from "./update-measurement-set";

/**
 * Fresh memory dependencies per test.
 *
 * @returns The store and the service dependencies.
 */
function setup() {
  const store = createMemoryStore();
  const clients = createMemoryClientRepository(store);
  const measurementSets = createMemoryMeasurementSetRepository(store);
  return {
    store,
    deps: { clients, measurementSets, planLimits: { canAddClient: () => Promise.resolve(true) } },
  };
}

const a = authFor(USER_A);
const b = authFor(USER_B);

describe("save-measurement-set", () => {
  it("saves a valid set with no warnings", async () => {
    const { deps } = setup();
    const set = await saveMeasurementSet(deps, a, { label: "L", measurements: sizeM });
    expect(set.warnings).toEqual([]);
    expect(set.clientId).toBeNull();
  });

  it("saves waist >= hip with the engine's warning", async () => {
    const { deps } = setup();
    const set = await saveMeasurementSet(deps, a, { label: "L", measurements: { ...sizeM, waist: 1100 } });
    expect(set.warnings.map((w) => w.code)).toContain("MEAS_WAIST_NOT_BELOW_HIP");
  });

  it("rejects highBust above bust with bilingual issues and stores nothing", async () => {
    const { deps, store } = setup();
    const promise = saveMeasurementSet(deps, a, {
      label: "L",
      measurements: { ...sizeM, highBust: 1000, bust: 900 },
    });
    await expect(promise).rejects.toMatchObject({ code: "MEASUREMENTS_INVALID", status: 422 });
    const error = (await promise.catch((e: unknown) => e)) as {
      details: { issues: { message_ar: string; message_en: string }[]; fields: Record<string, string> };
    };
    for (const issue of error.details.issues) {
      expect(issue.message_ar).toBeTruthy();
      expect(issue.message_en).toBeTruthy();
    }
    expect(Object.keys(error.details.fields)).toContain("highBust");
    expect(store.sets).toHaveLength(0);
  });

  it("rejects a value below the engine range", async () => {
    const { deps } = setup();
    await expect(
      saveMeasurementSet(deps, a, { label: "L", measurements: { ...sizeM, bust: 60 } }),
    ).rejects.toMatchObject({ code: "MEASUREMENTS_INVALID" });
  });

  it("refuses another user's client with NOT_FOUND", async () => {
    const { deps } = setup();
    const theirs = await createClient(deps, b, { name: "theirs" });
    await expect(
      saveMeasurementSet(deps, a, { clientId: theirs.id, label: "L", measurements: sizeM }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("every placeholder chart size saves without errors (property)", async () => {
    const { deps } = setup();
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...Object.keys(demoSizeChart)), async (label) => {
        const set = await saveMeasurementSet(deps, a, {
          label,
          sizeLabel: label,
          measurements: fromStandardSize(demoSizeChart, label),
        });
        expect(set.sizeLabel).toBe(label);
      }),
    );
  });

  it("small overrides of a valid set never produce errors (property)", async () => {
    const { deps } = setup();
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: -20, max: 20 }), async (delta) => {
        const measurements = { ...sizeM, waist: sizeM.waist + delta, neck: sizeM.neck + delta };
        await expect(saveMeasurementSet(deps, a, { label: "L", measurements })).resolves.toBeDefined();
      }),
    );
  });
});

describe("read, update, delete", () => {
  it("returns fresh warnings on get and list, and filters by client", async () => {
    const { deps } = setup();
    const c = await createClient(deps, a, { name: "c" });
    const set = await saveMeasurementSet(deps, a, {
      clientId: c.id,
      label: "L",
      measurements: { ...sizeM, waist: 1100 },
    });
    await saveMeasurementSet(deps, a, { label: "other", measurements: sizeM });
    expect((await getMeasurementSet(deps, a, set.id)).warnings).not.toHaveLength(0);
    const filtered = await listMeasurementSets(deps, a, { clientId: c.id, limit: 20, offset: 0 });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.warnings).not.toHaveLength(0);
    expect((await listMeasurementSets(deps, a, { limit: 20, offset: 0 })).total).toBe(2);
  });

  it("update re-validates and keeps the client", async () => {
    const { deps } = setup();
    const c = await createClient(deps, a, { name: "c" });
    const set = await saveMeasurementSet(deps, a, { clientId: c.id, label: "L", measurements: sizeM });
    await expect(
      updateMeasurementSet(deps, a, set.id, {
        label: "L",
        measurements: { ...sizeM, highBust: 1000, bust: 900 },
      }),
    ).rejects.toMatchObject({ code: "MEASUREMENTS_INVALID" });
    const updated = await updateMeasurementSet(deps, a, set.id, { label: "New", measurements: sizeM });
    expect(updated).toMatchObject({ label: "New", clientId: c.id });
  });

  it("another user gets NOT_FOUND on get, update and delete", async () => {
    const { deps } = setup();
    const set = await saveMeasurementSet(deps, a, { label: "L", measurements: sizeM });
    await expect(getMeasurementSet(deps, b, set.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      updateMeasurementSet(deps, b, set.id, { label: "x", measurements: sizeM }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteMeasurementSet(deps, b, set.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await deleteMeasurementSet(deps, a, set.id);
    await expect(getMeasurementSet(deps, a, set.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
