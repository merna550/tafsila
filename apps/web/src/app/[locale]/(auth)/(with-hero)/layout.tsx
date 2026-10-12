/** Layout of the auth screens: the hero panel next to (desktop) or above (mobile) the card, centred. */
import type { ReactElement, ReactNode } from "react";
import { AuthHero } from "@/features/auth";

/**
 * Places the hero and the page's card side by side.
 *
 * @param props - The page.
 * @param props.children - The card of the open screen.
 * @returns The layout.
 */
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-wrap items-stretch gap-8 px-4 py-8">
      <AuthHero />
      {children}
    </main>
  );
}
