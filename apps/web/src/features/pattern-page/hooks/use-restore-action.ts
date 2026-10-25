"use client";
/** Hook behind "Restore": asks first, restores through the API, puts the result in the stores, toasts and goes to the pattern page. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useEditorStore } from "@/features/design-picker";
import { fromVersion } from "@/features/pattern-options";
import { useRestoreVersion } from "@/features/pattern-versions";
import { useApiErrorHandler } from "@/shared/error-display";
import { useRouter } from "@/shared/i18n";
import { usePageStore } from "./use-page-store";
import { useUnsavedEdits } from "./use-unsaved-edits";

/** The version the user asked to restore. */
export interface RestoreRequest {
  /** Version id. */
  readonly id: string;
  /** The number the user sees. */
  readonly versionNo: number;
}

/** What the screens use. */
export interface RestoreAction {
  /** The version waiting for confirmation, or null. */
  readonly asking: RestoreRequest | null;
  /** Opens the confirmation for a version. */
  readonly ask: (request: RestoreRequest) => void;
  /** Closes the confirmation. */
  readonly cancel: () => void;
  /** Restores the asked version. */
  readonly confirm: () => void;
  /** True while the request runs. */
  readonly pending: boolean;
  /** True when unsaved edits of this design would be replaced. */
  readonly dirty: boolean;
}

/**
 * Wires the restore: the shown number always comes from the server's answer.
 *
 * @param designId - Design id.
 * @returns The state and handlers of the confirmation.
 */
export function useRestoreAction(designId: string): RestoreAction {
  const t = useTranslations("versionHistory.toast");
  const router = useRouter();
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useRestoreVersion();
  const dirty = useUnsavedEdits(designId);
  const [asking, setAsking] = useState<RestoreRequest | null>(null);

  /** Runs the restore and applies the answer. */
  const confirm = (): void => {
    if (asking === null) return;
    mutation.mutate(
      { versionId: asking.id, designId },
      {
        onSuccess: ({ version, reused }) => {
          const page = usePageStore.getState();
          if (page.designId === designId) {
            useEditorStore.getState().markSaved(version.spec);
            page.replace(fromVersion(version, page.options?.clientId ?? null), {
              id: version.id,
              versionNo: version.versionNo,
              inputHash: version.inputHash,
            });
          }
          showToast({ title: t(reused ? "already" : "done", { n: version.versionNo }), tone: "success" });
          setAsking(null);
          router.push(`/designs/${designId}/pattern`);
        },
        onError: (error) => {
          handleError(error, "action");
          setAsking(null);
        },
      },
    );
  };
  return {
    asking,
    ask: setAsking,
    cancel: () => setAsking(null),
    confirm,
    pending: mutation.isPending,
    dirty,
  };
}
