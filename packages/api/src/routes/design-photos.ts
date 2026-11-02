/** Design photo routes: signed upload URLs, signed read URLs and delete for the signed-in user's designs. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createPhotoUploadsInputSchema,
  designPhotosResponseSchema,
  photoSlotParamsSchema,
  photoUploadsResponseSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_NO_CONTENT, HTTP_OK } from "../openapi/status";
import { createPhotoUploads } from "../services/create-photo-uploads";
import { deletePhoto } from "../services/delete-photo";
import { listPhotos } from "../services/list-photos";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one design. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes POST /designs/{id}/photos.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const uploadRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs/{id}/photos",
    tags: ["designs"],
    summary:
      "Get signed upload URLs for 1 to 3 photos (front required); the paths are recorded on the design",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams, body: { ...jsonContent(createPhotoUploadsInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "One signed upload per photo", ...jsonContent(photoUploadsResponseSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "PHOTO_FRONT_REQUIRED",
        "PHOTO_TOO_LARGE",
        "PHOTO_TYPE_NOT_ALLOWED",
        "PHOTO_LIMIT_REACHED",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes GET /designs/{id}/photos.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs/{id}/photos",
    tags: ["designs"],
    summary: "List the design's photos with signed read URLs (valid for 5 minutes)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The photos that exist", ...jsonContent(designPhotosResponseSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes DELETE /designs/{id}/photos/{slot}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const deleteRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/designs/{id}/photos/{slot}",
    tags: ["designs"],
    summary: "Remove one photo (front can only be removed last)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams.extend(photoSlotParamsSchema.shape) },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Removed" },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "PHOTO_NOT_FOUND",
        "PHOTO_FRONT_REQUIRED",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Creates the design photo routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, design repository, photo storage).
 * @returns A sub-app serving the three photo routes.
 */
export function designPhotoRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(uploadRoute(container), async (c) =>
      c.json(
        await createPhotoUploads(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(await listPhotos(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(deleteRoute(container), async (c) => {
      const { id, slot } = c.req.valid("param");
      await deletePhoto(container, c.get("auth"), id, slot);
      return c.body(null, HTTP_NO_CONTENT);
    });
}
