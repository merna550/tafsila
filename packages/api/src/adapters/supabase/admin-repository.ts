/** AdminRepository through the `api_app` door: calls the `private.admin_*` functions, which re-check the admin in the database. */
import type { AdminStats, AdminUser, AdminUserDetail } from "@tafsila/schemas";
import { sql } from "drizzle-orm";
import { AppError } from "../../domain/errors";
import type { AdminRepository } from "../../ports/admin-repository";
import { sqlState } from "./sql-state";
import type { WithApiRole } from "./with-user";

/** SQLSTATE raised by private.assert_admin when the caller is not an admin. */
const SQLSTATE_NOT_ADMIN = "42501";

/** A timestamp as the driver returns it (Date or ISO text). */
type Timestamp = Date | string;

/** Row of private.admin_users / admin_user. */
interface UserRow {
  readonly id: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly phone_verified_at: Timestamp | null;
  readonly created_at: Timestamp;
  readonly last_sign_in_at: Timestamp | null;
  readonly client_count: number;
}

/** Row of private.admin_users: a user and the total matches. */
interface ListRow extends UserRow {
  readonly total: number | string;
}

/** Row of private.admin_user. */
interface DetailRow extends UserRow {
  readonly measurement_set_count: number;
  readonly locale: "ar" | "en";
  readonly role: "user" | "admin";
}

/** Row of private.admin_stats. */
interface StatsRow {
  readonly users: number;
  readonly verified_phones: number;
  readonly signups_today: number;
  readonly signups_7_days: number;
  readonly clients: number;
}

/**
 * Converts a driver timestamp to ISO text.
 *
 * @param value - Date or text, or null.
 * @returns ISO string, or null.
 */
function iso(value: Timestamp | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

/**
 * Maps a function row to the API user.
 *
 * @param row - Row of admin_users or admin_user.
 * @returns The admin user.
 */
function toUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    phoneVerifiedAt: iso(row.phone_verified_at),
    createdAt: new Date(row.created_at).toISOString(),
    lastSignInAt: iso(row.last_sign_in_at),
    clientCount: row.client_count,
  };
}

/**
 * Creates the repository.
 *
 * @param withApiRole - Door to the private functions.
 * @returns An AdminRepository.
 */
export function createAdminRepository(withApiRole: WithApiRole): AdminRepository {
  /**
   * Runs one query and turns "not an admin" into FORBIDDEN.
   *
   * @param query - The select statement.
   * @returns The rows.
   */
  const rowsOf = async <T>(query: ReturnType<typeof sql>): Promise<T[]> => {
    try {
      return await withApiRole(async (tx) => (await tx.execute(query)) as unknown as T[]);
    } catch (error) {
      if (sqlState(error) === SQLSTATE_NOT_ADMIN) throw new AppError("FORBIDDEN");
      throw error;
    }
  };
  return {
    stats: async (adminId) => {
      const [row] = await rowsOf<StatsRow>(sql`select * from private.admin_stats(${adminId}::uuid)`);
      if (!row) throw new Error("admin_stats returned no row");
      const stats: AdminStats = {
        users: row.users,
        verifiedPhones: row.verified_phones,
        signupsToday: row.signups_today,
        signupsLast7Days: row.signups_7_days,
        clients: row.clients,
      };
      return stats;
    },
    list: async (adminId, query) => {
      const rows = await rowsOf<ListRow>(
        sql`select * from private.admin_users(${adminId}::uuid, ${query.q ?? null}, ${query.verified ?? null}::boolean, ${query.limit}::int, ${query.offset}::int)`,
      );
      return {
        items: rows.map(toUser),
        total: rows[0] ? Number(rows[0].total) : 0,
        limit: query.limit,
        offset: query.offset,
      };
    },
    get: async (adminId, id) => {
      const [row] = await rowsOf<DetailRow>(
        sql`select * from private.admin_user(${adminId}::uuid, ${id}::uuid)`,
      );
      if (!row) return undefined;
      const detail: AdminUserDetail = {
        ...toUser(row),
        measurementSetCount: row.measurement_set_count,
        locale: row.locale,
        role: row.role,
      };
      return detail;
    },
  };
}
