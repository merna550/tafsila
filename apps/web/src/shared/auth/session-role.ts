/** Reading the role claim of a session token without a network call; the API and the database check the role again. */
import type { AuthClient } from "./clients";

/** Roles the app knows. */
export type SessionRole = "user" | "admin";

/**
 * Decodes the payload of a JWT. The signature is not checked here: the role only decides what the page shows,
 * the API verifies the token and the database checks the role again.
 *
 * @param token - A JWT.
 * @returns The payload object, or null when the token is malformed.
 */
function decodePayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replaceAll("-", "+").replaceAll("_", "/");
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
    const payload: unknown = JSON.parse(json);
    return typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Reads the `user_role` claim of an access token (added by the custom access token hook).
 *
 * @param token - The access token.
 * @returns "admin" only for an explicit admin claim, otherwise "user".
 */
export function roleFromToken(token: string | null | undefined): SessionRole {
  if (!token) return "user";
  return decodePayload(token)?.user_role === "admin" ? "admin" : "user";
}

/**
 * Reads the role of the cookie session. The token may be up to an hour old, so a role change shows at the next refresh.
 *
 * @param client - An auth client.
 * @returns The role; "user" for no session, an error or a network failure.
 */
export async function readSessionRole(client: AuthClient): Promise<SessionRole> {
  try {
    const { data } = await client.auth.getSession();
    return roleFromToken(data.session?.access_token);
  } catch {
    return "user";
  }
}
