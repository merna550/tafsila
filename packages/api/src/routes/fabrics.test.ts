import { fabricCalcSchema, recommendFabricsResponseSchema } from "@tafsila/schemas";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let api: MemoryApp;
beforeAll(async () => {
  api = await createMemoryApp();
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  code: string;
  version: { id: string };
  details: { fields: Record<string, string> };
  result: { kinds: { lengthM: number }[] };
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
 * Saves a version of the half-circle V-neck dress for a user.
 *
 * @param userId - Owner.
 * @returns The version id.
 */
async function seedVersion(userId: string): Promise<string> {
  const design = await body(await api.call(userId, "POST", "/designs", { category: "dress", title: "t" }));
  const set = await body(
    await api.call(userId, "POST", "/measurements", { label: "M", sizeLabel: "M", measurements: sizeM }),
  );
  const saved = await body(
    await api.call(userId, "POST", `/designs/${design.id}/versions`, {
      spec: vNeckHalfCircleDress,
      measurementSetId: set.id,
      easeProfile: "regular",
      options: { fabricWidthMm: 1400 },
    }),
  );
  return saved.version.id;
}

/**
 * A valid calculation body.
 *
 * @param lengthM - Length to buy for the main fabric.
 * @param options - Fabric options to send.
 * @returns The JSON body.
 */
const calcBody = (lengthM = 2.3, options: Record<string, unknown> = {}) => ({
  options,
  result: {
    kinds: [{ kind: "main", lengthM, placements: [{ shapeId: "front#1", xMm: 0, yMm: 0, turn: 0 }] }],
  },
  nestingVersion: "1.0.0",
});

describe("GET /api/fabrics/recommend", () => {
  it("returns 3 to 5 fabrics with reasons and an avoid list for a saved version", async () => {
    const versionId = await seedVersion(USER_A);
    const res = await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${versionId}`);
    expect(res.status).toBe(200);
    const parsed = recommendFabricsResponseSchema.parse(await res.json());
    expect(parsed.recommended.length).toBeGreaterThanOrEqual(3);
    expect(parsed.recommended.length).toBeLessThanOrEqual(5);
    expect(parsed.recommended.every((r) => r.reason.ar.length > 0 && r.reason.en.length > 0)).toBe(true);
    expect(parsed.recommended.every((r) => r.fabric.id === r.fabricId && r.fabric.nameAr.length > 0)).toBe(
      true,
    );
    expect(parsed.avoid.length).toBeGreaterThan(0);
    expect(parsed.avoid.every((a) => a.fabric.id === a.fabricId && a.fabric.nameEn.length > 0)).toBe(true);
    expect(parsed.isDraft).toBe(true);
  });

  it("uses the catalogue in the store, so an admin edit changes the answer", async () => {
    const versionId = await seedVersion(USER_A);
    const kept = api.store.fabrics.splice(0, api.store.fabrics.length);
    try {
      const res = await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${versionId}`);
      expect(recommendFabricsResponseSchema.parse(await res.json()).recommended).toEqual([]);
    } finally {
      api.store.fabrics.push(...kept);
    }
  });

  it("gives 404 for another user's version and for an unknown one", async () => {
    const versionId = await seedVersion(USER_A);
    expect((await api.call(USER_B, "GET", `/fabrics/recommend?versionId=${versionId}`)).status).toBe(404);
    const unknown = "00000000-0000-4000-8000-00000000dead";
    expect((await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${unknown}`)).status).toBe(404);
  });

  it("gives 400 without a version id and 401 without a token", async () => {
    expect((await api.call(USER_A, "GET", "/fabrics/recommend")).status).toBe(400);
    expect((await api.call(undefined, "GET", "/fabrics/recommend?versionId=x")).status).toBe(401);
  });
});

describe("PUT and GET /api/versions/:id/fabric", () => {
  it("saves, reads back and replaces the calculation with the same options", async () => {
    const versionId = await seedVersion(USER_A);
    const first = await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(2.3));
    expect(first.status).toBe(200);
    expect(fabricCalcSchema.parse(await first.json())).toMatchObject({ versionId, nestingVersion: "1.0.0" });
    await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(2.5));
    expect(api.store.fabricCalcs.filter((c) => c.versionId === versionId)).toHaveLength(1);
    const read = await body(await api.call(USER_A, "GET", `/versions/${versionId}/fabric`));
    expect(read.result.kinds[0]?.lengthM).toBeCloseTo(2.5);
  });

  it("keeps one row per options and reads the latest saved", async () => {
    const versionId = await seedVersion(USER_A);
    await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(2.3, { widthMm: 1500 }));
    await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(3.1, { widthMm: 1100 }));
    expect(api.store.fabricCalcs.filter((c) => c.versionId === versionId)).toHaveLength(2);
    const read = await body(await api.call(USER_A, "GET", `/versions/${versionId}/fabric`));
    expect(read.result.kinds[0]?.lengthM).toBeCloseTo(3.1);
  });

  it.each([
    ["a negative length", -1],
    ["a length that is not a multiple of 0.1", 2.35],
    ["a zero length", 0],
  ])("refuses %s with 422 FABRIC_CALC_INVALID", async (_name, lengthM) => {
    const versionId = await seedVersion(USER_A);
    const res = await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(lengthM));
    expect(res.status).toBe(422);
    const json = await body(res);
    expect(json.code).toBe("FABRIC_CALC_INVALID");
    expect(Object.keys(json.details.fields)[0]).toContain("lengthM");
    expect(api.store.fabricCalcs.some((c) => c.versionId === versionId)).toBe(false);
  });

  it("refuses a result of the wrong shape", async () => {
    const versionId = await seedVersion(USER_A);
    const res = await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, {
      options: {},
      result: { nope: true },
      nestingVersion: "1.0.0",
    });
    expect((await body(res)).code).toBe("FABRIC_CALC_INVALID");
  });

  it("gives 404 for another user's version on save and read, and 404 when nothing is saved", async () => {
    const versionId = await seedVersion(USER_A);
    expect((await api.call(USER_B, "PUT", `/versions/${versionId}/fabric`, calcBody())).status).toBe(404);
    await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody());
    expect((await api.call(USER_B, "GET", `/versions/${versionId}/fabric`)).status).toBe(404);
    const fresh = await seedVersion(USER_A);
    expect((await api.call(USER_A, "GET", `/versions/${fresh}/fabric`)).status).toBe(404);
  });

  it("gives 400 for a bad option and 401 without a token", async () => {
    const versionId = await seedVersion(USER_A);
    expect(
      (await api.call(USER_A, "PUT", `/versions/${versionId}/fabric`, calcBody(2.3, { widthMm: 10 }))).status,
    ).toBe(400);
    expect((await api.call(undefined, "PUT", `/versions/${versionId}/fabric`, calcBody())).status).toBe(401);
    expect((await api.call(undefined, "GET", `/versions/${versionId}/fabric`)).status).toBe(401);
  });
});
