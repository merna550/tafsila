import { fabricSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FABRIC_FORM,
  fabricFormSchema,
  fabricToForm,
  formFieldOf,
  toCreateFabricBody,
  toUpdateFabricBody,
} from "./fabric-form";

/** A fabric as the admin API returns it. */
const stored = {
  id: "crepe",
  nameAr: "كريب",
  nameEn: "Crepe",
  properties: { drape: 3, weight: 2, body: 1, stretch: 0, sheen: 1 },
  careNotes: { ar: "غسيل لطيف", en: "Gentle wash" },
  isDraft: true,
  updatedAt: "2026-10-28T10:00:00.000Z",
  updatedBy: null,
};

describe("fabric form", () => {
  it("round-trips a stored fabric and marks a draft as not reviewed", () => {
    const values = fabricToForm(stored);
    expect(values.reviewed).toBe(false);
    expect(fabricSchema.safeParse(toCreateFabricBody(values)).success).toBe(true);
    expect(toCreateFabricBody(values)).toMatchObject({
      id: "crepe",
      isDraft: true,
      properties: stored.properties,
    });
  });

  it("keeps stretch at 0 whatever the form holds and sends no id on update", () => {
    const body = toUpdateFabricBody({ ...fabricToForm(stored), reviewed: true });
    expect(body.properties?.stretch).toBe(0);
    expect(body.isDraft).toBe(false);
    expect(body).not.toHaveProperty("id");
  });

  it("rejects a missing Arabic name and a level outside 0 to 4 with message keys", () => {
    const result = fabricFormSchema.safeParse({ ...fabricToForm(stored), nameAr: " ", drape: 5 });
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toEqual(expect.arrayContaining(["nameArRequired", "levelRange"]));
  });

  it("rejects an id that is not a slug and an empty new form", () => {
    expect(fabricFormSchema.safeParse({ ...fabricToForm(stored), id: "Crepe Silk" }).success).toBe(false);
    expect(fabricFormSchema.safeParse(EMPTY_FABRIC_FORM).success).toBe(false);
  });

  it("maps API field names to form fields", () => {
    expect(formFieldOf("careNotes.ar")).toBe("careAr");
    expect(formFieldOf("properties.sheen")).toBe("sheen");
    expect(formFieldOf("properties.stretch")).toBeUndefined();
  });
});
