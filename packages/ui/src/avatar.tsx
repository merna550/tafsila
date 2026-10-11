/** Avatar: a round picture with initials as the fallback, built on Radix Avatar. */
import * as RadixAvatar from "@radix-ui/react-avatar";
import type { ReactElement } from "react";
import { cx } from "./styles";

/** Props for {@link Avatar}. */
export interface AvatarProps {
  /** Image address; when missing or broken the initials show. */
  readonly src?: string;
  /** Alternative text for the image (already translated); empty for decorative use. */
  readonly alt: string;
  /** Initials shown while the image is missing (one or two letters). */
  readonly initials: string;
  /** Extra classes for the root. */
  readonly className?: string;
}

/**
 * Renders a round avatar.
 *
 * @param props - Image, alt text and fallback initials.
 * @returns The avatar element.
 * @example
 * <Avatar src={client.photo} alt={client.name} initials="مس" />
 */
export function Avatar({ src, alt, initials, className }: Readonly<AvatarProps>): ReactElement {
  return (
    <RadixAvatar.Root
      className={cx(
        "inline-flex size-11 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-surface-hover",
        className,
      )}
    >
      {src ? <RadixAvatar.Image src={src} alt={alt} className="size-full object-cover" /> : null}
      <RadixAvatar.Fallback aria-label={alt || undefined} className="text-base font-semibold text-primary">
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
