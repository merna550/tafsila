/**
 * Version of the nesting algorithm, stored with each saved calculation (`fabric_calcs.nesting_version`, ADR-312 item 5).
 * Bump it when a change can move a placement or change a length for the same input (decision 316 item 3): the major
 * number for a new algorithm, the minor for a changed rule (slice width, orders, rounding), the patch for a fix that
 * moves a layout. A change that leaves every output equal keeps the version.
 */
export const NESTING_VERSION = "1.0.0";
