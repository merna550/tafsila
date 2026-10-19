/** Drizzle pattern version repository: every query runs as the user through withUser; an append is one transaction (ADR-035). */
import { desc, eq, sql } from "drizzle-orm";
import type {
  AppendedVersion,
  NewPatternVersion,
  PatternVersionRepository,
} from "../../ports/pattern-version-repository";
import type { AuthContext } from "../../ports/token-verifier";
import { toVersionListItem } from "../../domain/version-list-item";
import { toPatternVersion } from "./pattern-version-row";
import { designs, patternVersions } from "./schema";
import type { Tx, WithUser } from "./with-user";

/** Hooks that let a DB test break a step inside the transaction to prove the rollback. */
export interface PatternVersionRepositoryHooks {
  /** Called after the version row is inserted and before the design is updated. */
  readonly afterInsert?: () => void;
}

/**
 * Appends a version inside the caller's transaction (see {@link PatternVersionRepository.appendVersion}).
 *
 * @param tx - Transaction of the user (RLS applies).
 * @param ctx - Verified caller.
 * @param input - The version to store.
 * @param hooks - Test-only hooks.
 * @returns The version, or undefined when the design is not visible.
 */
async function appendIn(
  tx: Tx,
  ctx: AuthContext,
  input: NewPatternVersion,
  hooks: PatternVersionRepositoryHooks,
): Promise<AppendedVersion | undefined> {
  // The row lock serialises saves of one design, so version_no = max + 1 cannot collide.
  const [design] = await tx.select().from(designs).where(eq(designs.id, input.designId)).for("update");
  if (!design) return undefined;
  const [current] = design.currentVersionId
    ? await tx.select().from(patternVersions).where(eq(patternVersions.id, design.currentVersionId))
    : [];
  if (current?.inputHash === input.inputHash) return { version: toPatternVersion(current), reused: true };
  const [last] = await tx
    .select({ n: sql<number>`coalesce(max(${patternVersions.versionNo}), 0)::int` })
    .from(patternVersions)
    .where(eq(patternVersions.designId, input.designId));
  const [row] = await tx
    .insert(patternVersions)
    .values({
      ...input,
      ownerId: ctx.userId,
      versionNo: (last?.n ?? 0) + 1,
      createdBy: "user",
    })
    .returning();
  if (!row) throw new Error("insert returned no row");
  hooks.afterInsert?.();
  await tx
    .update(designs)
    .set({ currentVersionId: row.id, updatedAt: sql`now()` })
    .where(eq(designs.id, input.designId));
  return { version: toPatternVersion(row), reused: false };
}

/**
 * Creates the Drizzle pattern version repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @param hooks - Test-only hooks.
 * @returns A PatternVersionRepository.
 */
export function createPatternVersionRepository(
  withUser: WithUser,
  hooks: PatternVersionRepositoryHooks = {},
): PatternVersionRepository {
  return {
    appendVersion: (ctx, input) => withUser(ctx, (tx) => appendIn(tx, ctx, input, hooks)),
    list: (ctx, designId, { limit, offset }) =>
      withUser(ctx, async (tx) => {
        const [design] = await tx.select().from(designs).where(eq(designs.id, designId));
        if (!design) return undefined;
        const rows = await tx
          .select()
          .from(patternVersions)
          .where(eq(patternVersions.designId, designId))
          .orderBy(desc(patternVersions.versionNo))
          .limit(limit)
          .offset(offset);
        const [counted] = await tx
          .select({ total: sql<number>`count(*)::int` })
          .from(patternVersions)
          .where(eq(patternVersions.designId, designId));
        const items = rows.map((row) =>
          toVersionListItem(toPatternVersion(row), row.id === design.currentVersionId),
        );
        return { items, total: counted?.total ?? 0, limit, offset };
      }),
    get: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(patternVersions).where(eq(patternVersions.id, id));
        return row ? toPatternVersion(row) : undefined;
      }),
  };
}
