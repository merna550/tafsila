import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { AppNavView, isActive } from "./AppNav";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
  usePathname: () => "/clients",
}));

describe("AppNav", () => {
  it("marks the clients link as the current page on /clients and below it", () => {
    for (const pathname of ["/clients", "/clients/abc"]) {
      const html = renderWithIntl(<AppNavView pathname={pathname} initial="م" />, "ar");
      expect(html).toContain('aria-current="page"');
      expect(html).toContain("العميلات");
    }
  });

  it("marks nothing elsewhere and shows the initial with an account label", () => {
    const html = renderWithIntl(<AppNavView pathname="/dashboard" initial="M" />, "en");
    expect(html).not.toContain("aria-current");
    expect(html).toContain('aria-label="My account"');
    expect(html).toContain(">M<");
  });

  it("does not treat a longer name as the same area", () => {
    expect(isActive("/clientsx", "/clients")).toBe(false);
  });
});
