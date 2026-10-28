import { adminFabricListSchema, adminFabricRuleListSchema } from "@tafsila/schemas";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, type MemoryApp } from "../test-support/memory-app";

const ADMIN = "cccccccc-0000-4000-8000-00000000000c";
const FABRICS = "/admin/fabrics";
const RULES = "/admin/fabric-rules";

let api: MemoryApp;
beforeEach(async () => {
  api = await createMemoryApp();
  api.store.users.push({
    id: ADMIN,
    name: "Merna",
    email: "merna@t.test",
    phone: null,
    phoneVerifiedAt: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    lastSignInAt: null,
    locale: "ar",
    role: "admin",
  });
});

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  code: string;
  nameEn: string;
  isDraft: boolean;
  updatedBy: string | null;
  details: { fields: Record<string, string> };
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
 * Calls the API as the admin.
 *
 * @param method - HTTP method.
 * @param path - Path under /api.
 * @param payload - JSON body, if any.
 * @returns The response.
 */
const asAdmin = (method: string, path: string, payload?: unknown) =>
  api.callAs({ userId: ADMIN, role: "admin" }, method, path, payload);

const newFabric = {
  id: "organza",
  nameAr: "أورجانزا",
  nameEn: "Organza",
  properties: { drape: 1, weight: 0, body: 3, stretch: 0, sheen: 2 },
  careNotes: { ar: "غسيل يدوي", en: "Hand wash" },
};
const newRule = {
  id: "test-rule",
  when: [{ path: "skirt.type", op: "in", values: ["circle-half"] }],
  effect: { property: "drape", min: 2, strength: "prefer" },
  priority: 3,
  reason: { ar: "سبب", en: "Reason" },
};

describe("admin fabric routes: access", () => {
  const calls: [string, string, unknown?][] = [
    ["GET", FABRICS],
    ["POST", FABRICS, newFabric],
    ["PATCH", `${FABRICS}/crepe`, { nameEn: "x" }],
    ["DELETE", `${FABRICS}/crepe`],
    ["GET", RULES],
    ["POST", RULES, newRule],
    ["PATCH", `${RULES}/circle-skirt-drape`, { priority: 4 }],
    ["DELETE", `${RULES}/circle-skirt-drape`],
  ];

  it.each(calls)("%s %s gives 401 without a token", async (method, path, payload) => {
    expect((await api.call(undefined, method, path, payload)).status).toBe(401);
  });

  it.each(calls)("%s %s gives 403 to a normal user and writes nothing", async (method, path, payload) => {
    const res = await api.call(USER_A, method, path, payload);
    expect(res.status).toBe(403);
    expect(api.store.audit).toHaveLength(0);
  });

  it("gives 403 and no audit row to a token that says admin when the database does not", async () => {
    const stale = await api.callAs({ userId: USER_A, role: "admin" }, "POST", FABRICS, newFabric);
    expect(stale.status).toBe(403);
    expect(api.store.fabrics.some((f) => f.id === "organza")).toBe(false);
    expect(api.store.audit).toHaveLength(0);
  });

  it("gives 403 and no audit row to a stale admin token on update and delete", async () => {
    const as = { userId: USER_A, role: "admin" };
    expect((await api.callAs(as, "PATCH", `${FABRICS}/crepe`, { nameEn: "x" })).status).toBe(403);
    expect((await api.callAs(as, "DELETE", `${RULES}/circle-skirt-drape`)).status).toBe(403);
    expect(api.store.audit).toHaveLength(0);
  });
});

