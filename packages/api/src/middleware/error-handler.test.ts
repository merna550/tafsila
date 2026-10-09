import { apiErrorBodySchema } from "@tafsila/schemas";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../domain/errors";
import { createErrorHandler } from "./error-handler";
import { requestId, type AppEnv } from "./request-id";

const reported: Error[] = [];
const app = new Hono<AppEnv>();
app.use(requestId());
app.get("/invalid", () => {
  throw new ValidationError({ chest_mm: "مطلوب" });
});
app.get("/boom", () => {
  throw new Error("secret internals");
});
app.onError(
  createErrorHandler({
    captureException: (error) => {
      reported.push(error as Error);
    },
    setUser: () => undefined,
  }),
);

describe("error handler", () => {
  it("returns field messages in details.fields and matches the shared body schema", async () => {
    const res = await app.request("/invalid");
    expect(res.status).toBe(400);
    const body = apiErrorBodySchema.parse(await res.json());
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.details?.fields).toEqual({ chest_mm: "مطلوب" });
  });

  it("hides internals of unexpected errors and reports them", async () => {
    const res = await app.request("/boom");
    expect(res.status).toBe(500);
    const body = apiErrorBodySchema.parse(await res.json());
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(reported).toHaveLength(1);
  });
});
