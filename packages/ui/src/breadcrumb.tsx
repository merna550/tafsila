/** Breadcrumb: the path to the current page ("My clients / Salma Adel"); links are passed in so the app can use its own router link. */
import type { ReactElement, ReactNode } from "react";
import { cx } from "./styles";

/** One step of the path. */
export interface BreadcrumbItem {
  /** Stable key of the step. */
  readonly key: string;
  /** The step's content: a link for earlier steps, plain text for the current one. */
  readonly content: ReactNode;
}

/** Props for {@link Breadcrumb}. */
export interface BreadcrumbProps {
  /** Accessible name of the navigation (already translated). */
  readonly label: string;
  /** Steps in order; the last one is the current page. */
  readonly items: readonly BreadcrumbItem[];
  /** Extra classes. */
  readonly className?: string;
}

/**
 * Renders the path with "/" separators and marks the last step as the current page.
 *
 * @param props - Label and steps.
 * @returns A navigation landmark with an ordered list.
 */
export function Breadcrumb({ label, items, className }: Readonly<BreadcrumbProps>): ReactElement {
  return (
    <nav aria-label={label} className={cx("text-sm text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.key} aria-current={isLast ? "page" : undefined} className="flex items-center gap-2">
              {item.content}
              {isLast ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
