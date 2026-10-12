import { describe, expect, it } from "vitest";
import { codeSchema, phoneFormSchema } from "./verify-phone.schema";

describe("phoneFormSchema", () => {
  it.each(["010 1234 5678", "+201012345678", "٠١٠١٢٣٤٥٦٧٨", "1012345678"])(
    "turns %s into the E.164 number",
    (input) => {
      expect(phoneFormSchema.parse({ phone: input })).toEqual({ phone: "+201012345678" });
    },
  );

  it("asks for a number when the field is empty", () => {
    const result = phoneFormSchema.safeParse({ phone: "  " });
    expect(result.error?.issues[0]?.message).toBe("phoneRequired");
  });

  it.each(["0221234567", "01312345678", "0101234567", "+966501234567"])("refuses %s", (input) => {
    const result = phoneFormSchema.safeParse({ phone: input });
    expect(result.error?.issues[0]?.message).toBe("phoneInvalid");
  });
});

describe("codeSchema", () => {
  it("accepts exactly six digits", () => {
    expect(codeSchema.safeParse("123456").success).toBe(true);
  });

  it.each(["", "12345", "1234567", "12345a"])("refuses %j", (input) => {
    expect(codeSchema.safeParse(input).error?.issues[0]?.message).toBe("codeIncomplete");
  });
});
