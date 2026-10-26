"use client";
/** The "Direct cut" button of the "use this version" bar; disabled with its reason when the version cannot be drawn. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link DirectCutLink}. */
interface DirectCutLinkProps {
  /** Where the direct-cut screen of the version is. */
  readonly href: string;
  /** True when the version failed to draft, so there are no steps. */
  readonly disabled: boolean;
}

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus";

/**
 * Renders the link, or a disabled twin with the reason.
 *
 * @param props - The target and whether it is disabled.
 * @returns The button.
 */
export function DirectCutLink({ href, disabled }: Readonly<DirectCutLinkProps>): ReactElement {
  const t = useTranslations("directCut.link");
  if (disabled) {
    return (
      <>
        <span
          aria-disabled="true"
          aria-describedby="direct-cut-disabled-reason"
          data-testid="open-direct-cut-disabled"
          className={`${BUTTON} cursor-not-allowed border border-border bg-surface-hover text-muted`}
        >
          {t("label")}
        </span>
        <p id="direct-cut-disabled-reason" className="w-full text-xs text-muted">
          {t("disabled")}
        </p>
      </>
    );
  }
  return (
    <Link
      href={href}
      data-testid="open-direct-cut"
      className={`${BUTTON} border border-border bg-surface text-text hover:bg-surface-hover`}
    >
      {t("label")}
    </Link>
  );
}
