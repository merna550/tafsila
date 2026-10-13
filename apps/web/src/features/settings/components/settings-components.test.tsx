import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { DisplayCard } from "./DisplayCard";
import { LanguageToggle } from "./LanguageToggle";
import { PhoneRow } from "./PhoneRow";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const noop = (): void => undefined;

describe("PhoneRow", () => {
  it("shows the number left-to-right with the verified tick", () => {
    const html = renderWithIntl(
      <PhoneRow status={{ verified: true, phone: "+201012345678", trialEligible: false }} />,
    );
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("+20 10 1234 5678");
    expect(html).toContain("مؤكَّد");
    expect(html).not.toContain('href="/verify"');
  });

  it("links to verification when the number is not verified", () => {
    const html = renderWithIntl(
      <PhoneRow status={{ verified: false, phone: null, trialEligible: true }} />,
      "en",
    );
    expect(html).toContain("Not verified");
    expect(html).toContain('href="/verify"');
  });
});

describe("LanguageToggle", () => {
  it("marks only the current language as pressed", () => {
    const html = renderWithIntl(<LanguageToggle current="en" onSelect={noop} />);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>English/);
  });
});

describe("DisplayCard", () => {
  it("shows centimeters as text with the inches note", () => {
    const html = renderWithIntl(<DisplayCard current="ar" onSelect={noop} />);
    expect(html).toContain("سنتيمتر");
    expect(html).toContain("وحدة الإنش قريباً.");
  });
});

describe("DeleteAccountCard", () => {
  it("offers the outlined danger button", () => {
    const html = renderWithIntl(<DeleteAccountCard onOpen={noop} />);
    expect(html).toContain("حذف حسابي");
    expect(html).toContain("border-danger");
  });
});
