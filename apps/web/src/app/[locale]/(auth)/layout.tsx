/** Layout shared by every auth-group page: nothing but the page; the hero layout lives in `(with-hero)`. */
import type { ReactElement, ReactNode } from "react";

/**
 * Passes the page through. Sign-in, sign-up and the password screens add the hero panel in their own group; the
 * verify-phone screen is a single centred card without it (docs/design/screens/Verify.dc.html).
 *
 * @param props - The page.
 * @param props.children - The open screen.
 * @returns The page.
 */
export default function AuthGroupLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return <>{children}</>;
}
