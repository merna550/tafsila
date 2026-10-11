import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { AuthHero } from "./AuthHero";
import { AuthTabs } from "./AuthTabs";
import { CheckEmailNotice } from "./CheckEmailNotice";

// next-intl's navigation helpers need the Next runtime; a plain anchor is enough to test the markup.
vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

describe("auth screen pieces", () => {
  it("shows the hero headline and the mannequin label in Arabic", () => {
    const html = renderWithIntl(<AuthHero />, "ar");
    expect(html).toContain("باترون على مقاس عميلتك.");
    expect(html).toContain("مانيكان خياطة عليه شريط قياس");
  });

  it("shows the hero in English", () => {
    expect(renderWithIntl(<AuthHero />, "en")).toContain("A pattern in your client&#x27;s size.");
  });

  it("marks the open tab as the current page and links both tabs", () => {
    const html = renderWithIntl(<AuthTabs active="signUp" />, "ar");
    expect(html).toContain("دخول");
    expect(html).toContain("حساب جديد");
    expect(html).toContain('href="/sign-in"');
    expect(html).toContain('href="/sign-up"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("says where the mail went without saying whether the address had an account", () => {
    const confirm = renderWithIntl(<CheckEmailNotice email="mona@example.com" kind="confirm" />, "ar");
    expect(confirm).toContain("mona@example.com");
    expect(confirm).toContain("تحقق من البريد الإلكتروني");
    const reset = renderWithIntl(<CheckEmailNotice email="mona@example.com" kind="reset" />, "en");
    expect(reset).toContain("If mona@example.com is registered with us");
    expect(reset).not.toContain("not registered");
  });
});
