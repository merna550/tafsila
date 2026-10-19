import { sizeM, seedDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryDesignRepository } from "../adapters/memory/design-repository";
import { createMemoryStore, type MemoryStore } from "../adapters/memory/memory-store";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryProfileRepository } from "../adapters/memory/profile-repository";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { createDesign } from "./create-design";
import { deleteDesign } from "./delete-design";
import { getDesign } from "./get-design";
import { listDesigns } from "./list-designs";
import { renameDesign } from "./rename-design";

const a = authFor(USER_A);
const b = authFor(USER_B);
const PAGE = { limit: 20, offset: 0 };

/**
 * Fresh memory dependencies with a fixed clock that advances one minute per call.
 *
 * @returns The store and the service dependencies.
 */
function setup() {
  const store = createMemoryStore();
  let minute = 0;
  const clock = { now: () => new Date(Date.UTC(2026, 9, 19, 10, minute++)) };
  const deps = {
    designs: createMemoryDesignRepository(store, { now: clock.now }),
    profiles: createMemoryProfileRepository(store),
    clock,
  };
  return { store, deps };
}

/**
 * Stores a version of a design for a measurement set, and makes it the design's current one.
 *
 * @param store - The fake database.
 * @param designId - Design to extend.
 * @param measurementSetId - Set the version was made from.
 * @param status - Validation status of the version.
 */
function addVersion(
  store: MemoryStore,
  designId: string,
  measurementSetId: string | null,
  status: "pass" | "warn" = "pass",
): void {
  const design = store.designs.find((d) => d.id === designId);
  if (!design) throw new Error("no design");
  const versionNo = store.versions.filter((v) => v.designId === designId).length + 1;
  const id = crypto.randomUUID();
  store.versions.push({
    id,
    ownerId: design.ownerId,
    designId,
    versionNo,
    spec: seedDress,
    measurementSetId,
    measurements: sizeM,
    sizeLabel: "M",
    easeProfile: "regular",
    options: {},
    engineVersion: "0.16.0",
    validationStatus: status,
    inputHash: `h${versionNo}`,
    createdBy: "user",
    createdAt: "2026-10-19T10:00:00.000Z",
  });
  store.designs = store.designs.map((d) => (d.id === designId ? { ...d, currentVersionId: id } : d));
}

describe("create-design", () => {
  it("names an untitled design in Arabic by default, from the category and the Cairo date", async () => {
    const { deps } = setup();
    expect(await createDesign(deps, a, { category: "dress" })).toMatchObject({
      title: "فستان 2026-10-19",
      category: "dress",
      currentVersionId: null,
    });
  });

  it("uses English for an English profile and keeps a given title", async () => {
    const { store, deps } = setup();
    store.profiles.set(USER_A, { name: "A", locale: "en" });
    expect((await createDesign(deps, a, { category: "skirt" })).title).toBe("Skirt 2026-10-19");
    expect((await createDesign(deps, a, { category: "skirt", title: "Mine" })).title).toBe("Mine");
  });
});

