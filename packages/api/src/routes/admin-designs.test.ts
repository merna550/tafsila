import { adminSharedDesignPageSchema, adminUnsupportedFeaturePageSchema } from "@tafsila/schemas";
import { seedDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

const ADMIN = "cccccccc-0000-4000-8000-00000000000c";
const DESIGN_A = "a0000000-0000-4000-8000-0000000000d1";
const DESIGN_B = "b0000000-0000-4000-8000-0000000000d2";
const VERSION_A = "a0000000-0000-4000-8000-0000000000f1";
const VERSION_B = "b0000000-0000-4000-8000-0000000000f2";
const PHOTO_A = `${USER_A}/${DESIGN_A}/front.jpg`;
const asAdmin = { userId: ADMIN, role: "admin" };

/**
 * Adds a design with one version (carrying measurements) to the fake database.
 *
 * @param api - The memory app.
 * @param ids - Owner, design and version ids.
 * @param photoPaths - Stored photo paths.
 */
function addDesign(
  api: MemoryApp,
  ids: { ownerId: string; designId: string; versionId: string },
  photoPaths: string[],
): void {
  const { ownerId, designId, versionId } = ids;
  api.store.designs.push({
    id: designId,
    ownerId,
    category: "dress",
    title: `Design ${designId.slice(0, 1)}`,
    currentVersionId: versionId,
    createdAt: ownerId === USER_A ? "2026-11-01T10:00:00.000Z" : "2026-11-02T10:00:00.000Z",
    updatedAt: "2026-11-02T10:00:00.000Z",
    photoPaths,
  });
  api.store.versions.push({
    id: versionId,
    ownerId,
    designId,
    versionNo: 1,
    spec: seedDress,
    measurementSetId: "e0000000-0000-4000-8000-0000000000e1",
    measurements: { bust: 920 } as never,
    sizeLabel: "M",
    easeProfile: "regular",
    options: {},
    engineVersion: "0.16.0",
    validationStatus: "pass",
    inputHash: "h1",
    createdBy: "user",
    createdAt: "2026-11-01T10:00:00.000Z",
  });
}

/**
 * Creates the app with an admin, two owners with one design each, and USER_A's photo stored.
 *
 * @returns The memory app.
 */
async function seeded(): Promise<MemoryApp> {
  const api = await createMemoryApp();
  const user = (id: string, name: string, role: "user" | "admin") => ({
    id,
    name,
    email: null,
    phone: null,
    phoneVerifiedAt: null,
    createdAt: "2026-10-10T10:00:00.000Z",
    lastSignInAt: null,
    locale: "ar" as const,
    role,
  });
  api.store.users.push(
    user(ADMIN, "Merna", "admin"),
    user(USER_A, "Mona", "user"),
    user(USER_B, "Sara", "user"),
  );
  addDesign(api, { ownerId: USER_A, designId: DESIGN_A, versionId: VERSION_A }, [
    PHOTO_A,
    `${USER_A}/${DESIGN_A}/back.jpg`,
  ]);
  addDesign(api, { ownerId: USER_B, designId: DESIGN_B, versionId: VERSION_B }, []);
  api.photos.put(PHOTO_A);
  return api;
}

/**
 * Collects every object key in a JSON value, at any depth.
 *
 * @param value - Parsed JSON.
 * @returns All keys.
 */
function deepKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(deepKeys);
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, inner]) => [key, ...deepKeys(inner)]);
  return [];
}

describe("admin design routes access", () => {
  const paths = ["/admin/designs", "/admin/unsupported-features"];

  it.each(paths)("%s answers 401 without a token", async (path) => {
    const api = await seeded();
    expect((await api.call(undefined, "GET", path)).status).toBe(401);
  });

  it.each(paths)("%s answers 403 FORBIDDEN for a normal user and a stale admin token", async (path) => {
    const api = await seeded();
    for (const who of [
      { userId: USER_A, role: "user" },
      { userId: USER_A, role: "admin" },
    ]) {
      const res = await api.callAs(who, "GET", path);
      expect(res.status).toBe(403);
      expect(((await res.json()) as { code: string }).code).toBe("FORBIDDEN");
    }
    expect(api.store.audit).toHaveLength(0);
  });
});

describe("GET /api/admin/designs", () => {
  it("lists nothing until an owner consents, then only that owner's design, and again nothing after withdrawal", async () => {
    const api = await seeded();
    const list = async () =>
      adminSharedDesignPageSchema.parse(await (await api.callAs(asAdmin, "GET", "/admin/designs")).json());
    expect((await list()).total).toBe(0);
    await api.call(USER_A, "PATCH", "/profile", { shareDesigns: true });
    const page = await list();
    expect(page.items.map((d) => d.designId)).toEqual([DESIGN_A]);
    expect(page.items[0]).toMatchObject({ ownerDisplayName: "Mona", category: "dress" });
    await api.call(USER_A, "PATCH", "/profile", { shareDesigns: false });
    expect((await list()).total).toBe(0);
  });

  it("signs photos that exist for five minutes and never returns measurement keys", async () => {
    const api = await seeded();
    await api.call(USER_A, "PATCH", "/profile", { shareDesigns: true });
    const body: unknown = await (await api.callAs(asAdmin, "GET", "/admin/designs")).json();
    const page = adminSharedDesignPageSchema.parse(body);
    expect(page.items[0]?.photos).toEqual([{ path: PHOTO_A, url: `memory://read/${PHOTO_A}?expires=300` }]);
    const keys = deepKeys(body);
    for (const forbidden of ["measurements", "measurementSetId", "measurement_set_id", "notes", "clientId"])
      expect(keys).not.toContain(forbidden);
  });

  it("pages newest first and writes an audit row per call", async () => {
    const api = await seeded();
    await api.call(USER_A, "PATCH", "/profile", { shareDesigns: true });
    await api.call(USER_B, "PATCH", "/profile", { shareDesigns: true });
    const first = adminSharedDesignPageSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/designs?limit=1&offset=0")).json(),
    );
    const second = adminSharedDesignPageSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/designs?limit=1&offset=1")).json(),
    );
    expect([first.items[0]?.designId, second.items[0]?.designId]).toEqual([DESIGN_B, DESIGN_A]);
    expect([first.total, second.total]).toEqual([2, 2]);
    expect(api.store.audit.map((row) => [row.who, row.action])).toEqual([
      [ADMIN, "admin.designs.list"],
      [ADMIN, "admin.designs.list"],
    ]);
  });
});

describe("GET /api/admin/unsupported-features", () => {
  it("lists text and category without any user or design id, and audits the call", async () => {
    const api = await seeded();
    await api.unsupported.recordMany(USER_A, DESIGN_A, ["detachable bow", "ruffle hem"]);
    const body: unknown = await (await api.callAs(asAdmin, "GET", "/admin/unsupported-features")).json();
    const page = adminUnsupportedFeaturePageSchema.parse(body);
    expect(page.total).toBe(2);
    expect(page.items.map((row) => row.text).toSorted((a, b) => a.localeCompare(b))).toEqual([
      "detachable bow",
      "ruffle hem",
    ]);
    expect(page.items[0]?.category).toBe("dress");
    const text = JSON.stringify(body);
    expect(text).not.toContain(USER_A);
    expect(text).not.toContain(DESIGN_A);
    expect(api.store.audit.map((row) => row.action)).toEqual(["admin.unsupported.list"]);
  });
});
