/** Response of GET /api/me: who the verified access token says the caller is. */
import { z } from "zod";

/** Schema of the GET /api/me response body. */
export const meResponseSchema = z.object({
  /** The signed-in user's id. */
  userId: z.string(),
  /** Role from the token's user_role claim. */
  role: z.enum(["user", "admin"]),
});

/** Parsed GET /api/me response. */
export type MeResponse = z.infer<typeof meResponseSchema>;
