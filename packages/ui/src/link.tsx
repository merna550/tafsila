/** Link: the single text link component; use `asChild` to style a router link (e.g. next/link). */
import { Slot } from "@radix-ui/react-slot";
import type { AnchorHTMLAttributes, ReactElement } from "react";
import { FOCUS_RING, cx } from "./styles";

/** Props for {@link Link}: native anchor props. */
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** When true, the single child element receives the link styles instead of rendering an `<a>`. */
  readonly asChild?: boolean;
}

/**
 * Renders an underlined, focus-visible link.
 *
 * @param props - Anchor props plus `asChild`.
 * @returns The link element.
 * @example
 * <Link href="/help">{t("common.help")}</Link>
 */
export function Link({ asChild = false, className, ...rest }: Readonly<LinkProps>): ReactElement {
  const Component = asChild ? Slot : "a";
  const classes = cx(
    "rounded-sm text-primary underline underline-offset-4 hover:text-primary-hover",
    FOCUS_RING,
    className,
  );
  return <Component className={classes} {...rest} />;
}
