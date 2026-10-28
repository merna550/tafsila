/** In-memory tables shared by the memory repositories, so deleting a client can cascade to its sets like the database does. */
import { DRAFT, DRAFT_CATALOGUE, DRAFT_RULES } from "@tafsila/fabric-kb";
import { patternVersionSchema } from "@tafsila/schemas";
import type {
  AdminFabric,
  AdminFabricRule,
  Client,
  Design,
  FabricCalc,
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

/** A fabric calculation row plus its owner and the hash of its options. */
export interface FabricCalcRow extends FabricCalc {
  readonly ownerId: string;
  readonly optionsHash: string;
}

/** Edit time of a seeded fabric or rule (the migration's insert time in the database). */
const SEEDED_AT = "1970-01-01T00:00:00.000Z";

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
  /** The fabric catalogue; starts as the package's draft data, like the migration's seed. */
  fabrics: AdminFabric[];
  /** The recommendation rules; starts as the package's draft data. */
  fabricRules: AdminFabricRule[];
  /** Saved fabric calculations (written by the version fabric routes). */
  fabricCalcs: FabricCalcRow[];
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
    fabrics: DRAFT_CATALOGUE.map((f) => ({ ...f, isDraft: DRAFT, updatedAt: SEEDED_AT, updatedBy: null })),
    fabricRules: DRAFT_RULES.map((r) => ({ ...r, isDraft: DRAFT, updatedAt: SEEDED_AT, updatedBy: null })),
    fabricCalcs: [],
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

/**
 * A version as the API shows it: a deleted measurement set reads as null (ON DELETE SET NULL).
 *
 * @param store - Shared fake database.
 * @param row - Stored version.
 * @returns The public version.
 */
export function toVersion(store: MemoryStore, row: VersionRow): PatternVersion {
  const setExists = store.sets.some((set) => set.id === row.measurementSetId);
  // Parsing drops the owner (unknown keys are stripped).
  return patternVersionSchema.parse({ ...row, measurementSetId: setExists ? row.measurementSetId : null });
}
