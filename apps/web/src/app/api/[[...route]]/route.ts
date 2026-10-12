/** Mounts the Hono API (`packages/api`) under /api inside Next.js (ADR-005). The app is built on the first request, never at import or build time. */
import { createApp, createLazyFetch } from "@tafsila/api";

/** The API reads runtime configuration, so Next.js must never evaluate it while collecting page data. */
export const dynamic = "force-dynamic";

/**
 * Forwards a Next.js request to the Hono app (created on first use) and returns its response.
 *
 * @param request - Incoming web request.
 * @returns The API response.
 */
const handler = createLazyFetch(() => createApp());

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
