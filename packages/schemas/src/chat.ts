/** Contract for the chat edit routes under /designs/{id}/chat (SRS FR-CHAT-01..04, FR-CHAT-06, §8): propose, list and apply spec patches. */
import { z } from "zod";
import { bilingualTextSchema } from "./fabric";
import { specPatchSchema } from "./spec-patch";

/** Longest chat message accepted (FR-CHAT-01). */
export const MAX_CHAT_MESSAGE_LENGTH = 500;

/** Body of POST /designs/{id}/chat. */
export const sendChatMessageInputSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH).meta({ example: "add side pockets" }),
  versionId: z.uuid().meta({
    example: "00000000-0000-4000-8000-0000000000f1",
    description: "The version the request is about; the proposal is tied to it",
  }),
});

/** Parsed chat request. */
export type SendChatMessageInput = z.infer<typeof sendChatMessageInputSchema>;

/** What the assistant answered: a valid `proposal`, an `unsupported` explanation, or `none` (a user message). */
export const chatOutcomeSchema = z.enum(["proposal", "unsupported", "none"]);

/** What the assistant answered. */
export type ChatOutcome = z.infer<typeof chatOutcomeSchema>;

/** One line of a change summary, in both languages. */
export const changeLineSchema = bilingualTextSchema.meta({
  example: { ar: "طول الكم: قصير ← طويل", en: "Sleeve length: short → long" },
});

/** A request the engine cannot do, with the closest supported changes as summary lines (FR-CHAT-04). */
export const chatUnsupportedSchema = z.object({
  text: bilingualTextSchema,
  closest: z.array(changeLineSchema),
});

/** Body of the answer to POST /designs/{id}/chat. */
export const sendChatMessageResultSchema = z.object({
  messageId: z.uuid().meta({ description: "The assistant message; pass it to the apply route" }),
  outcome: chatOutcomeSchema,
  changes: z.array(changeLineSchema),
  unsupported: chatUnsupportedSchema.optional(),
  used: z
    .number()
    .int()
    .nonnegative()
    .meta({ example: 1, description: "User messages sent for this design" }),
  limit: z.number().int().positive().meta({ example: 10 }),
});

/** Answer to a chat message. */
export type SendChatMessageResult = z.infer<typeof sendChatMessageResultSchema>;

/** One stored chat message. */
export const chatMessageSchema = z.object({
  id: z.uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  outcome: chatOutcomeSchema,
  changes: z.array(changeLineSchema),
  unsupported: chatUnsupportedSchema.optional(),
  baseVersionId: z.uuid().nullable(),
  appliedVersionId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

/** One stored chat message. */
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Response of GET /designs/{id}/chat: the history, newest last, with the quota. */
export const chatHistorySchema = z.object({
  items: z.array(chatMessageSchema),
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

/** The chat history of a design. */
export type ChatHistory = z.infer<typeof chatHistorySchema>;

/** A stored message with the patch behind it, as the repository returns it (never sent to clients). */
export const storedChatMessageSchema = chatMessageSchema.extend({
  designId: z.uuid(),
  proposedPatch: specPatchSchema.nullable(),
});

/** A stored message with its patch. */
export type StoredChatMessage = z.infer<typeof storedChatMessageSchema>;
