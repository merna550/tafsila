/** Mounts the Hono API (`packages/api`) under /api inside Next.js (ADR-005). */
import { createApp } from "@tafsila/api";

const app = createApp();

/**
 * Forwards a Next.js request to the Hono app and returns its response.
 *
 * @param request - Incoming web request.
 * @returns The API response.
 */
const handler = (request: Request): Response | Promise<Response> => app.fetch(request);

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
