/** In-memory tables shared by the memory repositories, so deleting a client can cascade to its sets like the database does. */
import type {
  Client,
  Design,
  MeasurementSet,
  PatternVersion,
  Profile,
  SizeChartResponse,
} from "@tafsila/schemas";

/** A client row plus its owner. */
export interface ClientRow extends Omit<Client, "summary"> {
  readonly ownerId: string;
}

/** A measurement set row (without warnings) plus its owner. */
export interface SetRow extends Omit<MeasurementSet, "warnings"> {
  readonly ownerId: string;
}

/** A design row plus its owner. */
export interface DesignRow extends Design {
  readonly ownerId: string;
}

/** A pattern version row plus its owner. */
export interface VersionRow extends PatternVersion {
  readonly ownerId: string;
}

/** A system size chart row with its edit trail (absent until an admin saves it). */
export interface ChartRow extends SizeChartResponse {
  readonly updatedAt?: string;
  readonly updatedBy?: string | null;
}

/** A user as the admin list sees it: the profile row plus the sign-in data of auth.users. */
export interface UserRow {
  readonly id: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly phoneVerifiedAt: string | null;
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  readonly locale: "ar" | "en";
  readonly role: "user" | "admin";
}

/** One row of admin_audit. */
export interface AuditRow {
  readonly who: string;
  readonly action: string;
  readonly target: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly at: string;
}

/** The fake database. */
export interface MemoryStore {
  /** Client rows in insertion order. */
  clients: ClientRow[];
  /** Measurement set rows in insertion order. */
  sets: SetRow[];
  /** Design rows in insertion order. */
  designs: DesignRow[];
  /** Pattern version rows in insertion order (written by the pattern version routes). */
  versions: VersionRow[];
  /** System size charts; the first default one is served. */
  sizeCharts: ChartRow[];
  /** Users the admin screens list (the fake of profiles joined with auth.users); an admin check reads `role` here. */
  users: UserRow[];
  /** Rows written to admin_audit, oldest first. */
  audit: AuditRow[];
  /** Profile rows by user id; a missing row means the account does not exist (or was deleted). */
  profiles: Map<string, Pick<Profile, "name" | "locale">>;
  /** Users whose account was deleted: they have no profile any more even if their token is still valid. */
  deletedUsers: Set<string>;
}

/** Optional sources of time and ids, so tests can be deterministic. */
export interface MemoryOptions {
  /** Current time (defaults to the real clock). */
  readonly now?: () => Date;
  /** New row id (defaults to a random UUID). */
  readonly newId?: () => string;
}

/**
 * Creates an empty fake database.
 *
 * @returns The store to pass to both memory repositories.
 */
export function createMemoryStore(): MemoryStore {
  return {
    clients: [],
    sets: [],
    designs: [],
    versions: [],
    sizeCharts: [],
    users: [],
    audit: [],
    profiles: new Map(),
    deletedUsers: new Set(),
  };
}

/**
 * Orders rows newest first with the id as tie-break, like `order by created_at desc, id desc`.
 *
 * @param rows - Rows to order.
 * @returns A new ordered array.
 */
export function newestFirst<T extends { createdAt: string; id: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) =>
    a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt),
  );
}
