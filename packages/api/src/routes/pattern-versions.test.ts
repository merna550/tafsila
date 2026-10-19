import { ENGINE_VERSION } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { beforeAll, describe, expect, it } from "vitest";
import type { Analytics } from "../ports/analytics";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

const captured: { event: string; properties: unknown }[] = [];
const analytics: Analytics = {
  capture: (_id, event, properties) => {
    captured.push({ event, properties });
  },
};
let api: MemoryApp;
beforeAll(async () => {
  api = await createMemoryApp({ analytics });
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  code: string;
  reused: boolean;
  version: { id: string; versionNo: number; engineVersion: string };
  report: { status: string };
  pattern: { pieces: unknown[] };
  engineChanged: boolean;
  total: number;
  items: { versionNo: number; isCurrent: boolean }[];
  details: { report: { status: string } };
}

/**
 * Reads the JSON body of a response.
 *
 * @param res - The response.
 * @returns The parsed body.
 */
async function body(res: Response): Promise<Json> {
  return (await res.json()) as Json;
}

/**
 * Creates a dress design and a measurement set for a user.
 *
 * @param userId - Owner.
 * @returns Their ids.
 */
async function seed(userId: string): Promise<{ designId: string; setId: string }> {
  const design = await body(await api.call(userId, "POST", "/designs", { category: "dress", title: "t" }));
  const set = await body(
    await api.call(userId, "POST", "/measurements", { label: "M", sizeLabel: "M", measurements: sizeM }),
  );
  return { designId: design.id, setId: set.id };
}

/**
 * The save body for a spec.
 *
 * @param setId - Measurement set id.
 * @param spec - Design spec.
 * @returns The JSON body.
 */
const saveBody = (setId: string, spec: unknown = seedDress) => ({
  spec,
  measurementSetId: setId,
  easeProfile: "regular",
  options: { fabricWidthMm: 1400 },
});

describe("pattern versions API", () => {
  it("saves (201), reuses (200), lists, reads and restores, with Server-Timing and one event per save", async () => {
    const { designId, setId } = await seed(USER_A);
    const saved = await api.call(USER_A, "POST", `/designs/${designId}/versions`, saveBody(setId));
    expect(saved.status).toBe(201);
    expect(saved.headers.get("server-timing")).toMatch(/^engine;dur=\d+/);
    const first = await body(saved);
    expect(first).toMatchObject({ reused: false, report: { status: "pass" } });
    const again = await api.call(USER_A, "POST", `/designs/${designId}/versions`, saveBody(setId));
    expect(again.status).toBe(200);
    expect((await body(again)).version.id).toBe(first.version.id);
    expect(captured.filter((e) => e.event === "pattern_version_saved")).toHaveLength(2);
    const list = await body(await api.call(USER_A, "GET", `/designs/${designId}/versions`));
    expect(list).toMatchObject({ total: 1, items: [{ versionNo: 1, isCurrent: true }] });
    const read = await body(await api.call(USER_A, "GET", `/versions/${first.version.id}`));
    expect(read.pattern.pieces.length).toBeGreaterThan(0);
    expect(read.engineChanged).toBe(false);
    expect(read.version.engineVersion).toBe(ENGINE_VERSION);
    const restored = await api.call(USER_A, "POST", `/versions/${first.version.id}/restore`);
    expect(restored.status).toBe(200);
  });

  it("flags a version saved by another engine version", async () => {
    const { designId, setId } = await seed(USER_A);
    const saved = await body(
      await api.call(USER_A, "POST", `/designs/${designId}/versions`, saveBody(setId)),
    );
    api.store.versions = api.store.versions.map((v) =>
      v.id === saved.version.id ? { ...v, engineVersion: "0.0.1" } : v,
    );
    expect((await body(await api.call(USER_A, "GET", `/versions/${saved.version.id}`))).engineChanged).toBe(
      true,
    );
  });

  it("answers 422 PATTERN_INVALID with the report for a refused combination", async () => {
    const { designId, setId } = await seed(USER_A);
    const refused = {
      ...seedDress,
      bodice: { ...seedDress.bodice, waistSeam: false },
      skirt: { type: "gathered", length: "knee" },
    };
    const res = await api.call(USER_A, "POST", `/designs/${designId}/versions`, saveBody(setId, refused));
    expect(res.status).toBe(422);
    const error = await body(res);
    expect(error.code).toBe("PATTERN_INVALID");
    expect(error.details.report.status).toBe("fail");
  });

  it("answers 401 without a token on every route", async () => {
    const id = "00000000-0000-4000-8000-0000000000d1";
    for (const [method, path] of [
      ["POST", `/designs/${id}/versions`],
      ["GET", `/designs/${id}/versions`],
      ["GET", `/versions/${id}`],
      ["POST", `/versions/${id}/restore`],
    ] as const) {
      expect((await api.call(undefined, method, path)).status).toBe(401);
    }
  });

  it("answers 404 to another user for save, foreign set, list, read and restore", async () => {
    const a = await seed(USER_A);
    const b = await seed(USER_B);
    const saved = await body(
      await api.call(USER_A, "POST", `/designs/${a.designId}/versions`, saveBody(a.setId)),
    );
    const statuses = [
      await api.call(USER_B, "POST", `/designs/${a.designId}/versions`, saveBody(b.setId)),
      await api.call(USER_B, "POST", `/designs/${b.designId}/versions`, saveBody(a.setId)),
      await api.call(USER_B, "GET", `/designs/${a.designId}/versions`),
      await api.call(USER_B, "GET", `/versions/${saved.version.id}`),
      await api.call(USER_B, "POST", `/versions/${saved.version.id}/restore`),
    ].map((r) => r.status);
    expect(statuses).toEqual([404, 404, 404, 404, 404]);
  });

  it("answers 400 VALIDATION_FAILED for bad bodies", async () => {
    const { designId, setId } = await seed(USER_A);
    const post = (payload: unknown) => api.call(USER_A, "POST", `/designs/${designId}/versions`, payload);
    expect((await post({ ...saveBody(setId), measurementSetId: undefined })).status).toBe(400);
    expect((await post({ ...saveBody(setId), easeProfile: "tight" })).status).toBe(400);
    expect((await post({ ...saveBody(setId), options: { fabricWidthMm: 0 } })).status).toBe(400);
  });
});
