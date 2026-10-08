/** Next.js startup hook: validates the server configuration once so a missing variable fails loudly. */
import { loadServerEnv } from "@tafsila/config";

/**
 * Runs once when the Node.js server starts; throws when a required variable is missing or invalid,
 * so the staging smoke check fails instead of serving a half-configured app.
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME === "nodejs") loadServerEnv();
}
