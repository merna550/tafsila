/** Maps a stored chat row to the message the API shows; shared by the database and memory adapters so both answer alike. */
import { specPatchSchema, type BilingualText, type StoredChatMessage } from "@tafsila/schemas";

/** The columns of a chat row the mapping needs, in the types both adapters hold. */
export interface ChatRowFields {
  readonly id: string;
  readonly designId: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly outcome: "proposal" | "unsupported" | "none";
  readonly changes: readonly BilingualText[];
  readonly proposedPatch: unknown;
  readonly baseVersionId: string | null;
  readonly appliedVersionId: string | null;
  readonly createdAt: string;
}

/**
 * Builds the public message: an `unsupported` answer shows its closest changes under `unsupported`, a proposal under `changes`.
 *
 * @param row - The stored row.
 * @returns The message with its patch.
 */
export function toStoredChatMessage(row: ChatRowFields): StoredChatMessage {
  const parsed = specPatchSchema.safeParse(row.proposedPatch);
  const patch = parsed.success ? parsed.data : null;
  const unsupported =
    row.outcome === "unsupported" && patch?.unsupported
      ? { text: patch.unsupported.text, closest: [...row.changes] }
      : undefined;
  return {
    id: row.id,
    designId: row.designId,
    role: row.role,
    content: row.content,
    outcome: row.outcome,
    changes: row.outcome === "unsupported" ? [] : [...row.changes],
    ...(unsupported ? { unsupported } : {}),
    baseVersionId: row.baseVersionId,
    appliedVersionId: row.appliedVersionId,
    createdAt: row.createdAt,
    proposedPatch: patch,
  };
}
