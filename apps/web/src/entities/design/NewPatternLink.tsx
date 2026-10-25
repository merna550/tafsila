/** "New pattern" link: opens the garment-type step, for a client when her id is given. */
import { BUTTON_VARIANT_CLASSES, PlusIcon } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link NewPatternLink}. */
interface NewPatternLinkProps {
  /** Client the pattern is for; omit for a pattern without a client. */
  readonly clientId?: string;
  /** Visual weight: the one primary action of a screen, or a secondary link. */
  readonly variant?: "primary" | "secondary";
  /** Text of the link; defaults to "New pattern". */
  readonly label?: string;
  /** Extra classes. */
  readonly className?: string;
}

/**
 * Builds the address of the new-pattern step.
 *
 * @param clientId - Optional client id.
 * @returns `/designs/new`, with `?clientId=` when a client is given.
 */
export function newPatternHref(clientId?: string): string {
  return clientId === undefined ? "/designs/new" : `/designs/new?clientId=${encodeURIComponent(clientId)}`;
}

/**
 * Renders a link styled as a button.
 *
 * @param props - Client, variant, label and classes.
 * @returns The link.
 */
export function NewPatternLink({
  clientId,
  variant = "primary",
  label,
  className,
}: Readonly<NewPatternLinkProps>): ReactElement {
  const t = useTranslations("designs");
  return (
    <Link
      href={newPatternHref(clientId)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-focus ${BUTTON_VARIANT_CLASSES[variant]} ${className ?? ""}`}
    >
      <PlusIcon className="size-5" />
      {label ?? t("new")}
    </Link>
  );
}
