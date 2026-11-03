"use client";
/** Hook that applies and dismisses proposals, remembering what happened to each in this session. */
import type { PatternVersion } from "@tafsila/schemas";
import { useState } from "react";
import { toApiError, useApiErrorHandler } from "@/shared/error-display";
import type { LocalApply } from "../model/apply-state";
import { useApplyChatEdit } from "./use-apply-chat-edit";

/** What the panel uses to apply. */
export interface ApplyAction {
  /** What happened to each proposal, by message id. */
  readonly local: Readonly<Record<string, LocalApply>>;
  /** Applies a proposal. */
  readonly apply: (messageId: string) => void;
  /** Hides a proposal without applying it. */
  readonly dismiss: (messageId: string) => void;
  /** True when the proposal was dismissed. */
  readonly isDismissed: (messageId: string) => boolean;
}

/**
 * Wires applying. A stale proposal (409) is told to ask again and never re-applied.
 *
 * @param designId - The design.
 * @param onApplied - Called with the new version after a successful apply.
 * @returns The state and the handlers.
 */
export function useApplyAction(designId: string, onApplied: (version: PatternVersion) => void): ApplyAction {
  const handleError = useApiErrorHandler();
  const mutation = useApplyChatEdit();
  const [local, setLocal] = useState<Readonly<Record<string, LocalApply>>>({});
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  /**
   * Records what happened to one proposal.
   *
   * @param id - The proposal's message id.
   * @param next - What happened; undefined forgets it.
   */
  const mark = (id: string, next: LocalApply | undefined): void => {
    setLocal((all) => {
      const rest = Object.fromEntries(Object.entries(all).filter(([key]) => key !== id));
      return next === undefined ? rest : { ...rest, [id]: next };
    });
  };

  /**
   * Applies one proposal.
   *
   * @param messageId - The proposal's message id.
   */
  const apply = (messageId: string): void => {
    mark(messageId, { kind: "applying" });
    mutation.mutate(
      { designId, messageId },
      {
        onSuccess: ({ version }) => {
          mark(messageId, { kind: "applied", versionNo: version.versionNo });
          onApplied(version);
        },
        onError: (error) => {
          if (toApiError(error).code === "CHAT_PROPOSAL_STALE") return mark(messageId, { kind: "stale" });
          mark(messageId, undefined);
          handleError(error, "action");
        },
      },
    );
  };
  return {
    local,
    apply,
    dismiss: (id) => setDismissed((all) => new Set(all).add(id)),
    isDismissed: (id) => dismissed.has(id),
  };
}
