import {
  adminSizeChartSchema,
  adminStatsSchema,
  adminUserPageSchema,
  type SizeChart,
} from "@tafsila/schemas";
import { demoSizeChart } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import type { UserRow } from "../adapters/memory/memory-store";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

const ADMIN = "cccccccc-0000-4000-8000-00000000000c";
const CHART_ID = "00000000-0000-4000-8000-0000000000d1";
const PLACEHOLDER = "PLACEHOLDER S-XXL (demo values)";

/**
 * Builds a stored user.
 *
 * @param id - User id.
 * @param extra - Fields to override.
 * @returns A user row.
 */
const user = (id: string, extra: Partial<UserRow> = {}): UserRow => ({
  id,
  name: null,
  email: null,
  phone: null,
  phoneVerifiedAt: null,
  createdAt: "2026-10-10T10:00:00.000Z",
  lastSignInAt: null,
  locale: "ar",
  role: "user",
  ...extra,
});

/**
 * Creates the app with an admin, two users and the placeholder chart.
 *
 * @returns The memory app.
 */
async function seeded(): Promise<MemoryApp> {
  const api = await createMemoryApp();
  api.store.users.push(
    user(ADMIN, {
      name: "Merna",
      email: "merna@t.test",
      role: "admin",
      createdAt: "2026-10-01T10:00:00.000Z",
    }),
    user(USER_A, {
      name: "Mona Ahmed",
      email: "mona@t.test",
      phone: "+201000000001",
      phoneVerifiedAt: "2026-10-11T10:00:00.000Z",
      createdAt: "2026-10-11T10:00:00.000Z",
      lastSignInAt: "2026-10-12T08:00:00.000Z",
    }),
    user(USER_B, { name: "Sara", email: "sara_b@t.test", createdAt: "2026-10-12T10:00:00.000Z" }),
  );
  api.store.clients.push({
    id: "a1000000-0000-4000-8000-000000000001",
    ownerId: USER_A,
    name: "Client",
    notes: "secret note",
    createdAt: "2026-10-11T11:00:00.000Z",
  });
  api.store.sizeCharts.push({ id: CHART_ID, name: PLACEHOLDER, sizes: demoSizeChart });
  return api;
}

const asAdmin = { userId: ADMIN, role: "admin" };

describe("admin access", () => {
  const paths = ["/admin/stats", "/admin/users", `/admin/users/${USER_A}`, "/admin/size-charts/default"];

  it.each(paths)("%s answers 401 without a token", async (path) => {
    const api = await seeded();
    expect((await api.call(undefined, "GET", path)).status).toBe(401);
  });

  it.each(paths)("%s answers 403 FORBIDDEN for a normal user", async (path) => {
    const api = await seeded();
    const res = await api.callAs({ userId: USER_A, role: "user" }, "GET", path);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("FORBIDDEN");
  });

  it("answers 403 on PUT for a normal user and leaves the chart alone", async () => {
    const api = await seeded();
    const res = await api.callAs({ userId: USER_A }, "PUT", "/admin/size-charts/default", {
      sizes: demoSizeChart,
    });
    expect(res.status).toBe(403);
    expect(api.store.audit).toHaveLength(0);
  });

  it("answers 403 when the token says admin but the database does not (stale token)", async () => {
    const api = await seeded();
    const res = await api.callAs({ userId: USER_A, role: "admin" }, "GET", "/admin/stats");
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("FORBIDDEN");
  });

  it("refuses a stale admin token on PUT and writes nothing", async () => {
    const api = await seeded();
    const res = await api.callAs({ userId: USER_A, role: "admin" }, "PUT", "/admin/size-charts/default", {
      sizes: demoSizeChart,
    });
    expect(res.status).toBe(403);
    expect(api.store.audit).toHaveLength(0);
    expect(api.store.sizeCharts[0]?.name).toBe(PLACEHOLDER);
  });
});

