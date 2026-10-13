import { saveMeasurementSetInputSchema } from "@tafsila/schemas";
import { sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FIELD_TEXTS,
  labelSchema,
  parseFields,
  toFieldTexts,
  toSaveBody,
} from "./measurement-form.schema";

describe("labelSchema", () => {
  it("requires a label and limits its length", () => {
    expect(labelSchema.safeParse("  ").error?.issues[0]?.message).toBe("labelRequired");
    expect(labelSchema.safeParse("x".repeat(121)).error?.issues[0]?.message).toBe("labelTooLong");
    expect(labelSchema.parse(" صيف 2026 ")).toBe("صيف 2026");
  });
});

describe("parseFields", () => {
  it("round-trips a complete set through the texts", () => {
    expect(parseFields(toFieldTexts(sizeM)).measurements).toEqual(sizeM);
  });

  it("reports every empty required box and accepts an empty underBust", () => {
    const { errors, measurements } = parseFields(EMPTY_FIELD_TEXTS);
    expect(measurements).toBeUndefined();
    expect(errors.bust).toBe("required");
    expect(errors.underBust).toBeUndefined();
  });

  it("reports unreadable boxes and keeps the readable values", () => {
    const texts = { ...toFieldTexts(sizeM), waist: "abc", hip: "100.55", underBust: "" };
    const { errors, partial, measurements } = parseFields(texts);
    expect(errors).toEqual({ waist: "notANumber", hip: "tooManyDecimals" });
    expect(partial.bust).toBe(sizeM.bust);
    expect(measurements).toBeUndefined();
  });
});

describe("toSaveBody", () => {
  it("builds a body the API accepts, with the size label only for a size", () => {
    const measurements = parseFields(toFieldTexts(sizeM)).measurements!;
    const client = "00000000-0000-4000-8000-0000000000a1";
    const fromSize = toSaveBody(
      { label: " Summer ", sizeLabel: "M", fields: EMPTY_FIELD_TEXTS },
      measurements,
      client,
    );
    expect(saveMeasurementSetInputSchema.parse(fromSize)).toMatchObject({
      label: "Summer",
      sizeLabel: "M",
      clientId: client,
    });
    const custom = toSaveBody({ label: "x", sizeLabel: "", fields: EMPTY_FIELD_TEXTS }, measurements);
    expect(custom).not.toHaveProperty("sizeLabel");
    expect(custom).not.toHaveProperty("clientId");
  });
});
