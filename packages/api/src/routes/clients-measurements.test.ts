import { sizeM } from "@tafsila/test-fixtures";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

let api: MemoryApp;
beforeAll(async () => {
  api = await createMemoryApp();
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  total: number;
  items: { id: string }[];
  warnings: { code: string }[];
  message_ar: string;
  message_en: string;
  request_id: string;
  details: { fields: Record<string, string>; issues: { code: string; message_ar: string }[] };
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
 * Asserts the standard error body and returns it.
 *
 * @param res - The response.
 * @param status - Expected HTTP status.
 * @param code - Expected error code.
 * @returns The parsed error body.
 */
async function expectError(res: Response, status: number, code: string): Promise<Json> {
  expect(res.status).toBe(status);
  const json = await body(res);
  expect(json).toMatchObject({ code });
  expect(json.message_ar).toBeTruthy();
  expect(json.message_en).toBeTruthy();
  expect(json.request_id).toBeTruthy();
  return json;
}

describe("clients API", () => {
  it("creates, reads, lists, updates and deletes a client", async () => {
    const created = await api.call(USER_A, "POST", "/clients", { name: "  منى  ", notes: "n" });
    expect(created.status).toBe(201);
    const client = await body(created);
    expect(client).toMatchObject({ name: "منى", notes: "n" });

    expect((await body(await api.call(USER_A, "GET", `/clients/${client.id}`))).id).toBe(client.id);
    const list = await body(await api.call(USER_A, "GET", "/clients?q=منى&limit=5"));
    expect(list).toMatchObject({ total: 1, limit: 5, offset: 0 });

    const patched = await api.call(USER_A, "PATCH", `/clients/${client.id}`, { notes: null });
    expect(await body(patched)).toMatchObject({ name: "منى", notes: null });

    expect((await api.call(USER_A, "DELETE", `/clients/${client.id}`)).status).toBe(204);
    await expectError(await api.call(USER_A, "GET", `/clients/${client.id}`), 404, "NOT_FOUND");
  });

  it("returns VALIDATION_FAILED with field messages for bad input", async () => {
    const err = await expectError(
      await api.call(USER_A, "POST", "/clients", { name: " " }),
      400,
      "VALIDATION_FAILED",
    );
    expect(err.details.fields).toBeDefined();
    await expectError(
      await api.call(USER_A, "PATCH", `/clients/${crypto.randomUUID()}`, {}),
      400,
      "VALIDATION_FAILED",
    );
    await expectError(await api.call(USER_A, "GET", "/clients?limit=1000"), 400, "VALIDATION_FAILED");
    await expectError(await api.call(USER_A, "GET", "/clients/not-a-uuid"), 400, "VALIDATION_FAILED");
  });

  it("answers 401 without a token on every route", async () => {
    const id = crypto.randomUUID();
    const calls: [string, string, unknown?][] = [
      ["POST", "/clients", { name: "x" }],
      ["GET", "/clients"],
      ["GET", `/clients/${id}`],
      ["PATCH", `/clients/${id}`, { name: "x" }],
      ["DELETE", `/clients/${id}`],
      ["POST", "/measurements", { label: "L", measurements: sizeM }],
      ["GET", "/measurements"],
      ["GET", `/measurements/${id}`],
      ["PUT", `/measurements/${id}`, { label: "L", measurements: sizeM }],
      ["DELETE", `/measurements/${id}`],
    ];
    for (const [method, path, payload] of calls) {
      await expectError(await api.call(undefined, method, path, payload), 401, "UNAUTHENTICATED");
    }
  });

  it("answers FORBIDDEN when the plan denies another client", async () => {
    const limited = await createMemoryApp({ planLimits: { canAddClient: () => Promise.resolve(false) } });
    await expectError(await limited.call(USER_A, "POST", "/clients", { name: "x" }), 403, "FORBIDDEN");
  });
});

describe("measurements API", () => {
  it("saves, reads, lists, replaces and deletes a set, with warnings", async () => {
    const saved = await api.call(USER_A, "POST", "/measurements", {
      label: "L",
      measurements: { ...sizeM, waist: 1100 },
    });
    expect(saved.status).toBe(201);
    const set = await body(saved);
    expect(set.warnings.map((w) => w.code)).toContain("MEAS_WAIST_NOT_BELOW_HIP");

    expect((await body(await api.call(USER_A, "GET", `/measurements/${set.id}`))).id).toBe(set.id);
    expect((await body(await api.call(USER_A, "GET", "/measurements"))).total).toBeGreaterThan(0);

    const put = await api.call(USER_A, "PUT", `/measurements/${set.id}`, {
      label: "New",
      measurements: sizeM,
    });
    expect(await body(put)).toMatchObject({ label: "New", warnings: [] });

    expect((await api.call(USER_A, "DELETE", `/measurements/${set.id}`)).status).toBe(204);
    await expectError(await api.call(USER_A, "GET", `/measurements/${set.id}`), 404, "NOT_FOUND");
  });

  it("answers 422 MEASUREMENTS_INVALID with both languages when highBust is above bust", async () => {
    const err = await expectError(
      await api.call(USER_A, "POST", "/measurements", {
        label: "L",
        measurements: { ...sizeM, highBust: 1000, bust: 900 },
      }),
      422,
      "MEASUREMENTS_INVALID",
    );
    expect(err.details.issues[0]).toMatchObject({ code: "MEAS_HIGH_BUST_EXCEEDS_BUST" });
    expect(err.details.issues[0]?.message_ar).toBeTruthy();
    expect(err.details.fields.highBust).toBeTruthy();
  });

  it("answers 400 for a bad shape", async () => {
    await expectError(
      await api.call(USER_A, "POST", "/measurements", { label: "L", measurements: { unit: "mm" } }),
      400,
      "VALIDATION_FAILED",
    );
  });
});

describe("permission matrix (user B against user A's rows)", () => {
  it("B cannot read, change or delete A's client and set, and cannot attach a set to A's client", async () => {
    const client = await body(await api.call(USER_A, "POST", "/clients", { name: "A's" }));
    const set = await body(
      await api.call(USER_A, "POST", "/measurements", {
        clientId: client.id,
        label: "L",
        measurements: sizeM,
      }),
    );

    await expectError(await api.call(USER_B, "GET", `/clients/${client.id}`), 404, "NOT_FOUND");
    await expectError(
      await api.call(USER_B, "PATCH", `/clients/${client.id}`, { name: "x" }),
      404,
      "NOT_FOUND",
    );
    await expectError(await api.call(USER_B, "DELETE", `/clients/${client.id}`), 404, "NOT_FOUND");
    await expectError(await api.call(USER_B, "GET", `/measurements/${set.id}`), 404, "NOT_FOUND");
    await expectError(
      await api.call(USER_B, "PUT", `/measurements/${set.id}`, { label: "x", measurements: sizeM }),
      404,
      "NOT_FOUND",
    );
    await expectError(await api.call(USER_B, "DELETE", `/measurements/${set.id}`), 404, "NOT_FOUND");
    await expectError(
      await api.call(USER_B, "POST", "/measurements", {
        clientId: client.id,
        label: "L",
        measurements: sizeM,
      }),
      404,
      "NOT_FOUND",
    );

    const bClients = await body(await api.call(USER_B, "GET", "/clients"));
    const bSets = await body(await api.call(USER_B, "GET", "/measurements"));
    expect(bClients.items.some((c) => c.id === client.id)).toBe(false);
    expect(bSets.items.some((s) => s.id === set.id)).toBe(false);
  });
});