describe("GET /api/admin/stats", () => {
  it("counts users, verified phones, sign-ups and clients", async () => {
    const api = await seeded();
    api.store.users[1] = { ...api.store.users[1]!, createdAt: new Date().toISOString() };
    const res = await api.callAs(asAdmin, "GET", "/admin/stats");
    expect(res.status).toBe(200);
    const stats = adminStatsSchema.parse(await res.json());
    expect(stats).toMatchObject({ users: 3, verifiedPhones: 1, clients: 1, signupsToday: 1 });
    expect(stats.signupsLast7Days).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/admin/users", () => {
  it("lists newest first with a client count and no measurements or notes", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "GET", "/admin/users");
    expect(res.status).toBe(200);
    const text = await res.text();
    const page = adminUserPageSchema.parse(JSON.parse(text));
    expect(page.items.map((u) => u.name)).toEqual(["Sara", "Mona Ahmed", "Merna"]);
    expect(page.total).toBe(3);
    expect(page.items.find((u) => u.id === USER_A)?.clientCount).toBe(1);
    expect(text).not.toContain("secret note");
  });

  it("searches name, e-mail and phone, and treats _ and % literally", async () => {
    const api = await seeded();
    const names = async (q: string) =>
      adminUserPageSchema
        .parse(await (await api.callAs(asAdmin, "GET", `/admin/users?q=${encodeURIComponent(q)}`)).json())
        .items.map((u) => u.name);
    expect(await names("mona")).toEqual(["Mona Ahmed"]);
    expect(await names("sara_b")).toEqual(["Sara"]);
    expect(await names("0100000")).toEqual(["Mona Ahmed"]);
    expect(await names("%")).toEqual([]);
  });

  it("filters by verified phone and pages the result", async () => {
    const api = await seeded();
    const verified = adminUserPageSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/users?verified=true")).json(),
    );
    expect(verified.items.map((u) => u.name)).toEqual(["Mona Ahmed"]);
    const unverified = adminUserPageSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/users?verified=false")).json(),
    );
    expect(unverified.total).toBe(2);
    const paged = adminUserPageSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/users?limit=1&offset=1")).json(),
    );
    expect(paged.items.map((u) => u.name)).toEqual(["Mona Ahmed"]);
    expect(paged.total).toBe(3);
  });

  it("answers 400 VALIDATION_FAILED for a bad filter", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "GET", "/admin/users?verified=maybe");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/users/{id}", () => {
  it("returns the detail with counts", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "GET", `/admin/users/${USER_A}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: USER_A,
      email: "mona@t.test",
      clientCount: 1,
      measurementSetCount: 0,
      role: "user",
    });
  });

  it("answers 404 for an unknown user", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "GET", "/admin/users/dddddddd-0000-4000-8000-00000000000d");
    expect(res.status).toBe(404);
  });
});

describe("size chart editor", () => {
  it("reads the chart with the placeholder flag", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "GET", "/admin/size-charts/default");
    expect(res.status).toBe(200);
    const chart = adminSizeChartSchema.parse(await res.json());
    expect(chart).toMatchObject({ id: CHART_ID, isPlaceholder: true, updatedBy: null });
  });

  it("answers 404 SIZE_CHART_NOT_FOUND when there is no default chart", async () => {
    const api = await seeded();
    api.store.sizeCharts.length = 0;
    const res = await api.callAs(asAdmin, "GET", "/admin/size-charts/default");
    expect(res.status).toBe(404);
    expect(((await res.json()) as { code: string }).code).toBe("SIZE_CHART_NOT_FOUND");
  });

  it("saves a valid chart with the new name, sets the editor and writes one audit row with before and after", async () => {
    const api = await seeded();
    const sizes: SizeChart = { S: { ...demoSizeChart.S!, bust: 900 }, M: demoSizeChart.M! };
    const res = await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", {
      name: "Egyptian size chart",
      sizes,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      name: string;
      isPlaceholder: boolean;
      updatedBy: string;
      sizes: SizeChart;
      warnings: unknown[];
    };
    expect(body).toMatchObject({ name: "Egyptian size chart", isPlaceholder: false, updatedBy: "Merna" });
    expect(Object.keys(body.sizes)).toEqual(["S", "M"]);
    expect(Array.isArray(body.warnings)).toBe(true);
    expect(api.store.audit).toHaveLength(1);
    expect(api.store.audit[0]).toMatchObject({
      who: ADMIN,
      action: "size_chart.updated",
      target: CHART_ID,
      before: { name: PLACEHOLDER },
      after: { name: "Egyptian size chart" },
    });
    const again = adminSizeChartSchema.parse(
      await (await api.callAs(asAdmin, "GET", "/admin/size-charts/default")).json(),
    );
    expect(again.updatedBy).toBe("Merna");
    expect(Object.keys(again.sizes)).toEqual(["S", "M"]);
  });

  it("keeps the old name when none is sent", async () => {
    const api = await seeded();
    const res = await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", { sizes: demoSizeChart });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { name: string }).name).toBe(PLACEHOLDER);
  });

  it("answers 422 SIZE_CHART_INVALID with per-size issues and saves nothing", async () => {
    const api = await seeded();
    const sizes: SizeChart = { S: demoSizeChart.S!, M: { ...demoSizeChart.M!, highBust: 2000 } };
    const res = await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", { sizes });
    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      code: string;
      details: { fields: Record<string, string>; issues: { size: string; fields: string[] }[] };
    };
    expect(body.code).toBe("SIZE_CHART_INVALID");
    expect(body.details.issues.every((issue) => issue.size === "M")).toBe(true);
    expect(Object.keys(body.details.fields).some((key) => key.startsWith("M."))).toBe(true);
    expect(api.store.audit).toHaveLength(0);
    expect(api.store.sizeCharts[0]?.name).toBe(PLACEHOLDER);
  });

  it("answers 400 VALIDATION_FAILED for an empty chart or a missing body field", async () => {
    const api = await seeded();
    expect((await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", { sizes: {} })).status).toBe(400);
    expect((await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", {})).status).toBe(400);
  });

  it("answers 404 SIZE_CHART_NOT_FOUND on PUT when no default chart exists", async () => {
    const api = await seeded();
    api.store.sizeCharts.length = 0;
    const res = await api.callAs(asAdmin, "PUT", "/admin/size-charts/default", { sizes: demoSizeChart });
    expect(res.status).toBe(404);
  });
});
