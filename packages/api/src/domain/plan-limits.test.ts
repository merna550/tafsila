import { describe, expect, it } from "vitest";
import { canAddClient, defaultPlanLimits } from "./plan-limits";

describe("plan limits", () => {
  it("defaults to 10 clients and 10 chat messages", () => {
    expect(defaultPlanLimits(10)).toEqual({ maxClients: 10, chatPerDesign: 10 });
  });

  it("refuses the 11th client without a plan and allows 500 on Pro", () => {
    expect(canAddClient(defaultPlanLimits(10), 9)).toBe(true);
    expect(canAddClient(defaultPlanLimits(10), 10)).toBe(false);
    expect(canAddClient(defaultPlanLimits(10), 12)).toBe(false);
    expect(canAddClient({ maxClients: null, chatPerDesign: 20 }, 500)).toBe(true);
  });
});
