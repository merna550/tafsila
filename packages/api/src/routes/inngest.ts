/** Serves the Inngest functions at /api/inngest (ADR-012). Only mounted when JOB_QUEUE=inngest; the SDK checks the signing key. */
import { Hono } from "hono";
import { serve } from "inngest/hono";
import { createDesignAnalyzeFunction } from "../jobs/design-analyze";
import type { Container } from "../container";
import { runDesignAnalysis } from "../services/run-design-analysis";

/**
 * Creates the Inngest route; with the inline queue it is empty, so the path answers 404.
 *
 * @param container - Dependencies (the Inngest client and the services the job calls).
 * @returns A sub-app with the Inngest handler on GET, POST and PUT.
 */
export function inngestRoutes(container: Container): Hono {
  const app = new Hono();
  const client = container.inngest;
  if (!client) return app;
  const handler = serve({
    client,
    functions: [createDesignAnalyzeFunction(client, (payload) => runDesignAnalysis(container, payload))],
  });
  app.on(["GET", "POST", "PUT"], "/inngest", (c) => handler(c));
  return app;
}
