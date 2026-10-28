/** Fabric repository tests against local Supabase (`pnpm db:start`, `pnpm db:reset`); run with `pnpm --filter @tafsila/api test:db`. */
import { loadDatabaseUrl } from "@tafsila/config";
import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AuthContext } from "../../ports/token-verifier";
import { createFabricCalcRepository } from "./fabric-calc-repository";
import { createFabricRepository, createFabricRuleRepository } from "./fabric-repository";
import { createPatternVersionRepository } from "./pattern-version-repository";
import { adminAudit, fabricCalcs } from "./schema";
import { createWithUser } from "./with-user";

const URL = loadDatabaseUrl() ?? "postgresql://api_app:api_app_local_only@127.0.0.1:54322/postgres";
const TRIAL = "00000000-0000-4000-8000-000000000001";
const PRO = "00000000-0000-4000-8000-000000000002";
const ADMIN = "00000000-0000-4000-8000-000000000004";

/**
 * Builds a verified-looking context for a seed user.
 *
 * @param userId - Seed user id.
 * @param role - Role in the token.
 * @returns The context.
 */
const ctxOf = (userId: string, role: "user" | "admin" = "user"): AuthContext => ({
  userId,
  role,
  claims: { sub: userId, role: "authenticated" },
});

const withUser = createWithUser(URL);
const trial = ctxOf(TRIAL);
const pro = ctxOf(PRO);
const admin = ctxOf(ADMIN, "admin");

describe("fabric repositories on local Supabase", () => {
  const fabrics = createFabricRepository(withUser);
  const rules = createFabricRuleRepository(withUser);
  const calcs = createFabricCalcRepository(withUser);
  const SEED_DESIGN = "00000000-0000-4000-8000-0000000000d1";
  const fabric = {
    id: "db-test-fabric",
    nameAr: "اختبار",
    nameEn: "DB test",
    properties: { drape: 1, weight: 1, body: 1, stretch: 0, sheen: 1 },
    careNotes: { ar: "غسيل", en: "Wash" },
    isDraft: false,
  };
  const rule = {
    id: "db-test-rule",
    when: [{ path: "skirt.type", op: "in" as const, values: ["circle-half"] }],
    effect: { property: "drape" as const, min: 2, strength: "prefer" as const },
    priority: 2,
    reason: { ar: "سبب", en: "Reason" },
    isDraft: false,
  };

  /**
   * Reads the audit actions written for a target, oldest first.
   *
   * @param target - Row id.
   * @returns The action names.
   */
  const auditActions = async (target: string): Promise<string[]> => {
    const rows = await withUser(admin, (tx) =>
      tx.select().from(adminAudit).where(eq(adminAudit.target, target)).orderBy(adminAudit.at),
    );
    return rows.map((row) => row.action);
  };

  it("lists the seeded catalogue and rules for any signed-in user", async () => {
    expect((await fabrics.list(trial)).length).toBeGreaterThanOrEqual(16);
    expect((await rules.list(trial)).length).toBeGreaterThanOrEqual(21);
  });

  it("lets an admin create, change and delete a fabric with an audit row each, and refuses a non-admin", async () => {
    await expect(fabrics.create(trial, fabric)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await fabrics.create(admin, fabric)).toMatchObject({ id: fabric.id, updatedBy: ADMIN });
    await expect(fabrics.create(admin, fabric)).rejects.toMatchObject({ code: "FABRIC_ID_TAKEN" });
    expect(await fabrics.update(admin, fabric.id, { nameEn: "Renamed" })).toMatchObject({
      nameEn: "Renamed",
    });
    await expect(fabrics.update(trial, fabric.id, { nameEn: "x" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await fabrics.update(admin, "db-test-missing", { nameEn: "x" })).toBeUndefined();
    await expect(fabrics.remove(trial, fabric.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await fabrics.remove(admin, fabric.id)).toBe(true);
    expect(await fabrics.remove(admin, fabric.id)).toBe(false);
    expect(await auditActions(fabric.id)).toEqual(["fabric.created", "fabric.updated", "fabric.deleted"]);
  });

  it("does the same for a rule, mapping when and effect to their columns", async () => {
    await expect(rules.create(trial, rule)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rules.create(admin, rule)).toMatchObject({
      id: rule.id,
      when: rule.when,
      effect: rule.effect,
    });
    await expect(rules.create(admin, rule)).rejects.toMatchObject({ code: "FABRIC_ID_TAKEN" });
    const changed = await rules.update(admin, rule.id, { effect: { ...rule.effect, min: 3 }, priority: 4 });
    expect(changed).toMatchObject({ priority: 4, effect: { min: 3 }, when: rule.when });
    await expect(rules.update(trial, rule.id, { priority: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rules.remove(admin, rule.id)).toBe(true);
    expect(await auditActions(rule.id)).toEqual([
      "fabric_rule.created",
      "fabric_rule.updated",
      "fabric_rule.deleted",
    ]);
  });

  it("stores one calculation per version and options, and hides it from another user", async () => {
    const own = (
      await createPatternVersionRepository(withUser).list(trial, SEED_DESIGN, { limit: 1, offset: 0 })
    )?.items[0];
    if (!own) throw new Error("seed version missing");
    const input = {
      versionId: own.id,
      options: DEFAULT_FABRIC_OPTIONS,
      optionsHash: "db-test-hash",
      result: { kinds: [{ kind: "main" as const, lengthM: 2.3, placements: [] }] },
      nestingVersion: "1.0.0",
    };
    try {
      expect(await calcs.save(trial, input)).toMatchObject({ versionId: own.id, nestingVersion: "1.0.0" });
      const replaced = {
        ...input,
        result: { kinds: [{ kind: "main" as const, lengthM: 2.5, placements: [] }] },
      };
      await calcs.save(trial, replaced);
      const rows = await withUser(trial, (tx) => tx.select().from(fabricCalcs));
      expect(rows.filter((row) => row.optionsHash === "db-test-hash")).toHaveLength(1);
      expect((await calcs.latest(trial, own.id))?.result.kinds[0]?.lengthM).toBeCloseTo(2.5);
      expect(await calcs.save(pro, input)).toBeUndefined();
      expect(await calcs.latest(pro, own.id)).toBeUndefined();
      expect(await calcs.save(admin, input)).toBeUndefined();
    } finally {
      await withUser(trial, (tx) => tx.delete(fabricCalcs));
    }
  });
});
