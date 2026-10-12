/** Top of the verify-phone screen: the "back" link, "step 2 of 2" and the two-part progress bar from the design. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props of {@link StepHeader}. */
interface StepHeaderProps {
  /** Same-site path the "back" link opens (the screen is skippable). */
  readonly backHref: string;
  /** Called when the person leaves through "back". */
  readonly onBack: () => void;
}

/**
 * Renders the back link, the step label and the progress bar (the first part is done, the second is this screen).
 *
 * @param props - Where "back" goes and what it reports.
 * @returns The header.
 */
export function StepHeader({ backHref, onBack }: Readonly<StepHeaderProps>): ReactElement {
  const t = useTranslations("phoneVerification");
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          onClick={onBack}
          className="flex min-h-11 items-center gap-1.5 rounded-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="ltr:-scale-x-100"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          {t("back")}
        </Link>
        <span className="text-muted">{t("step")}</span>
      </div>
      <div aria-hidden="true" className="flex gap-1.5">
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className="h-1.5 flex-1 rounded-full bg-saffron" />
      </div>
    </>
  );
}
