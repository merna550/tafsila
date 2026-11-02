/** Design repository port: stores the signed-in user's designs. Every method acts for `ctx` only (RLS in the database). */
import type {
  CreateDesignInput,
  Design,
  DesignDetail,
  DesignListItem,
  ListDesignsQuery,
  Page,
} from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** A new design: the title is already resolved (the service names untitled designs). */
export type NewDesign = Required<CreateDesignInput>;

/** Stores and reads the caller's designs. Another user's row behaves as if it did not exist. */
export interface DesignRepository {
  /**
   * Creates a design owned by the caller.
   *
   * @param ctx - Verified caller.
   * @param input - Category and title.
   * @returns The stored design.
   */
  create(ctx: AuthContext, input: NewDesign): Promise<Design>;
  /**
   * Lists the caller's designs, most recently updated first.
   *
   * @param ctx - Verified caller.
   * @param query - Title search, client filter and paging.
   * @returns One page with the total.
   */
  list(ctx: AuthContext, query: ListDesignsQuery): Promise<Page<DesignListItem>>;
  /**
   * Reads one design with its current version's stored inputs.
   *
   * @param ctx - Verified caller.
   * @param id - Design id.
   * @returns The design and current version, or undefined when missing or not the caller's.
   */
  get(ctx: AuthContext, id: string): Promise<DesignDetail | undefined>;
  /**
   * Changes the title and touches `updatedAt`.
   *
   * @param ctx - Verified caller.
   * @param id - Design id.
   * @param title - New title.
   * @returns The updated design, or undefined when missing or not the caller's.
   */
  rename(ctx: AuthContext, id: string, title: string): Promise<Design | undefined>;
  /**
   * Deletes a design; its versions go with it.
   *
   * @param ctx - Verified caller.
   * @param id - Design id.
   * @returns True when a row was deleted.
   */
  remove(ctx: AuthContext, id: string): Promise<boolean>;
  /**
   * Reads the stored photo paths of a design.
   *
   * @param ctx - Verified caller.
   * @param id - Design id.
   * @returns The paths, or undefined when the design is missing or not the caller's.
   */
  getPhotoPaths(ctx: AuthContext, id: string): Promise<string[] | undefined>;
  /**
   * Replaces the stored photo paths and touches `updatedAt`.
   *
   * @param ctx - Verified caller.
   * @param id - Design id.
   * @param paths - The new paths.
   * @returns True when the design exists and is the caller's.
   */
  setPhotoPaths(ctx: AuthContext, id: string, paths: readonly string[]): Promise<boolean>;
}
