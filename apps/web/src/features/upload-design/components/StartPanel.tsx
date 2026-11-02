/** The start area: the hint, the primary "Start analysis" button and the manual-picker link (FR-DES-02). */
import { Button, Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link StartPanel}. */
interface StartPanelProps {
  /** True when no photo has been added yet. */
  readonly empty: boolean;
  readonly enabled: boolean;
  readonly running: boolean;
  readonly onStart: () => void;
}

/**
 * Renders the start button with its hint and the manual link.
 *
 * @param props - The state and the start handler.
 * @returns The panel.
 */
export function StartPanel({ empty, enabled, running, onStart }: Readonly<StartPanelProps>): ReactElement {
  const t = useTranslations("uploadDesign");
  const blocked = !enabled || running;
  return (
    <div className="flex flex-col gap-2">
      {empty ? <p className="m-0 text-sm text-muted">{t("needFront")}</p> : null}
      <Button className="w-full" disabled={blocked} aria-disabled={blocked} onClick={onStart}>
        {running ? t("starting") : t("start")}
      </Button>
      <UiLink asChild className="flex min-h-11 items-center justify-center font-semibold">
        <Link href="/designs/new">{t("manual")}</Link>
      </UiLink>
    </div>
  );
}