describe("admin fabrics", () => {
  it("lists the seeded catalogue as draft", async () => {
    const list = adminFabricListSchema.parse(await (await asAdmin("GET", FABRICS)).json());
    expect(list.items).toHaveLength(16);
    expect(list.items.every((f) => f.isDraft)).toBe(true);
  });

  it("creates a fabric with an audit row that has no before", async () => {
    const res = await asAdmin("POST", FABRICS, newFabric);
    expect(res.status).toBe(201);
    expect(await body(res)).toMatchObject({ id: "organza", isDraft: false, updatedBy: ADMIN });
    expect(api.store.audit).toHaveLength(1);
    expect(api.store.audit[0]).toMatchObject({
      who: ADMIN,
      action: "fabric.created",
      target: "organza",
      before: null,
    });
    expect(api.store.audit[0]?.after).toMatchObject({ nameEn: "Organza" });
  });

  it("gives 409 FABRIC_ID_TAKEN for a duplicate id and writes no audit row", async () => {
    const res = await asAdmin("POST", FABRICS, { ...newFabric, id: "crepe" });
    expect(res.status).toBe(409);
    expect((await body(res)).code).toBe("FABRIC_ID_TAKEN");
    expect(api.store.audit).toHaveLength(0);
  });

  it("updates a fabric and records before and after", async () => {
    const res = await asAdmin("PATCH", `${FABRICS}/crepe`, { nameEn: "Crepe de chine", isDraft: false });
    expect(res.status).toBe(200);
    expect(await body(res)).toMatchObject({ nameEn: "Crepe de chine", isDraft: false, updatedBy: ADMIN });
    expect(api.store.audit[0]).toMatchObject({ action: "fabric.updated", target: "crepe" });
    expect(api.store.audit[0]?.before).toMatchObject({ nameEn: "Crepe", isDraft: true });
    expect(api.store.audit[0]?.after).toMatchObject({ nameEn: "Crepe de chine", isDraft: false });
  });

  it("deletes a fabric with an audit row", async () => {
    expect((await asAdmin("DELETE", `${FABRICS}/crepe`)).status).toBe(204);
    expect(api.store.fabrics.some((f) => f.id === "crepe")).toBe(false);
    expect(api.store.audit[0]).toMatchObject({ action: "fabric.deleted", target: "crepe", after: null });
  });

  it("gives 404 FABRIC_NOT_FOUND for an unknown id and 400 for a bad body", async () => {
    const missing = await asAdmin("PATCH", `${FABRICS}/nope`, { nameEn: "x" });
    expect(missing.status).toBe(404);
    expect((await body(missing)).code).toBe("FABRIC_NOT_FOUND");
    expect((await body(await asAdmin("DELETE", `${FABRICS}/nope`))).code).toBe("FABRIC_NOT_FOUND");
    expect((await asAdmin("PATCH", `${FABRICS}/crepe`, {})).status).toBe(400);
    const badLevel = { ...newFabric, properties: { ...newFabric.properties, drape: 9 } };
    expect((await asAdmin("POST", FABRICS, badLevel)).status).toBe(400);
    expect(api.store.audit).toHaveLength(0);
  });
});

describe("admin fabric rules", () => {
  it("lists the seeded rules as draft", async () => {
    const list = adminFabricRuleListSchema.parse(await (await asAdmin("GET", RULES)).json());
    expect(list.items).toHaveLength(21);
  });

  it("creates, updates and deletes a rule, one audit row each", async () => {
    expect((await asAdmin("POST", RULES, newRule)).status).toBe(201);
    const updated = await asAdmin("PATCH", `${RULES}/test-rule`, { priority: 5 });
    expect(updated.status).toBe(200);
    expect((await asAdmin("DELETE", `${RULES}/test-rule`)).status).toBe(204);
    expect(api.store.audit.map((a) => a.action)).toEqual([
      "fabric_rule.created",
      "fabric_rule.updated",
      "fabric_rule.deleted",
    ]);
  });

  it("refuses an unknown path with 422 FABRIC_RULE_INVALID and names the condition", async () => {
    const bad = { ...newRule, when: [{ path: "skirt.typ", op: "in", values: ["circle-half"] }] };
    const res = await asAdmin("POST", RULES, bad);
    expect(res.status).toBe(422);
    const json = await body(res);
    expect(json.code).toBe("FABRIC_RULE_INVALID");
    expect(json.details.fields["when.0"]).toContain("skirt.typ");
    expect(api.store.audit).toHaveLength(0);
    expect(api.store.fabricRules.some((r) => r.id === "test-rule")).toBe(false);
  });

  it("refuses an unknown value, and checks the merged rule on update", async () => {
    const badValue = { ...newRule, when: [{ path: "skirt.type", op: "in", values: ["nope"] }] };
    expect((await asAdmin("POST", RULES, badValue)).status).toBe(422);
    const res = await asAdmin("PATCH", `${RULES}/circle-skirt-drape`, {
      when: [{ path: "skirt.typ", op: "in", values: ["circle-half"] }],
    });
    expect((await body(res)).code).toBe("FABRIC_RULE_INVALID");
    expect(api.store.audit).toHaveLength(0);
  });

  it("gives 409 for a duplicate id and 404 for an unknown rule", async () => {
    expect((await asAdmin("POST", RULES, { ...newRule, id: "circle-skirt-drape" })).status).toBe(409);
    const missing = await asAdmin("PATCH", `${RULES}/nope`, { priority: 2 });
    expect((await body(missing)).code).toBe("FABRIC_RULE_NOT_FOUND");
    expect((await body(await asAdmin("DELETE", `${RULES}/nope`))).code).toBe("FABRIC_RULE_NOT_FOUND");
  });
});
