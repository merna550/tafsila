import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { CodeStep } from "./CodeStep";
import { PhoneNumberField } from "./PhoneNumberField";
import { StepHeader } from "./StepHeader";

// next-intl's navigation helpers need the Next runtime; a plain anchor is enough to test the markup.
vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const noop = (): void => undefined;
const baseProps = {
  phone: "+201012345678",
  code: "481",
  onCodeChange: noop,
  error: null,
  resendSeconds: 42,
  pending: false,
  onConfirm: noop,
  onResend: noop,
  onChangeNumber: noop,
};

describe("CodeStep", () => {
  it("says where the code went, in the page language, with the number kept left-to-right", () => {
    const ar = renderWithIntl(<CodeStep {...baseProps} />, "ar");
    expect(ar).toContain("أرسلنا الرمز إلى ⁦010 1234 5678⁩");
    const en = renderWithIntl(<CodeStep {...baseProps} />, "en");
    expect(en).toContain("We sent the code to");
  });

  it("shows six labelled boxes and the countdown while the resend is not allowed", () => {
    const html = renderWithIntl(<CodeStep {...baseProps} />, "ar");
    expect(html.match(/<input/g)).toHaveLength(6);
    expect(html).toContain('aria-label="الرقم 1"');
    expect(html).toContain("إعادة الإرسال بعد");
    expect(html).toContain("0:42");
  });

  it("offers the resend button once the countdown ended, and keeps confirm disabled until six digits", () => {
    const html = renderWithIntl(<CodeStep {...baseProps} resendSeconds={0} />, "en");
    expect(html).toContain("Resend code");
    expect(html).not.toContain("Resend in");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Verify</);
  });

  it("puts the error under the code boxes", () => {
    const html = renderWithIntl(
      <CodeStep {...baseProps} error="رمز التأكيد غير صحيح أو انتهت صلاحيته" />,
      "ar",
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("رمز التأكيد غير صحيح");
  });
});

describe("PhoneNumberField", () => {
  it("keeps the +20 box and the input left-to-right and shows an error", () => {
    const html = renderWithIntl(<PhoneNumberField error="غير صحيح" inputProps={{ name: "phone" }} />, "ar");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("+20");
    expect(html).toContain('type="tel"');
    expect(html).toContain('autoComplete="tel-national"');
    expect(html).toContain("غير صحيح");
  });
});

describe("StepHeader", () => {
  it("links back to next and says step 2 of 2", () => {
    const html = renderWithIntl(<StepHeader backHref="/dashboard" onBack={noop} />, "ar");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("العودة");
    expect(html).toContain("الخطوة 2 من 2");
  });
});
