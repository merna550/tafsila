/** Rules of the message box: what may be sent, and why the box is off (FR-CHAT-01, FR-CHAT-06). */
import { MAX_CHAT_MESSAGE_LENGTH } from "@tafsila/schemas";

/** Why the box is off. */
export type ComposeBlock = "no-version" | "quota" | "daily" | "busy";

/** What the composer needs to know. */
export interface ComposeInput {
  /** The text in the box. */
  readonly text: string;
  /** User messages sent for this design. */
  readonly used: number;
  /** Messages allowed per design. */
  readonly limit: number;
  /** True when the design has a saved version. */
  readonly hasVersion: boolean;
  /** True after the server said today's limit was reached. */
  readonly dailyLimited: boolean;
  /** True while a message is on its way. */
  readonly busy: boolean;
}

/** The composer's state. */
export interface ComposeState {
  /** Why the box is off, or null. */
  readonly block: ComposeBlock | null;
  /** True when Send may be pressed. */
  readonly canSend: boolean;
  /** Messages left for this design. */
  readonly remaining: number;
  /** Characters typed. */
  readonly length: number;
  /** True when the text is longer than the limit. */
  readonly tooLong: boolean;
}

/**
 * Finds why the box is off, in order of importance.
 *
 * @param input - The composer inputs.
 * @returns The reason, or null.
 */
function blockOf(input: ComposeInput): ComposeBlock | null {
  if (!input.hasVersion) return "no-version";
  if (input.used >= input.limit) return "quota";
  if (input.dailyLimited) return "daily";
  return input.busy ? "busy" : null;
}

/**
 * Decides whether the typed text may be sent.
 *
 * @param input - The composer inputs.
 * @returns The state.
 */
export function composeState(input: ComposeInput): ComposeState {
  const block = blockOf(input);
  const length = input.text.trim().length;
  const tooLong = length > MAX_CHAT_MESSAGE_LENGTH;
  return {
    block,
    canSend: block === null && length > 0 && !tooLong,
    remaining: Math.max(0, input.limit - input.used),
    length: input.text.length,
    tooLong,
  };
}
