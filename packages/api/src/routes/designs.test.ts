import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let api: MemoryApp;
beforeAll(async () => {
  api = await createMemoryApp();
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  title: string;
  total: number;
  items: { id: string }[];
  design: { id: string; title: string };
  currentVersion: unknown;
  code: string;
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
 * Creates a design as user A.
 *
 * @param title - Optional title.
 * @returns The new design id.
 */
async function createAsA(title?: string): Promise<string> {
  const res = await api.call(USER_A, "POST", "/designs", { category: "dress", ...(title ? { title } : {}) });
  expect(res.status).toBe(201);
  return (await body(res)).id;
}

describe("designs API", () => {
  it("creates (201), reads (200), lists (200), renames (200) and deletes (204)", async () => {
    const id = await createAsA("Wedding");
    const read = await api.call(USER_A, "GET", `/designs/${id}`);
    expect(read.status).toBe(200);
    expect(await body(read)).toMatchObject({ design: { id }, currentVersion: null });
    const list = await api.call(USER_A, "GET", "/designs?q=wed");
    expect(list.status).toBe(200);
    expect((await body(list)).items.map((d) => d.id)).toContain(id);
    const patch = await api.call(USER_A, "PATCH", `/designs/${id}`, { title: "Renamed" });
    expect(patch.status).toBe(200);
    expect((await body(patch)).title).toBe("Renamed");
    expect((await api.call(USER_A, "DELETE", `/designs/${id}`)).status).toBe(204);
    expect((await api.call(USER_A, "GET", `/designs/${id}`)).status).toBe(404);
  });

  it("names an untitled design from the category", async () => {
    const id = await createAsA();
    const read = await body(await api.call(USER_A, "GET", `/designs/${id}`));
    expect(read.design.title).toMatch(/^فستان \d{4}-\d{2}-\d{2}$/);
  });

  it("answers 401 without a token on every route", async () => {
    const id = "00000000-0000-4000-8000-0000000000d1";
    const calls: [string, string, unknown?][] = [
      ["POST", "/designs", { category: "dress" }],
      ["GET", "/designs"],
      ["GET", `/designs/${id}`],
      ["PATCH", `/designs/${id}`, { title: "x" }],
      ["DELETE", `/designs/${id}`],
    ];
    for (const [method, path, payload] of calls) {
      expect((await api.call(undefined, method, path, payload)).status).toBe(401);
    }
  });

  it("answers 404 to another user for read, rename and delete, and lists nothing of theirs", async () => {
    const id = await createAsA("Private");
    expect((await api.call(USER_B, "GET", `/designs/${id}`)).status).toBe(404);
    expect((await api.call(USER_B, "PATCH", `/designs/${id}`, { title: "hacked" })).status).toBe(404);
    expect((await api.call(USER_B, "DELETE", `/designs/${id}`)).status).toBe(404);
    expect((await body(await api.call(USER_B, "GET", "/designs"))).items).toEqual([]);
    expect((await body(await api.call(USER_A, "GET", `/designs/${id}`))).design.id).toBe(id);
  });

  it("answers 400 VALIDATION_FAILED for bad bodies and queries", async () => {
    const id = await createAsA();
    const bad: [string, string, unknown?][] = [
      ["POST", "/designs", { category: "coat" }],
      ["POST", "/designs", { category: "dress", title: "" }],
      ["PATCH", `/designs/${id}`, { title: "" }],
      ["PATCH", `/designs/${id}`, { title: "x".repeat(121) }],
      ["GET", "/designs?limit=0"],
      ["GET", "/designs?clientId=x"],
    ];
    for (const [method, path, payload] of bad) {
      const res = await api.call(USER_A, method, path, payload);
      expect(res.status, `${method} ${path}`).toBe(400);
      expect((await body(res)).code).toBe("VALIDATION_FAILED");
    }
  });
});
