/** Admin lists of shared designs and unsupported features through the `api_app` door; the SQL functions re-check the admin and write the audit row. */
import { sql } from "drizzle-orm";
import { AppError } from "../../domain/errors";
import type { AdminRepository } from "../../ports/admin-repository";
import { sqlState } from "./sql-state";
import type { WithApiRole } from "./with-user";
import type { DesignSpec } from "@tafsila/schemas";

/** SQLSTATE raised by private.assert_admin when the caller is not an admin. */
const SQLSTATE_NOT_ADMIN = "42501";

/** A timestamp as the driver returns it (Date or ISO text). */
type Timestamp = Date | string;

/** Row of private.admin_shared_designs. */
interface SharedDesignRow {
  readonly design_id: string;
  readonly category: "dress" | "skirt" | "blouse";
  readonly title: string;
  readonly current_spec: DesignSpec;
  readonly created_at: Timestamp;
  readonly owner_display_name: string | null;
  readonly photo_paths: string[];
  readonly total: number | string;
}

/** Row of private.admin_unsupported_features. */
interface UnsupportedRow {
  readonly text: string;
  readonly category: "dress" | "skirt" | "blouse";
  readonly created_at: Timestamp;
  readonly total: number | string;
}

/**
 * Runs one admin query and turns "not an admin" into FORBIDDEN.
 *
 * @param withApiRole - Door to the private functions.
 * @param query - The select statement.
 * @returns The rows.
 */
export async function adminRows<T>(withApiRole: WithApiRole, query: ReturnType<typeof sql>): Promise<T[]> {
  try {
    return await withApiRole(async (tx) => (await tx.execute(query)) as unknown as T[]);
  } catch (error) {
    if (sqlState(error) === SQLSTATE_NOT_ADMIN) throw new AppError("FORBIDDEN");
    throw error;
  }
}

/**
 * Creates the two list methods.
 *
 * @param withApiRole - Door to the private functions.
 * @returns The list methods of AdminRepository.
 */
export function createAdminDesignsRepository(
  withApiRole: WithApiRole,
): Pick<AdminRepository, "listSharedDesigns" | "listUnsupportedFeatures"> {
  return {
    listSharedDesigns: async (adminId, query) => {
      const rows = await adminRows<SharedDesignRow>(
        withApiRole,
        sql`select * from private.admin_shared_designs(${adminId}::uuid, ${query.limit}::int, ${query.offset}::int)`,
      );
      return {
        items: rows.map((row) => ({
          designId: row.design_id,
          category: row.category,
          title: row.title,
          currentSpec: row.current_spec,
          createdAt: new Date(row.created_at).toISOString(),
          ownerDisplayName: row.owner_display_name,
          photoPaths: row.photo_paths,
        })),
        total: rows[0] ? Number(rows[0].total) : 0,
        limit: query.limit,
        offset: query.offset,
      };
    },
    listUnsupportedFeatures: async (adminId, query) => {
      const rows = await adminRows<UnsupportedRow>(
        withApiRole,
        sql`select * from private.admin_unsupported_features(${adminId}::uuid, ${query.limit}::int, ${query.offset}::int)`,
      );
      return {
        items: rows.map((row) => ({
          text: row.text,
          category: row.category,
          createdAt: new Date(row.created_at).toISOString(),
        })),
        total: rows[0] ? Number(rows[0].total) : 0,
        limit: query.limit,
        offset: query.offset,
      };
    },
  };
}
