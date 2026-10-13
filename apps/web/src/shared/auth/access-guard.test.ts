import { describe, expect, it } from "vitest";
import { decideAccess } from "./access-guard";

describe("decideAccess", () => {
  it("sends a signed-out visitor from /dashboard to sign-in with next", () => {
    expect(decideAccess("/dashboard", "", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fdashboard",
    });
  });

  it("guards the verify-phone screen like the dashboard", () => {
    expect(decideAccess("/verify", "?next=%2Fdashboard", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fverify%3Fnext%3D%252Fdashboard",
    });
    expect(decideAccess("/en/verify", "", true)).toEqual({ action: "allow" });
    expect(decideAccess("/verifying", "", false)).toEqual({ action: "allow" });
  });

  it("keeps the English prefix and the query string", () => {
    expect(decideAccess("/en/dashboard/designs", "?tab=1", false)).toEqual({
      action: "redirect",
      to: "/en/sign-in?next=%2Fen%2Fdashboard%2Fdesigns%3Ftab%3D1",
    });
  });

  it("guards /clients and the pages below it, in both languages", () => {
    expect(decideAccess("/clients", "", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fclients",
    });
    expect(decideAccess("/en/clients/abc", "", false)).toEqual({
      action: "redirect",
      to: "/en/sign-in?next=%2Fen%2Fclients%2Fabc",
    });
    expect(decideAccess("/clients", "", true)).toEqual({ action: "allow" });
  });

  it("guards /settings in both languages", () => {
    expect(decideAccess("/settings", "", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fsettings",
    });
    expect(decideAccess("/en/settings", "", false)).toEqual({
      action: "redirect",
      to: "/en/sign-in?next=%2Fen%2Fsettings",
    });
    expect(decideAccess("/settings", "", true)).toEqual({ action: "allow" });
  });

  it("allows a signed-in user on /dashboard", () => {
    expect(decideAccess("/dashboard", "", true)).toEqual({ action: "allow" });
  });

  it("sends a signed-in user away from sign-in and sign-up", () => {
    expect(decideAccess("/sign-in", "", true)).toEqual({ action: "redirect", to: "/dashboard" });
    expect(decideAccess("/en/sign-up", "", true)).toEqual({ action: "redirect", to: "/en/dashboard" });
  });

  it("allows public pages for everyone, and does not treat look-alike paths as protected", () => {
    expect(decideAccess("/", "", false)).toEqual({ action: "allow" });
    expect(decideAccess("/sign-in", "", false)).toEqual({ action: "allow" });
    expect(decideAccess("/dashboards", "", false)).toEqual({ action: "allow" });
    expect(decideAccess("/entry/dashboard", "", false)).toEqual({ action: "allow" });
  });

  it("guards /admin and the pages below it, in both languages", () => {
    expect(decideAccess("/admin/users", "", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fadmin%2Fusers",
    });
    expect(decideAccess("/en/admin/sizes", "", false)).toEqual({
      action: "redirect",
      to: "/en/sign-in?next=%2Fen%2Fadmin%2Fsizes",
    });
    expect(decideAccess("/admin/users", "", true)).toEqual({ action: "allow" });
    expect(decideAccess("/administrator", "", false)).toEqual({ action: "allow" });
  });
});
