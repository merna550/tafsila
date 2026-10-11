/** AppShell: the page frame (banner slot, header, navigation, content), mobile first. */
import type { ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** Props for {@link AppShell}. */
export interface AppShellProps {
  /** Slot at the very top, for example the connection banner; nothing renders when omitted. */
  readonly banner?: ReactNode;
  /** Header content (brand, account menu). */
  readonly header: ReactNode;
  /** Navigation links; a scrolling strip on mobile and a side column on desktop. */
  readonly navigation?: ReactNode;
  /** Accessible name of the navigation (already translated). Required with `navigation`. */
  readonly navigationLabel?: string;
  /** Page content. */
  readonly children: ReactNode;
  /** Extra classes for the content area. */
  readonly className?: string;
}

/**
 * Lays out the app: banner on top, then header, then navigation beside (desktop) or above (mobile) the content.
 *
 * @param props - Slots for banner, header, navigation and content.
 * @returns The shell element.
 * @example
 * <AppShell banner={<ConnectionBanner />} header={<Brand />} navigation={<NavLinks />} navigationLabel={t("nav.main")}>{page}</AppShell>
 */
export function AppShell({
  banner,
  header,
  navigation,
  navigationLabel,
  children,
  className,
}: Readonly<AppShellProps>): ReactElement {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-text">
      {banner ? <div data-slot="banner">{banner}</div> : null}
      <header className="sticky top-0 z-sticky flex min-h-14 items-center gap-3 border-b border-border bg-surface px-4">
        {header}
      </header>
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        {navigation ? (
          <nav
            aria-label={navigationLabel}
            className="flex gap-1 overflow-x-auto border-b border-border bg-surface p-2 md:w-56 md:shrink-0 md:flex-col md:border-b-0 md:border-e"
          >
            {navigation}
          </nav>
        ) : null}
        <main className={cx("min-w-0 flex-1 p-4 md:p-6", className)}>{children}</main>
      </div>
    </div>
  );
}
