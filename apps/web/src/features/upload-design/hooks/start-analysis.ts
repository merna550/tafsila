/** The "Start analysis" sequence: create the design, get signed URLs, upload each photo, request the analysis (FR-DES-01, FR-DES-02). */
import {
  analyzeAcceptedResponseSchema,
  designSchema,
  photoUploadsResponseSchema,
  type GarmentCategory,
  type PhotoSlot,
  type PhotoUploadsResponse,
} from "@tafsila/schemas";
import { apiRequest, uploadToSignedUrl } from "@/shared/api";

/** One photo ready to send. */
export interface PhotoToUpload {
  readonly id: string;
  readonly slot: PhotoSlot;
  readonly blob: Blob;
}

/** Everything the sequence needs; the callbacks keep the screen in step. */
export interface StartPlan {
  /** Design created by an earlier try, reused so a retry never makes a second design. */
  readonly existingDesignId: string | undefined;
  readonly category: GarmentCategory;
  readonly hint: "dress" | "skirt" | "blouse" | undefined;
  readonly photos: readonly PhotoToUpload[];
  /** Called once the design exists. */
  readonly onDesign: (designId: string) => void;
  /** Called when a photo starts, advances, finishes or fails to upload. */
  readonly onPhoto: (id: string, update: PhotoUpdate) => void;
  /** Waits between upload tries; tests pass an instant one. */
  readonly sleep?: (ms: number) => Promise<void>;
}

/** What happened to one photo. */
export type PhotoUpdate =
  | { readonly kind: "uploading" }
  | { readonly kind: "progress"; readonly fraction: number }
  | { readonly kind: "uploaded" }
  | { readonly kind: "failed" };

/** Retries after the first failed upload try, and the wait before each. */
const FIRST_RETRY_MS = 500;
const SECOND_RETRY_MS = 1500;
const RETRY_DELAYS_MS = [FIRST_RETRY_MS, SECOND_RETRY_MS] as const;

/**
 * Waits for a time.
 *
 * @param ms - Milliseconds.
 * @returns Resolves after the wait.
 */
function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs an action and retries it twice with a growing wait when it fails.
 *
 * @param action - The work.
 * @param sleep - Wait function.
 * @returns The action's result.
 * @throws {Error} The last error when all tries fail.
 */
export async function withRetry<T>(
  action: () => Promise<T>,
  sleep: (ms: number) => Promise<void>,
): Promise<T> {
  for (const delay of RETRY_DELAYS_MS) {
    try {
      return await action();
    } catch {
      await sleep(delay);
    }
  }
  return action();
}

/**
 * Uploads one photo with retries and reports its progress; a failure marks the photo and is rethrown.
 *
 * @param photo - The photo.
 * @param url - Its signed upload URL.
 * @param plan - The plan with the callbacks.
 */
async function uploadOne(photo: PhotoToUpload, url: string, plan: StartPlan): Promise<void> {
  plan.onPhoto(photo.id, { kind: "uploading" });
  try {
    await withRetry(
      () =>
        uploadToSignedUrl(url, photo.blob, {
          onProgress: (fraction) => plan.onPhoto(photo.id, { kind: "progress", fraction }),
        }),
      plan.sleep ?? defaultSleep,
    );
    plan.onPhoto(photo.id, { kind: "uploaded" });
  } catch (error) {
    plan.onPhoto(photo.id, { kind: "failed" });
    throw error;
  }
}

/**
 * Asks the API for one signed URL per photo.
 *
 * @param designId - The design.
 * @param photos - The photos still to upload.
 * @returns The upload targets.
 */
async function requestUploads(
  designId: string,
  photos: readonly PhotoToUpload[],
): Promise<PhotoUploadsResponse["uploads"]> {
  const body = {
    photos: photos.map((p) => ({ slot: p.slot, contentType: "image/jpeg", sizeBytes: p.blob.size })),
  };
  const response = await apiRequest(`/designs/${designId}/photos`, {
    method: "POST",
    body,
    schema: photoUploadsResponseSchema,
  });
  return response.uploads;
}

/**
 * Creates the design (once), uploads every photo and asks for the analysis.
 *
 * @param plan - Photos, category and callbacks.
 * @returns The design id.
 * @throws {ApiError} When a step fails; photos that uploaded stay uploaded, a retry reuses the design.
 */
export async function startAnalysis(plan: StartPlan): Promise<string> {
  const designId =
    plan.existingDesignId ??
    (
      await apiRequest("/designs", {
        method: "POST",
        body: { category: plan.category },
        schema: designSchema,
      })
    ).id;
  plan.onDesign(designId);
  const uploads = plan.photos.length === 0 ? [] : await requestUploads(designId, plan.photos);
  const results = await Promise.allSettled(
    plan.photos.map((photo) => {
      const target = uploads.find((upload) => upload.slot === photo.slot);
      return target
        ? uploadOne(photo, target.signedUrl, plan)
        : Promise.reject(new Error("no upload target"));
    }),
  );
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
  await apiRequest(`/designs/${designId}/analyze`, {
    method: "POST",
    body: plan.hint ? { categoryHint: plan.hint } : {},
    schema: analyzeAcceptedResponseSchema,
  });
  return designId;
}
