/** The failed state: says so, offers another try and the manual picker (FR-DES-02). */
import { Button, Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link FailedPanel}. */
interface FailedPanelProps {
  /** True while a new analysis is being requested. */
  readonly retrying: boolean;
  /** Asks for a new analysis. */
  readonly onRetry: () => void;
}

/**
 * Renders the message and its two ways out.
 *
 * @param props - The retry state and handler.
 * @returns The panel.
 */
export function FailedPanel({ retrying, onRetry }: Readonly<FailedPanelProps>): ReactElement {
  const t = useTranslations("confirmDesign");
  return (
    <section className="flex flex-col gap-3">
      <p role="alert" className="m-0 rounded-md border border-danger bg-accent-soft px-3.5 py-2.5">
        {t("failed")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={retrying} onClick={onRetry}>
          {t("retry")}
        </Button>
        <UiLink asChild>
          <Link href="/designs/new">{t("manual")}</Link>
        </UiLink>
      </div>
    </section>
  );
}
