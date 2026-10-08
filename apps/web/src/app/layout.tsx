/** Root layout: Arabic, right-to-left by default (SRS NFR-06). */
import { loadPublicConfig } from "@tafsila/config";
import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactElement, ReactNode } from "react";
import { ObservabilityProvider } from "../shared/observability/ObservabilityProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "تفصيلة | Tafsila",
  description: "حوّلي صورة أي موديل لباترون جاهز للقص على مقاسك",
};

/**
 * Wraps every page with the document shell in Arabic RTL and starts error tracking and analytics.
 * Reads the browser configuration per request (not at build time) so one build runs everywhere.
 *
 * @param props - The page content.
 * @param props.children - Page to render.
 * @returns The html/body shell.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): Promise<ReactElement> {
  await connection();
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">
        <ObservabilityProvider config={loadPublicConfig()} />
        {children}
      </body>
    </html>
  );
}
