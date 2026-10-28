/** Fabric repository ports: the catalogue and the recommendation rules. Everyone signed in reads; admins write, each write with its audit row. */
import type {
  AdminFabric,
  AdminFabricRule,
  CreateFabricInput,
  CreateFabricRuleInput,
  UpdateFabricInput,
  UpdateFabricRuleInput,
} from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/**
 * Reads and writes the fabric catalogue (`fabrics`). Writes run in one transaction with an `admin_audit` row
 * (`fabric.created`, `fabric.updated`, `fabric.deleted`; target = the id; before and after).
 */
export interface FabricRepository {
  /**
   * Lists every fabric, ordered by id.
   *
   * @param ctx - Verified caller.
   * @returns The catalogue with its review flag and edit trail.
   */
  list(ctx: AuthContext): Promise<AdminFabric[]>;
  /**
   * Adds a fabric.
   *
   * @param admin - Verified admin (the audit row's `who`).
   * @param input - The new fabric.
   * @returns The stored fabric.
   * @throws {AppError} FABRIC_ID_TAKEN when the id exists; FORBIDDEN when the database says the caller is not an admin.
   */
  create(admin: AuthContext, input: CreateFabricInput): Promise<AdminFabric>;
  /**
   * Changes the given fields of a fabric.
   *
   * @param admin - Verified admin.
   * @param id - Fabric id.
   * @param patch - Fields to change.
   * @returns The stored fabric, or undefined when no fabric has that id (nothing is written).
   * @throws {AppError} FORBIDDEN when the database says the caller is not an admin.
   */
  update(admin: AuthContext, id: string, patch: UpdateFabricInput): Promise<AdminFabric | undefined>;
  /**
   * Deletes a fabric.
   *
   * @param admin - Verified admin.
   * @param id - Fabric id.
   * @returns True when it existed, false when no fabric has that id (nothing is written).
   * @throws {AppError} FORBIDDEN when the database says the caller is not an admin.
   */
  remove(admin: AuthContext, id: string): Promise<boolean>;
}

/**
 * Reads and writes the recommendation rules (`fabric_rules`). Writes run in one transaction with an `admin_audit` row
 * (`fabric_rule.created`, `fabric_rule.updated`, `fabric_rule.deleted`).
 */
export interface FabricRuleRepository {
  /**
   * Lists every rule, ordered by id.
   *
   * @param ctx - Verified caller.
   * @returns The rules with their review flag and edit trail.
   */
  list(ctx: AuthContext): Promise<AdminFabricRule[]>;
  /**
   * Adds a rule.
   *
   * @param admin - Verified admin.
   * @param input - The new rule (already checked against the known paths).
   * @returns The stored rule.
   * @throws {AppError} FABRIC_ID_TAKEN when the id exists; FORBIDDEN when the caller is not an admin.
   */
  create(admin: AuthContext, input: CreateFabricRuleInput): Promise<AdminFabricRule>;
  /**
   * Changes the given fields of a rule.
   *
   * @param admin - Verified admin.
   * @param id - Rule id.
   * @param patch - Fields to change (already checked once merged).
   * @returns The stored rule, or undefined when no rule has that id.
   * @throws {AppError} FORBIDDEN when the caller is not an admin.
   */
  update(admin: AuthContext, id: string, patch: UpdateFabricRuleInput): Promise<AdminFabricRule | undefined>;
  /**
   * Deletes a rule.
   *
   * @param admin - Verified admin.
   * @param id - Rule id.
   * @returns True when it existed, false otherwise.
   * @throws {AppError} FORBIDDEN when the caller is not an admin.
   */
  remove(admin: AuthContext, id: string): Promise<boolean>;
}
