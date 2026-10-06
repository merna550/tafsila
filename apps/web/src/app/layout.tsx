/** Root layout: Arabic, right-to-left by default (SRS NFR-06). */
import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "تفصيلة | Tafsila",
  description: "حوّلي صورة أي موديل لباترون جاهز للقص على مقاسك",
};

/**
 * Wraps every page with the document shell in Arabic RTL.
 *
 * @param props - The page content.
 * @param props.children - Page to render.
 * @returns The html/body shell.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
