/** Rate limits for phone verification (NFR-04) and the pure rule evaluation shared by the memory adapter and the tests. */
import type { ErrorCode } from "./errors";

/** Whose events a rule counts. */
export type LimitScope = "account" | "number" | "ip";

/** Which kind of event a rule counts. */
export type AttemptKind = "send" | "verify_fail";

/** One limit: at most `max` events of the kind per scope inside the window. */
export interface LimitRule {
  readonly scope: LimitScope;
  readonly windowSeconds: number;
  readonly max: number;
}

const MS_PER_SECOND = 1000;
const MINUTE = 60;
const QUARTER_HOUR = 900;
const HOUR = 3600;
const DAY = 86_400;

/** Seconds before the same account may ask for another code (the design's countdown). */
export const RESEND_COOLDOWN_SECONDS = MINUTE;

/** Send limits: per account 1 per minute, 5 per hour, 10 per day; per number 5 per hour, 10 per day; per IP 30 per hour. */
export const SEND_LIMITS: readonly LimitRule[] = [
  { scope: "account", windowSeconds: RESEND_COOLDOWN_SECONDS, max: 1 },
  { scope: "account", windowSeconds: HOUR, max: 5 },
  { scope: "account", windowSeconds: DAY, max: 10 },
  { scope: "number", windowSeconds: HOUR, max: 5 },
  { scope: "number", windowSeconds: DAY, max: 10 },
  { scope: "ip", windowSeconds: HOUR, max: 30 },
];

/** Wrong-code limits: per account 5 per 15 minutes, per number 10 per hour, per IP 50 per hour. */
export const VERIFY_FAIL_LIMITS: readonly LimitRule[] = [
  { scope: "account", windowSeconds: QUARTER_HOUR, max: 5 },
  { scope: "number", windowSeconds: HOUR, max: 10 },
  { scope: "ip", windowSeconds: HOUR, max: 50 },
];

/** Events older than this are deleted by the database function. */
export const EVENT_RETENTION_SECONDS = DAY;

/** The answer of an attempt check, the same shape the database function returns. */
export interface AttemptResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
  readonly scope: LimitScope | null;
  readonly windowSeconds: number | null;
  /** How many events of this kind the account had before this one. */
  readonly priorEvents: number;
}

/** One recorded event as the memory adapter stores it (hashes as hex text). */
export interface LimitEvent {
  readonly kind: AttemptKind;
  readonly userId: string;
  readonly phoneHash: string;
  readonly ipHash: string | null;
  readonly at: Date;
}

/** The identity behind an attempt. */
export interface LimitKeys {
  readonly userId: string;
  readonly phoneHash: string;
  readonly ipHash: string | null;
}

/**
 * Tells whether an event counts for a rule's scope.
 *
 * @param event - A recorded event.
 * @param scope - Rule scope.
 * @param keys - Who is attempting now.
 * @returns True when the event belongs to the same account, number or IP.
 */
function inScope(event: LimitEvent, scope: LimitScope, keys: LimitKeys): boolean {
  if (scope === "account") return event.userId === keys.userId;
  if (scope === "number") return event.phoneHash === keys.phoneHash;
  return keys.ipHash !== null && event.ipHash === keys.ipHash;
}

/** What an attempt is checked against. */
export interface LimitQuery {
  readonly kind: AttemptKind;
  readonly keys: LimitKeys;
  readonly rules: readonly LimitRule[];
}

/**
 * Checks the rules against past events: the longest wait among the full rules wins; a window of exactly its length is free again.
 *
 * @param events - Recorded events.
 * @param query - Kind of event, who is attempting, and the rules to apply.
 * @param now - Current time.
 * @returns Allowed, or the wait and the rule that causes it.
 * @example
 * evaluateLimits([], { kind: "send", keys, rules: SEND_LIMITS }, new Date()).allowed; // true
 */
export function evaluateLimits(events: readonly LimitEvent[], query: LimitQuery, now: Date): AttemptResult {
  const { kind, keys, rules } = query;
  const priorEvents = events.filter((e) => e.kind === kind && e.userId === keys.userId).length;
  let worst: AttemptResult = {
    allowed: true,
    retryAfterSeconds: 0,
    scope: null,
    windowSeconds: null,
    priorEvents,
  };
  for (const rule of rules) {
    const windowStart = now.getTime() - rule.windowSeconds * MS_PER_SECOND;
    const inWindow = events
      .filter((e) => e.kind === kind && e.at.getTime() > windowStart && inScope(e, rule.scope, keys))
      .map((e) => e.at.getTime());
    if (inWindow.length < rule.max) continue;
    const oldest = Math.min(...inWindow);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + rule.windowSeconds * MS_PER_SECOND - now.getTime()) / MS_PER_SECOND),
    );
    if (retryAfterSeconds > worst.retryAfterSeconds) {
      worst = {
        allowed: false,
        retryAfterSeconds,
        scope: rule.scope,
        windowSeconds: rule.windowSeconds,
        priorEvents,
      };
    }
  }
  return worst;
}

/**
 * Chooses the error code for a refused send: the one-minute cooldown is "too soon", everything else is "too many".
 *
 * @param result - A refused attempt.
 * @returns PHONE_RESEND_TOO_SOON or PHONE_TOO_MANY_ATTEMPTS.
 */
export function sendLimitErrorCode(result: AttemptResult): ErrorCode {
  return result.scope === "account" && result.windowSeconds === RESEND_COOLDOWN_SECONDS
    ? "PHONE_RESEND_TOO_SOON"
    : "PHONE_TOO_MANY_ATTEMPTS";
}
