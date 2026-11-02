/** Contract for /api/designs/{id}/photos (SRS FR-DES-01): private garment photos uploaded straight to storage with signed URLs. */
import { z } from "zod";

/** Which side of the garment a photo shows; `front` is required. */
export const photoSlotSchema = z.enum(["front", "back", "side"]).meta({ example: "front" });

/** Parsed photo slot. */
export type PhotoSlot = z.infer<typeof photoSlotSchema>;

/** Largest photo accepted, in bytes (10 MB, also the bucket limit). */
export const MAX_PHOTO_BYTES = 10_485_760;

/** Most photo entries a request may carry before it is rejected as malformed (the limit of 3 has its own error code). */
const MAX_REQUEST_ITEMS = 10;

/** Most photos one design holds (one per slot). */
export const MAX_PHOTOS = 3;

/** One photo the client wants to upload. Size and type are checked by the use case so each failure has its own error code. */
export const photoUploadRequestItemSchema = z.object({
  slot: photoSlotSchema,
  contentType: z.string().min(1).max(100).meta({ example: "image/jpeg" }),
  sizeBytes: z.number().int().positive().meta({ example: 1_800_000 }),
});

/** Body of POST /designs/{id}/photos: one to three photos, each slot at most once. */
export const createPhotoUploadsInputSchema = z.object({
  photos: z
    .array(photoUploadRequestItemSchema)
    .min(1)
    .max(MAX_REQUEST_ITEMS)
    .refine((items) => new Set(items.map((item) => item.slot)).size === items.length, {
      message: "Each slot can appear once",
    }),
});

/** Parsed upload request. */
export type CreatePhotoUploadsInput = z.infer<typeof createPhotoUploadsInputSchema>;

/** One signed upload target: PUT the file to `signedUrl` (or use `token` with the Storage client). */
export const photoUploadSchema = z.object({
  slot: photoSlotSchema,
  path: z.string().meta({
    example: "00000000-0000-4000-8000-00000000000a/00000000-0000-4000-8000-0000000000d1/front.jpg",
  }),
  signedUrl: z.string().meta({ description: "Short-lived URL that accepts the file without a sign-in" }),
  token: z.string().meta({ description: "Upload token contained in the signed URL" }),
});

/** Response of POST /designs/{id}/photos. */
export const photoUploadsResponseSchema = z.object({ uploads: z.array(photoUploadSchema) });

/** Parsed upload targets. */
export type PhotoUploadsResponse = z.infer<typeof photoUploadsResponseSchema>;

/** One stored photo with a short-lived read URL (5 minutes). */
export const designPhotoSchema = z.object({
  slot: photoSlotSchema,
  path: z.string().meta({
    example: "00000000-0000-4000-8000-00000000000a/00000000-0000-4000-8000-0000000000d1/front.jpg",
  }),
  url: z.string().meta({ description: "Signed read URL, valid for 5 minutes" }),
});

/** Response of GET /designs/{id}/photos. */
export const designPhotosResponseSchema = z.object({ photos: z.array(designPhotoSchema) });

/** Parsed photo list. */
export type DesignPhotosResponse = z.infer<typeof designPhotosResponseSchema>;

/** Path parameter naming one photo slot. */
export const photoSlotParamsSchema = z.object({ slot: photoSlotSchema });
