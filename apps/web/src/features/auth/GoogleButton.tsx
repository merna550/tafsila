"use client";
/** "Continue with Google" button; the page decides whether to show it (AUTH_GOOGLE_ENABLED). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useGoogleSignIn } from "./hooks/use-google-sign-in";

/**
 * Renders the Google button with the "or" divider above it.
 *
 * @param props - The raw `next` value to keep through the round trip.
 * @param props.next - Where to go after signing in.
 * @returns The divider and button.
 */
export function GoogleButton({ next }: Readonly<{ next: string | null }>): ReactElement {
  const t = useTranslations("auth");
  const { start, pending } = useGoogleSignIn(next);
  return (
    <>
      <div className="flex items-center gap-3 text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span>{t("or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => void start()}
        className="min-h-12 w-full text-lg"
      >
        {t("google")}
      </Button>
    </>
  );
}
