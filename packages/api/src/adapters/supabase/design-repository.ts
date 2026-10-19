/** Drizzle design repository: every query runs as the user through withUser, so RLS decides what is visible. */
import type { Design, DesignListItem, ListDesignsQuery, Page } from "@tafsila/schemas";
import { and, desc, eq, exists, getTableColumns, ilike, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { DesignRepository } from "../../ports/design-repository";
import { escapeLike } from "./escape-like";
import { toPatternVersion } from "./pattern-version-row";
import { clients, designs, measurementSets, patternVersions } from "./schema";
import type { Tx, WithUser } from "./with-user";

/** The current version, its measurement set and that set's client, joined to each design row. */
const current = alias(patternVersions, "current_version");
const currentSet = alias(measurementSets, "current_set");
const currentClient = alias(clients, "current_client");

/** Columns of `designs` plus the summary read in the same query (one query per page, never one per design). */
const listColumns = {
  ...getTableColumns(designs),
  versionCount: sql<number>`(select count(*)::int from ${patternVersions} where ${patternVersions.designId} = ${designs.id})`,
  currentStatus: current.validationStatus,
  clientName: currentClient.name,
};

/**
 * Maps a row to the API design.
 *
 * @param row - Database row.
 * @returns The design with ISO dates.
 */
function toDesign(row: typeof designs.$inferSelect): Design {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Maps a list row to the API list item.
 *
 * @param row - Row of {@link listColumns}.
 * @returns The design and its summary.
 */
function toListItem(
  row: typeof designs.$inferSelect & {
    versionCount: number;
    currentStatus: "pass" | "warn" | null;
    clientName: string | null;
  },
): DesignListItem {
  return {
    ...toDesign(row),
    summary: { versionCount: row.versionCount, currentStatus: row.currentStatus, clientName: row.clientName },
  };
}

/**
 * Reads one page of designs with their summaries and the total, in two queries.
 *
 * @param tx - Transaction of the user (RLS applies).
 * @param query - Title search, client filter and paging.
 * @returns The page.
 */
async function listPage(
  tx: Tx,
  { q, clientId, limit, offset }: ListDesignsQuery,
): Promise<Page<DesignListItem>> {
  const where = and(
    q ? ilike(designs.title, `%${escapeLike(q)}%`) : undefined,
    clientId
      ? exists(
          tx
            .select({ one: sql`1` })
            .from(patternVersions)
            .innerJoin(measurementSets, eq(measurementSets.id, patternVersions.measurementSetId))
            .where(and(eq(patternVersions.designId, designs.id), eq(measurementSets.clientId, clientId))),
        )
      : undefined,
  );
  const rows = await tx
    .select(listColumns)
    .from(designs)
    .leftJoin(current, eq(current.id, designs.currentVersionId))
    .leftJoin(currentSet, eq(currentSet.id, current.measurementSetId))
    .leftJoin(currentClient, eq(currentClient.id, currentSet.clientId))
    .where(where)
    .orderBy(desc(designs.updatedAt), desc(designs.id))
    .limit(limit)
    .offset(offset);
  const [counted] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(designs)
    .where(where);
  return { items: rows.map(toListItem), total: counted?.total ?? 0, limit, offset };
}

/**
 * Creates the Drizzle design repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A DesignRepository.
 */
export function createDesignRepository(withUser: WithUser): DesignRepository {
  return {
    create: (ctx, input) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .insert(designs)
          .values({ ownerId: ctx.userId, category: input.category, title: input.title })
          .returning();
        if (!row) throw new Error("insert returned no row");
        return toDesign(row);
      }),
    list: (ctx, query) => withUser(ctx, (tx) => listPage(tx, query)),
    get: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(designs).where(eq(designs.id, id));
        if (!row) return undefined;
        const [version] = row.currentVersionId
          ? await tx.select().from(patternVersions).where(eq(patternVersions.id, row.currentVersionId))
          : [];
        return { design: toDesign(row), currentVersion: version ? toPatternVersion(version) : null };
      }),
    rename: (ctx, id, title) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .update(designs)
          .set({ title, updatedAt: sql`now()` })
          .where(eq(designs.id, id))
          .returning();
        return row ? toDesign(row) : undefined;
      }),
    remove: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const deleted = await tx.delete(designs).where(eq(designs.id, id)).returning({ id: designs.id });
        return deleted.length > 0;
      }),
  };
}
