import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createUnlimitedPlanLimits } from "../adapters/plan/unlimited-plan-limits";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { sizeM } from "@tafsila/test-fixtures";
import { createClient } from "./create-client";
import { deleteClient } from "./delete-client";
import { getClient } from "./get-client";
import { listClients } from "./list-clients";
import { saveMeasurementSet } from "./save-measurement-set";
import { updateClient } from "./update-client";

/**
 * Fresh memory dependencies per test.
 *
 * @param canAdd - Whether the plan allows adding clients.
 * @returns The store and the service dependencies.
 */
function setup(canAdd = true) {
  const store = createMemoryStore();
  const clients = createMemoryClientRepository(store);
  const measurementSets = createMemoryMeasurementSetRepository(store);
  const planLimits = canAdd ? createUnlimitedPlanLimits() : { canAddClient: () => Promise.resolve(false) };
  return { store, deps: { clients, measurementSets, planLimits } };
}

const a = authFor(USER_A);
const b = authFor(USER_B);

describe("create-client", () => {
  it("stores the client for the caller", async () => {
    const { deps } = setup();
    const client = await createClient(deps, a, { name: "منى", notes: "ملاحظة" });
    expect(client).toMatchObject({ name: "منى", notes: "ملاحظة" });
    expect((await getClient(deps, a, client.id)).id).toBe(client.id);
  });

  it("is refused with FORBIDDEN when the plan denies", async () => {
    const { deps } = setup(false);
    await expect(createClient(deps, a, { name: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("list-clients", () => {
  it("pages 25 clients and reports the total", async () => {
    const { deps } = setup();
    for (let i = 0; i < 25; i++) await createClient(deps, a, { name: `Client ${String(i)}` });
    const page = await listClients(deps, a, { limit: 10, offset: 20 });
    expect(page).toMatchObject({ total: 25, limit: 10, offset: 20 });
    expect(page.items).toHaveLength(5);
  });

  it("searches by name only, case-insensitively, and treats % literally", async () => {
    const { deps } = setup();
    await createClient(deps, a, { name: "Mona Ali", notes: "zzz" });
    await createClient(deps, a, { name: "Sara" });
    expect((await listClients(deps, a, { q: "MONA", limit: 20, offset: 0 })).total).toBe(1);
    expect((await listClients(deps, a, { q: "zzz", limit: 20, offset: 0 })).total).toBe(0);
    expect((await listClients(deps, a, { q: "%", limit: 20, offset: 0 })).total).toBe(0);
  });

  it("concatenated pages equal the full list in order, with no duplicates (property)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 1, max: 12 }), async (n, limit) => {
        const { deps } = setup();
        for (let i = 0; i < n; i++) await createClient(deps, a, { name: `c${String(i)}` });
        const all = (await listClients(deps, a, { limit: 100, offset: 0 })).items.map((c) => c.id);
        const pages: string[] = [];
        for (let offset = 0; offset < n; offset += limit) {
          pages.push(...(await listClients(deps, a, { limit, offset })).items.map((c) => c.id));
        }
        expect(pages).toEqual(all);
        expect(new Set(pages).size).toBe(pages.length);
      }),
      { numRuns: 30 },
    );
  });
});

describe("ownership", () => {
  it("answers NOT_FOUND for another user's client on get, update and delete", async () => {
    const { deps } = setup();
    const mine = await createClient(deps, a, { name: "mine" });
    await expect(getClient(deps, b, mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateClient(deps, b, mine.id, { name: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(deleteClient(deps, b, mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listClients(deps, b, { limit: 20, offset: 0 })).total).toBe(0);
  });
});

describe("update and delete", () => {
  it("changes only the given fields and clears notes with null", async () => {
    const { deps } = setup();
    const c = await createClient(deps, a, { name: "n", notes: "t" });
    expect(await updateClient(deps, a, c.id, { name: "m" })).toMatchObject({ name: "m", notes: "t" });
    expect(await updateClient(deps, a, c.id, { notes: null })).toMatchObject({ name: "m", notes: null });
  });

  it("deleting a client removes its measurement sets", async () => {
    const { deps, store } = setup();
    const c = await createClient(deps, a, { name: "n" });
    await saveMeasurementSet(deps, a, { clientId: c.id, label: "L", measurements: sizeM });
    await deleteClient(deps, a, c.id);
    expect(store.sets).toHaveLength(0);
  });
});
