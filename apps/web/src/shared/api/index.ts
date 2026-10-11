/** Public entry of the API client: features import from here only. */
export { ApiError, CLIENT_ERROR_MESSAGES, clientApiError, type ApiErrorKind, type Locale } from "./api-error";
export { apiRequest, type ApiRequestOptions } from "./client";
export {
  isRetryable,
  placementFor,
  supportReference,
  type ErrorContext,
  type ErrorPlacement,
} from "./error-display";
