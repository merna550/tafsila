/** The bar under the cards: how many features are left to check, and the continue button (FR-DES-04). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

/** Props for {@link ContinueBar}. */
interface ContinueBarProps {
  /** Features still waiting for the user. */
  readonly remaining: number;
  /** True while the draft is being handed over. */
  readonly busy: boolean;
  /** Goes on to the pattern. */
  readonly onContinue: () => void;
}

/**
 * Renders the status text and the button; the button stays off until nothing is left.
 *
 * @param props - The count and the handler.
 * @returns The bar.
 */
export function ContinueBar({ remaining, busy, onContinue }: Readonly<ContinueBarProps>): ReactElement {
  const t = useTranslations("confirmDesign.continue");
  const ready = remaining === 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-4 shadow-card">
      <p role="status" className={`m-0 font-semibold ${ready ? "text-success" : "text-danger"}`}>
        {ready ? t("allDone") : t("left", { count: remaining })}
      </p>
      <Button disabled={!ready || busy} onClick={onContinue}>
        {t("action")}
      </Button>
    </div>
  );
}
