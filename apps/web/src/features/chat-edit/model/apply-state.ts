/** The state of one proposal card: idle, applying, applied, stale (FR-CHAT-03). */
import type { ProposalItem } from "./chat-view";

/** What the user sees on a proposal. */
export type ApplyState =
  | { readonly kind: "idle" }
  | { readonly kind: "applying" }
  | { readonly kind: "applied"; readonly versionNo: number | null }
  | { readonly kind: "stale" };

/** What happened to a proposal in this browser session. */
export type LocalApply =
  | { readonly kind: "applying" }
  | { readonly kind: "applied"; readonly versionNo: number }
  | { readonly kind: "stale" };

/**
 * Finds the state of a proposal from the server's data and what happened here.
 *
 * @param item - The proposal.
 * @param local - What happened in this session, if anything.
 * @param currentVersionId - The version the page shows now.
 * @returns The state to draw.
 */
export function applyStateOf(
  item: ProposalItem,
  local: LocalApply | undefined,
  currentVersionId: string | null,
): ApplyState {
  if (local?.kind === "applied") return local;
  if (item.appliedVersionId !== null) return { kind: "applied", versionNo: null };
  if (local !== undefined) return local;
  const outdated = item.baseVersionId !== null && item.baseVersionId !== currentVersionId;
  return outdated ? { kind: "stale" } : { kind: "idle" };
}
