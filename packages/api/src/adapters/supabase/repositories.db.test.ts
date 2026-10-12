/** Adapter tests against local Supabase (`pnpm db:start`, `pnpm db:reset`); run with `pnpm --filter @tafsila/api test:db`. */
import { sizeM } from "@tafsila/test-fixtures";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { loadDatabaseUrl } from "@tafsila/config";
import type { AuthContext } from "../../ports/token-verifier";
import { createClientRepository } from "./client-repository";
import { createWithUser } from "./with-user";
import { createMeasurementSetRepository } from "./measurement-set-repository";

const URL = loadDatabaseUrl() ?? "postgresql://api_app:api_app_local_only@127.0.0.1:54322/postgres";
const TRIAL = "00000000-0000-4000-8000-000000000001";
const PRO = "00000000-0000-4000-8000-000000000002";

/**
 * Builds a verified-looking context for a seed user.
 *
 * @param userId - Seed user id.
 * @returns The context.
 */
const ctxOf = (userId: string): AuthContext => ({
  userId,
  role: "user",
  claims: { sub: userId, role: "authenticated" },
});

const withUser = createWithUser(URL);
const clients = createClientRepository(withUser);
const sets = createMeasurementSetRepository(withUser);
const trial = ctxOf(TRIAL);
const pro = ctxOf(PRO);
const raw = postgres(URL, { prepare: false });
const created: { clients: string[] } = { clients: [] };

afterAll(async () => {
  for (const id of created.clients) await clients.remove(trial, id);
  await raw.end();
});

describe("clients repository on local Supabase", () => {
  it("creates, reads, updates and deletes the caller's own client", async () => {
    const c = await clients.create(trial, { name: "DB test client", notes: "n" });
    created.clients.push(c.id);
    expect(await clients.get(trial, c.id)).toMatchObject({ name: "DB test client" });
    expect(await clients.update(trial, c.id, { name: "Renamed" })).toMatchObject({
      name: "Renamed",
      notes: "n",
    });
    expect(await clients.remove(trial, c.id)).toBe(true);
    expect(await clients.get(trial, c.id)).toBeUndefined();
  });

  it("shows another user nothing, and their update and delete touch 0 rows", async () => {
    const c = await clients.create(trial, { name: "Private client" });
    created.clients.push(c.id);
    expect(await clients.get(pro, c.id)).toBeUndefined();
    expect((await clients.list(pro, { limit: 100, offset: 0 })).items.some((x) => x.id === c.id)).toBe(false);
    expect(await clients.update(pro, c.id, { name: "hacked" })).toBeUndefined();
    expect(await clients.remove(pro, c.id)).toBe(false);
    expect(await clients.get(trial, c.id)).toMatchObject({ name: "Private client" });
  });

  it("ignores a forged owner in the input: the owner is always the caller", async () => {
    const forged = { name: "Forged", ownerId: PRO } as unknown as { name: string };
    const c = await clients.create(trial, forged);
    created.clients.push(c.id);
    expect(await clients.get(pro, c.id)).toBeUndefined();
    expect(await clients.get(trial, c.id)).toBeDefined();
  });

  it("matches % and _ literally in the name search and pages with a total", async () => {
    const c = await clients.create(trial, { name: "100%_sure" });
    created.clients.push(c.id);
    expect((await clients.list(trial, { q: "100%_", limit: 20, offset: 0 })).items.map((x) => x.id)).toEqual([
      c.id,
    ]);
    expect((await clients.list(trial, { q: "%", limit: 20, offset: 0 })).total).toBe(1);
    const page = await clients.list(trial, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThan(1);
  });
});

describe("client summary on local Supabase", () => {
  it("counts the caller's sets and reports the newest one on get, list and update", async () => {
    const c = await clients.create(trial, { name: "Summary client" });
    created.clients.push(c.id);
    expect(c.summary).toEqual({ measurementSetCount: 0, latestSizeLabel: null, lastMeasurementAt: null });
    await sets.create(trial, { clientId: c.id, label: "old", sizeLabel: "S", measurements: sizeM });
    const newest = await sets.create(trial, {
      clientId: c.id,
      label: "new",
      sizeLabel: "M",
      measurements: sizeM,
    });
    const expected = {
      measurementSetCount: 2,
      latestSizeLabel: "M",
      lastMeasurementAt: newest.createdAt,
    };
    expect((await clients.get(trial, c.id))?.summary).toEqual(expected);
    expect((await clients.update(trial, c.id, { notes: "x" }))?.summary).toEqual(expected);
    const listed = (await clients.list(trial, { q: "Summary client", limit: 20, offset: 0 })).items[0];
    expect(listed?.summary).toEqual(expected);
  });
});

describe("measurement sets repository on local Supabase", () => {
  it("rejects another user's client through the composite foreign key", async () => {
    const theirs = (await clients.list(pro, { limit: 1, offset: 0 })).items[0];
    expect(theirs).toBeDefined();
    await expect(
      sets.create(trial, { clientId: theirs?.id, label: "x", measurements: sizeM }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("stores, reads, replaces and deletes a set, and cascades when the client is deleted", async () => {
    const c = await clients.create(trial, { name: "Cascade client" });
    const s = await sets.create(trial, { clientId: c.id, label: "L", sizeLabel: "M", measurements: sizeM });
    expect(await sets.get(trial, s.id)).toMatchObject({ label: "L", clientId: c.id });
    expect(await sets.get(pro, s.id)).toBeUndefined();
    expect(await sets.update(pro, s.id, { label: "x", measurements: sizeM })).toBeUndefined();
    expect(await sets.update(trial, s.id, { label: "L2", measurements: sizeM })).toMatchObject({
      label: "L2",
    });
    expect((await sets.list(trial, { clientId: c.id, limit: 20, offset: 0 })).total).toBe(1);
    await clients.remove(trial, c.id);
    expect(await sets.get(trial, s.id)).toBeUndefined();
  });
});

describe("withUser and the api_app role", () => {
  it("rejects invalid claims", async () => {
    await expect(
      withUser({ userId: "x", role: "user", claims: {} }, () => Promise.resolve(1)),
    ).rejects.toThrow();
  });

  it("a raw connection without withUser gets permission denied", async () => {
    await expect(raw`select * from public.clients`).rejects.toMatchObject({ code: "42501" });
  });
});
