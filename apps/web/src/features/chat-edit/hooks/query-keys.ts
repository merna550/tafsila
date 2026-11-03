/** Query keys of the chat feature. */

/** Prefix of everything about chat. */
const ALL = ["chat"] as const;

/**
 * Key of the chat history of one design.
 *
 * @param designId - Design id.
 * @returns The query key.
 */
function history(designId: string): readonly ["chat", string] {
  return ["chat", designId] as const;
}

/** All query keys of the chat feature. */
export const chatKeys = { all: ALL, history };
