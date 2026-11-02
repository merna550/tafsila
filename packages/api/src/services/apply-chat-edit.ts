/** Use case: apply a stored chat proposal by saving a version through the existing save path (FR-CHAT-03, ADR-002). */
import { applySpecPatch } from "@tafsila/engine/spec-rules";
import type { SavePatternVersionResult, SpecPatch, StoredChatMessage } from "@tafsila/schemas";
import { AppError, NotFoundError } from "../domain/errors";
import { regeneratePattern } from "../domain/run-pattern";
import type { ChatRepository } from "../ports/chat-repository";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";
import { appendPatternVersion, type AppendDeps } from "./pattern-version-shared";

/** Ports this use case needs. */
export interface ApplyChatEditDeps extends AppendDeps {
  readonly designs: DesignRepository;
  readonly chat: ChatRepository;
}

/**
 * Applies a proposal. The patch is checked again on the base version, the engine runs again, and a failing pattern is never saved.
 * Applying twice returns the same version.
 *
 * @param deps - Repositories, clock and analytics.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param messageId - The assistant message holding the proposal.
 * @returns The saved version and its report; `reused` is true when the proposal was applied before.
 * @throws {NotFoundError} When the design, the message or the base version is missing or not the caller's.
 * @throws {AppError} CHAT_NOTHING_TO_APPLY, CHAT_PROPOSAL_STALE or VALIDATION_FAILED.
 * @throws {PatternInvalidError} When the engine refuses the patched design (422, nothing saved).
 */
export async function applyChatEdit(
  deps: ApplyChatEditDeps,
  ctx: AuthContext,
  designId: string,
  messageId: string,
): Promise<SavePatternVersionResult> {
  const detail = await deps.designs.get(ctx, designId);
  if (!detail) throw new NotFoundError("design");
  const message = await loadProposal(deps, ctx, designId, messageId);
  if (message.appliedVersionId) return alreadyApplied(deps, ctx, message.appliedVersionId);
  if (detail.design.currentVersionId !== message.baseVersionId) throw new AppError("CHAT_PROPOSAL_STALE");
  const base = message.baseVersionId ? await deps.versions.get(ctx, message.baseVersionId) : undefined;
  if (!base) throw new NotFoundError("version");
  const patched = applySpecPatch(base.spec, message.proposedPatch);
  if (!patched.ok) {
    throw new AppError("VALIDATION_FAILED", {
      details: { fields: { patch: patched.issues.map((issue) => issue.message).join("; ") } },
    });
  }
  const { result } = await appendPatternVersion(
    deps,
    ctx,
    { designId, measurementSetId: base.measurementSetId, createdBy: "chat" },
    {
      spec: patched.spec,
      measurements: base.measurements,
      sizeLabel: base.sizeLabel ?? "unknown",
      easeProfile: base.easeProfile,
      options: base.options,
    },
  );
  await deps.chat.markApplied(ctx, messageId, result.version.id);
  return result;
}

/**
 * Answers a second apply with the version the first one made.
 *
 * @param deps - Repositories and clock.
 * @param ctx - Verified caller.
 * @param versionId - The version recorded on the message.
 * @returns That version with a fresh report, marked as reused.
 * @throws {NotFoundError} When the version is gone.
 */
async function alreadyApplied(
  deps: ApplyChatEditDeps,
  ctx: AuthContext,
  versionId: string,
): Promise<SavePatternVersionResult> {
  const version = await deps.versions.get(ctx, versionId);
  if (!version) throw new NotFoundError("version");
  const run = regeneratePattern(deps.clock, {
    spec: version.spec,
    measurements: version.measurements,
    sizeLabel: version.sizeLabel ?? "unknown",
    easeProfile: version.easeProfile,
    options: version.options,
  });
  return { version, report: run.result.validation, reused: true };
}

/** A stored message that holds a proposal. */
type Proposal = StoredChatMessage & { readonly proposedPatch: SpecPatch };

/**
 * Reads the message and checks that it holds a proposal.
 *
 * @param deps - Chat repository.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param messageId - Message id.
 * @returns The message with its patch.
 * @throws {NotFoundError} When the message is missing or not the caller's.
 * @throws {AppError} CHAT_NOTHING_TO_APPLY when it is not a proposal.
 */
async function loadProposal(
  deps: ApplyChatEditDeps,
  ctx: AuthContext,
  designId: string,
  messageId: string,
): Promise<Proposal> {
  const message = await deps.chat.get(ctx, designId, messageId);
  if (!message) throw new NotFoundError("message");
  if (message.outcome !== "proposal" || !message.proposedPatch) throw new AppError("CHAT_NOTHING_TO_APPLY");
  return { ...message, proposedPatch: message.proposedPatch };
}
