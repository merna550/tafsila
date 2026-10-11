/** Response of GET /api/health: build information used by uptime monitors and smoke tests. */
import { z } from "zod";

/** Schema of the GET /api/health response body. */
export const healthResponseSchema = z.object({
  /** Always "ok" when the API answers. */
  status: z.literal("ok").meta({ example: "ok" }),
  /** Deployment environment name (local, staging, production). */
  environment: z.string().meta({ example: "staging" }),
  /** Build version. */
  version: z.string().meta({ example: "1.2.3" }),
  /** Git commit the build was made from. */
  gitSha: z.string().meta({ example: "abc1234" }),
  /** Server time as an ISO 8601 string. */
  time: z.string().meta({ example: "2026-10-07T10:00:00.000Z" }),
});

/** Parsed GET /api/health response. */
export type HealthResponse = z.infer<typeof healthResponseSchema>;
