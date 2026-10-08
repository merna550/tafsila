/** Home page placeholder for milestone M0: proves RTL layout, shared UI and the API are wired. */
import type { ReactElement } from "react";
import { SignupButton } from "../features/home";

/**
 * Renders the landing placeholder in Arabic.
 *
 * @returns The home page.
 */
export default function HomePage(): ReactElement {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-4xl font-bold">تفصيلة</h1>
      <p className="text-lg leading-8">
        ارفعي صورة الموديل، دخّلي المقاسات، وخدي باترون دقيق جاهز للقص، على البروجكتور أو مباشرة على القماش.
      </p>
      <div className="flex gap-3">
        <SignupButton />
        <a href="/api/health" className="self-center text-sm underline underline-offset-4">
          حالة النظام
        </a>
      </div>
    </main>
  );
}
