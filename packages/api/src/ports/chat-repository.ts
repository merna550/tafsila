/** Chat repository port: the chat history of the signed-in user's designs (FR-CHAT-01..04). Owner only; admins cannot read it. */
import type { BilingualText, ChatOutcome, SpecPatch, StoredChatMessage } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** One user message and the assistant's answer to it, stored together. */
export interface NewChatExchange {
  readonly designId: string;
  /** The version the request was made against. */
  readonly baseVersionId: string;
  /** What the user wrote. */
  readonly userMessage: string;
  /** The assistant's answer. */
  readonly answer: {
    /** English text kept as the assistant turn when the history goes back to the model. */
    readonly content: string;
    /** The proposed patch (with `unsupported` set when the outcome is `unsupported`). */
    readonly patch: SpecPatch;
    /** Summary lines; the closest supported changes when the outcome is `unsupported`. */
    readonly changes: readonly BilingualText[];
    readonly outcome: Exclude<ChatOutcome, "none">;
  };
}

/** Stores and reads chat messages. Another user's design behaves as if it did not exist. */
export interface ChatRepository {
  /**
   * Lists a design's messages, oldest first.
   *
   * @param ctx - Verified caller.
   * @param designId - Design id.
   * @returns The messages (empty for a design without chat).
   */
  list(ctx: AuthContext, designId: string): Promise<StoredChatMessage[]>;
  /**
   * Stores a user message and its answer in one write.
   *
   * @param ctx - Verified caller.
   * @param input - The exchange.
   * @returns The stored assistant message, or undefined when the design is missing or not the caller's.
   */
  addExchange(ctx: AuthContext, input: NewChatExchange): Promise<StoredChatMessage | undefined>;
  /**
   * Reads one message of a design.
   *
   * @param ctx - Verified caller.
   * @param designId - Design id.
   * @param messageId - Message id.
   * @returns The message, or undefined when missing or not the caller's.
   */
  get(ctx: AuthContext, designId: string, messageId: string): Promise<StoredChatMessage | undefined>;
  /**
   * Records the version an applied proposal created.
   *
   * @param ctx - Verified caller.
   * @param messageId - The assistant message.
   * @param versionId - The version it created.
   */
  markApplied(ctx: AuthContext, messageId: string, versionId: string): Promise<void>;
}