describe("list-designs", () => {
  it("lists the newest update first, hides other users' designs and pages with a total", async () => {
    const { deps } = setup();
    const first = await createDesign(deps, a, { category: "dress", title: "first" });
    const second = await createDesign(deps, a, { category: "dress", title: "second" });
    await createDesign(deps, b, { category: "dress", title: "theirs" });
    await renameDesign(deps, a, first.id, { title: "first renamed" });
    const page = await listDesigns(deps, a, PAGE);
    expect(page.items.map((d) => d.id)).toEqual([first.id, second.id]);
    expect(page.total).toBe(2);
    expect((await listDesigns(deps, a, { limit: 1, offset: 1 })).items.map((d) => d.id)).toEqual([second.id]);
  });

  it("matches % in the title search literally", async () => {
    const { deps } = setup();
    await createDesign(deps, a, { category: "dress", title: "100% cotton" });
    await createDesign(deps, a, { category: "dress", title: "plain" });
    expect((await listDesigns(deps, a, { ...PAGE, q: "100%" })).items).toHaveLength(1);
    expect((await listDesigns(deps, a, { ...PAGE, q: "%" })).total).toBe(1);
  });

  it("summarises versions: 0 and none, then count, status and client name", async () => {
    const { store, deps } = setup();
    const design = await createDesign(deps, a, { category: "dress" });
    expect((await listDesigns(deps, a, PAGE)).items[0]?.summary).toEqual({
      versionCount: 0,
      currentStatus: null,
      clientName: null,
    });
    store.clients.push({
      id: "c1",
      ownerId: USER_A,
      name: "منى",
      notes: null,
      createdAt: "2026-10-19T09:00:00.000Z",
    });
    const set = await createMemoryMeasurementSetRepository(store).create(a, {
      clientId: "c1",
      label: "set",
      sizeLabel: "M",
      measurements: sizeM,
    });
    addVersion(store, design.id, set.id);
    addVersion(store, design.id, set.id, "warn");
    expect((await listDesigns(deps, a, PAGE)).items[0]?.summary).toEqual({
      versionCount: 2,
      currentStatus: "warn",
      clientName: "منى",
    });
  });

  it("filters by client through the sets of a design's versions", async () => {
    const { store, deps } = setup();
    const clients = createMemoryClientRepository(store);
    const sets = createMemoryMeasurementSetRepository(store);
    const mona = await clients.create(a, { name: "Mona" });
    const sara = await clients.create(a, { name: "Sara" });
    const monaSet = await sets.create(a, {
      clientId: mona.id,
      label: "m",
      sizeLabel: "M",
      measurements: sizeM,
    });
    const saraSet = await sets.create(a, {
      clientId: sara.id,
      label: "s",
      sizeLabel: "M",
      measurements: sizeM,
    });
    const forMona = await createDesign(deps, a, { category: "dress", title: "for mona" });
    const forSara = await createDesign(deps, a, { category: "dress", title: "for sara" });
    await createDesign(deps, a, { category: "dress", title: "no versions" });
    addVersion(store, forMona.id, monaSet.id);
    addVersion(store, forSara.id, saraSet.id);
    const page = await listDesigns(deps, a, { ...PAGE, clientId: mona.id });
    expect(page.items.map((d) => d.id)).toEqual([forMona.id]);
    expect(page.total).toBe(1);
  });
});

describe("get, rename and delete", () => {
  it("reads the current version's stored inputs", async () => {
    const { store, deps } = setup();
    const design = await createDesign(deps, a, { category: "dress" });
    expect((await getDesign(deps, a, design.id)).currentVersion).toBeNull();
    addVersion(store, design.id, null);
    const detail = await getDesign(deps, a, design.id);
    expect(detail.currentVersion).toMatchObject({ versionNo: 1, designId: design.id });
    expect(detail.design.currentVersionId).toBe(detail.currentVersion?.id);
  });

  it("renames only the title and touches updatedAt", async () => {
    const { deps } = setup();
    const design = await createDesign(deps, a, { category: "dress", title: "old" });
    const renamed = await renameDesign(deps, a, design.id, { title: "new" });
    expect(renamed).toMatchObject({ title: "new", category: "dress", createdAt: design.createdAt });
    expect(renamed.updatedAt > design.updatedAt).toBe(true);
  });

  it("deletes the design and its versions", async () => {
    const { store, deps } = setup();
    const design = await createDesign(deps, a, { category: "dress" });
    addVersion(store, design.id, null);
    await deleteDesign(deps, a, design.id);
    expect(store.versions).toHaveLength(0);
    await expect(getDesign(deps, a, design.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("behaves as if another user's design did not exist", async () => {
    const { deps } = setup();
    const design = await createDesign(deps, a, { category: "dress" });
    await expect(getDesign(deps, b, design.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(renameDesign(deps, b, design.id, { title: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(deleteDesign(deps, b, design.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
