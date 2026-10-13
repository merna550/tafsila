/** In-memory admin repository for tests and `pnpm api:test`; reads the fake users and counts clients and sets like the SQL functions. */
import type { AdminUser, AdminUserDetail } from "@tafsila/schemas";
import { AppError } from "../../domain/errors";
import type { AdminRepository } from "../../ports/admin-repository";
import { newestFirst, type MemoryOptions, type MemoryStore, type UserRow } from "./memory-store";

/** Milliseconds in an hour and a day. */
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
/** Days counted by "sign-ups in the last 7 days". */
const RECENT_DAYS = 7;
/** Cairo is UTC+2 all year in the fake (the database uses the real zone). */
const CAIRO_OFFSET_MS = 2 * HOUR_MS;

/**
 * Maps a stored user to the list row, counting the user's clients.
 *
 * @param store - Shared fake database.
 * @param user - Stored user.
 * @returns The admin list row.
 */
function toAdminUser(store: MemoryStore, user: UserRow): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt,
    clientCount: store.clients.filter((client) => client.ownerId === user.id).length,
  };
}

/**
 * Tells whether a user matches the search text in name, e-mail or phone (case-insensitive, literal).
 *
 * @param user - Stored user.
 * @param q - Search text, if any.
 * @returns True when there is no search or one field contains it.
 */
function matches(user: UserRow, q: string | undefined): boolean {
  const needle = q?.trim().toLowerCase();
  if (!needle) return true;
  return [user.name, user.email, user.phone].some((value) => value?.toLowerCase().includes(needle));
}

/**
 * Creates the in-memory admin repository.
 *
 * @param store - Shared fake database (`users` holds the profiles joined with auth.users).
 * @param options - Time source for "sign-ups today".
 * @returns An AdminRepository.
 */
export function createMemoryAdminRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): AdminRepository {
  const now = options.now ?? (() => new Date());
  /**
   * The database re-checks the admin inside every function; so does the fake.
   *
   * @param adminId - Caller id.
   * @throws {AppError} FORBIDDEN when the caller is not an admin in `users`.
   */
  const assertAdmin = (adminId: string): void => {
    if (store.users.find((user) => user.id === adminId)?.role !== "admin") throw new AppError("FORBIDDEN");
  };
  return {
    stats: (adminId) => {
      assertAdmin(adminId);
      const current = now().getTime();
      const todayStart = Math.floor((current + CAIRO_OFFSET_MS) / DAY_MS) * DAY_MS - CAIRO_OFFSET_MS;
      /**
       * Counts users who signed up at or after a moment.
       *
       * @param from - Epoch milliseconds.
       * @returns How many users.
       */
      const since = (from: number) => store.users.filter((user) => Date.parse(user.createdAt) >= from).length;
      return Promise.resolve({
        users: store.users.length,
        verifiedPhones: store.users.filter((user) => user.phoneVerifiedAt !== null).length,
        signupsToday: since(todayStart),
        signupsLast7Days: since(current - RECENT_DAYS * DAY_MS),
        clients: store.clients.length,
      });
    },
    list: (adminId, query) => {
      assertAdmin(adminId);
      const found = newestFirst(
        store.users.filter(
          (user) =>
            matches(user, query.q) &&
            (query.verified === undefined || (user.phoneVerifiedAt !== null) === query.verified),
        ),
      );
      return Promise.resolve({
        items: found.slice(query.offset, query.offset + query.limit).map((user) => toAdminUser(store, user)),
        total: found.length,
        limit: query.limit,
        offset: query.offset,
      });
    },
    get: (adminId, id) => {
      assertAdmin(adminId);
      const user = store.users.find((row) => row.id === id);
      if (!user) return Promise.resolve(undefined);
      const detail: AdminUserDetail = {
        ...toAdminUser(store, user),
        measurementSetCount: store.sets.filter((set) => set.ownerId === id).length,
        locale: user.locale,
        role: user.role,
      };
      return Promise.resolve(detail);
    },
  };
}
