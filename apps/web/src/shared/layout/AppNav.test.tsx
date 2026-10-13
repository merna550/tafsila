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

  it("lists settings and marks it on /settings", () => {
    const html = renderWithIntl(<AppNavView pathname="/settings" initial="م" />, "ar");
    expect(html).toContain('href="/settings"');
    expect(html).toContain("الإعدادات");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("does not treat a longer name as the same area", () => {
    expect(isActive("/clientsx", "/clients")).toBe(false);
  });

  it("shows the admin link to admins only and marks it below /admin", () => {
    const user = renderWithIntl(<AppNavView pathname="/clients" initial="م" />, "en");
    expect(user).not.toContain("/admin/users");
    const admin = renderWithIntl(<AppNavView pathname="/admin/sizes" initial="M" isAdmin />, "en");
    expect(admin).toContain('href="/admin/users"');
    expect(admin).toContain(">Admin<");
    expect(admin.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
