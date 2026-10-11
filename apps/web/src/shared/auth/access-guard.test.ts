import { describe, expect, it } from "vitest";
import { decideAccess } from "./access-guard";

describe("decideAccess", () => {
  it("sends a signed-out visitor from /dashboard to sign-in with next", () => {
    expect(decideAccess("/dashboard", "", false)).toEqual({
      action: "redirect",
      to: "/sign-in?next=%2Fdashboard",
    });
  });

  it("keeps the English prefix and the query string", () => {
    expect(decideAccess("/en/dashboard/designs", "?tab=1", false)).toEqual({
      action: "redirect",
      to: "/en/sign-in?next=%2Fen%2Fdashboard%2Fdesigns%3Ftab%3D1",
    });
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
});
