/** Shown while the nesting worker runs: the current step, a slow-run hint after 4 s, and Cancel (NFR-02). */
import { Button, Spinner } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { FabricStage } from "@/shared/fabric-nesting";

/** Props of {@link NestingProgress}. */
interface NestingProgressProps {
  /** The step that last started, or null before the first report. */
  readonly stage: FabricStage | null;
  /** True once the run took longer than the soft limit. */
  readonly slow: boolean;
  /** Called by Cancel. */
  readonly onCancel: () => void;
}

/**
 * Renders the progress line.
 *
 * @param props - The step, the slow flag and the cancel handler.
 * @returns The progress element.
 */
export function NestingProgress({ stage, slow, onCancel }: Readonly<NestingProgressProps>): ReactElement {
  const t = useTranslations("fabric.calc.progress");
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <Spinner label={t("running")} />
        <span>{stage ? t(stage) : t("running")}</span>
        <Button variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
      {slow ? <p className="text-sm text-muted">{t("slow")}</p> : null}
    </div>
  );
}
