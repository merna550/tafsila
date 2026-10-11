/** Shared OpenAPI response blocks, so every documented error uses the standard body (ADR-030, docs/errors.md). */
import { apiErrorBodySchema } from "@tafsila/schemas";
import { ERROR_CATALOGUE, type ErrorCode } from "../domain/errors";

/** One OpenAPI response object that carries the standard error body. */
interface ErrorResponse {
  readonly description: string;
  readonly content: { readonly "application/json": { readonly schema: typeof apiErrorBodySchema } };
}

/**
 * Builds the `responses` entries for the given error codes, with descriptions from the catalogue.
 *
 * @param codes - Catalogue codes the route can return.
 * @returns A map from HTTP status to an OpenAPI response using `apiErrorBodySchema`.
 */
export function errorResponses(...codes: readonly ErrorCode[]): Record<number, ErrorResponse> {
  const entries = codes.map((code) => [
    ERROR_CATALOGUE[code].status,
    {
      description: `${code}: ${ERROR_CATALOGUE[code].messageEn}`,
      content: { "application/json": { schema: apiErrorBodySchema } },
    },
  ]);
  return Object.fromEntries(entries) as Record<number, ErrorResponse>;
}
