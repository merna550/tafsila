/** Skeleton: grey placeholder shapes shown while data loads (the "loading" state of every data screen). */
import type { ReactElement } from "react";
import { cx } from "./styles";

/** Shapes a skeleton can take. */
export type SkeletonVariant = "line" | "block" | "circle" | "table";

/** Props for {@link Skeleton}. */
export interface SkeletonProps {
  /** Shape; defaults to "line". */
  readonly variant?: SkeletonVariant;
  /** Number of rows when the variant is "table"; defaults to 4. */
  readonly rows?: number;
  /** Extra classes (for example a width). */
  readonly className?: string;
}

/** Shared look of one placeholder shape. */
const SHAPE = "animate-pulse rounded-md bg-surface-hover motion-reduce:animate-none";

/**
 * Renders a loading placeholder; hidden from screen readers (the page announces loading itself).
 *
 * @param props - Variant, rows and classes.
 * @returns The placeholder element.
 * @example
 * if (query.isPending) return <Skeleton variant="table" />;
 */
export function Skeleton({ variant = "line", rows = 4, className }: Readonly<SkeletonProps>): ReactElement {
  if (variant === "table") {
    return (
      <div aria-hidden="true" className={cx("flex flex-col gap-3", className)}>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={cx(SHAPE, "h-11 w-full")} />
        ))}
      </div>
    );
  }
  const size = { line: "h-4 w-full", block: "h-24 w-full", circle: "size-11 rounded-full" }[variant];
  return <div aria-hidden="true" className={cx(SHAPE, size, className)} />;
}
