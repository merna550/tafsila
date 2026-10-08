/** Error reporter port: services and middleware report failures through this interface, never through a vendor SDK. */

/** Context attached to a reported error. */
export interface ErrorContext {
  /** Id of the failing request, also returned to the user in the x-request-id header. */
  readonly requestId: string;
}

/** Sends unexpected errors to an error-tracking service. */
export interface ErrorReporter {
  /** Reports an unexpected error with its request context. */
  captureException(error: unknown, context: ErrorContext): void;
  /** Tags later reports with the opaque user id (never email or phone). */
  setUser(id: string | null): void;
}
