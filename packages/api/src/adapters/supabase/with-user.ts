/**
 * The only door to the database (ADR-035): runs a callback in a transaction as the signed-in user, so Postgres RLS applies.
 * It reuses the claims already verified by requireAuth; it only refuses a context without a matching `sub`.
 */
import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { AuthContext } from "../../ports/token-verifier";

/** A Drizzle transaction handle. */
export type Tx = Parameters<Parameters<PostgresJsDatabase["transaction"]>[0]>[0];

/** Runs `fn` as the user inside one transaction. */
export type WithUser = <T>(ctx: AuthContext, fn: (tx: Tx) => Promise<T>) => Promise<T>;

/**
 * Creates `withUser` for a Postgres connection string (the `api_app` login role; never the superuser).
 *
 * @param databaseUrl - Connection string (`prepare: false` keeps it pooler-safe); parsed on the first call, not here.
 * @returns The `withUser` function.
 */
export function createWithUser(databaseUrl: string): WithUser {
  let db: PostgresJsDatabase | undefined;
  return (ctx, fn) => {
    if (typeof ctx.claims.sub !== "string" || ctx.claims.sub !== ctx.userId || ctx.userId === "") {
      return Promise.reject(new Error("withUser needs a verified context with a sub claim"));
    }
    const claims = JSON.stringify(ctx.claims);
    // Built on first use: a placeholder URL (build time) fails the request, never the import.
    db ??= drizzle(postgres(databaseUrl, { prepare: false }));
    return db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx);
    });
  };
}
