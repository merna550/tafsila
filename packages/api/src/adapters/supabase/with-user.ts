/**
 * The only doors to the database (ADR-035). `withUser` runs a callback in a transaction as the signed-in user, so Postgres RLS applies;
 * it reuses the claims already verified by requireAuth and only refuses a context without a matching `sub`.
 * `withApiRole` is the one narrow exception (decision 26-phone-otp-trial, 8): a transaction as the `api_app` login role itself,
 * which has no table privileges and can only execute the `private` phone functions.
 */
import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { AuthContext } from "../../ports/token-verifier";

/** A Drizzle transaction handle. */
export type Tx = Parameters<Parameters<PostgresJsDatabase["transaction"]>[0]>[0];

/** Runs `fn` as the user inside one transaction. */
export type WithUser = <T>(ctx: AuthContext, fn: (tx: Tx) => Promise<T>) => Promise<T>;

/** Runs `fn` as the API login role (no `set role`) inside one transaction; only for the `private` phone functions. */
export type WithApiRole = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;

/** One connection pool per connection string, shared by both doors; built on first use. */
const databases = new Map<string, PostgresJsDatabase>();

/**
 * Returns the shared Drizzle client for a connection string (`prepare: false` keeps it pooler-safe).
 * Built on first call: a placeholder URL (build time) fails the request, never the import.
 *
 * @param databaseUrl - Connection string of the `api_app` role.
 * @returns The Drizzle client (never exported).
 */
function databaseFor(databaseUrl: string): PostgresJsDatabase {
  let db = databases.get(databaseUrl);
  if (!db) {
    db = drizzle(postgres(databaseUrl, { prepare: false }));
    databases.set(databaseUrl, db);
  }
  return db;
}

/**
 * Creates `withUser` for a Postgres connection string (the `api_app` login role; never the superuser).
 *
 * @param databaseUrl - Connection string; parsed on the first call, not here.
 * @returns The `withUser` function.
 */
export function createWithUser(databaseUrl: string): WithUser {
  return (ctx, fn) => {
    if (typeof ctx.claims.sub !== "string" || ctx.claims.sub !== ctx.userId || ctx.userId === "") {
      return Promise.reject(new Error("withUser needs a verified context with a sub claim"));
    }
    const claims = JSON.stringify(ctx.claims);
    return databaseFor(databaseUrl).transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx);
    });
  };
}

/**
 * Creates `withApiRole`: a plain transaction as `api_app`. That role holds no table privileges (pgTAP proves it),
 * only `execute` on the `private` phone functions, so the database itself limits what this door can do.
 *
 * @param databaseUrl - Connection string; parsed on the first call, not here.
 * @returns The `withApiRole` function.
 */
export function createWithApiRole(databaseUrl: string): WithApiRole {
  return (fn) => databaseFor(databaseUrl).transaction((tx) => fn(tx));
}
