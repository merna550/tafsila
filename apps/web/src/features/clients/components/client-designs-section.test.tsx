import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DesignRow } from "@/entities/design";
import { renderWithIntl } from "@/shared/i18n/testing";
import { ClientDesignsSection } from "./ClientDesignsSection";
import { ClientProfileCard } from "./ClientProfileCard";
import { ClientRow } from "./ClientRow";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const DESIGN: DesignRow = {
  id: "d1",
  title: "فستان سهرة",
  category: "dress",
  clientName: "سلمى",
  updated: "أمس",
  versionCount: 1,
  status: "pass",
};

describe("client entry points to new patterns", () => {
  it("gives each clients-page row a New pattern link carrying her id", () => {
    const html = renderWithIntl(
      <ClientRow row={{ id: "c1", name: "سلمى", initial: "س", meta: { kind: "none" } }} />,
    );
    expect(html).toContain('href="/designs/new?clientId=c1"');
    expect(html).toContain('href="/clients/c1"');
  });

  it("gives the profile card a New pattern link carrying her id", () => {
    const html = renderWithIntl(
      <ClientProfileCard
        client={{ id: "c1", name: "سلمى", initial: "س", notes: null, since: "مارس 2026" }}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain('href="/designs/new?clientId=c1"');
  });
});

describe("ClientDesignsSection", () => {
  it("lists her designs and links to the filtered list only when there are more", () => {
    const more = renderWithIntl(<ClientDesignsSection clientId="c1" designs={[DESIGN]} total={7} />);
    expect(more).toContain('href="/designs/d1"');
    expect(more).toContain('href="/designs?clientId=c1"');
    const all = renderWithIntl(<ClientDesignsSection clientId="c1" designs={[DESIGN]} total={1} />);
    expect(all).not.toContain("/designs?clientId=");
  });

  it("offers a New pattern link when she has no design", () => {
    const html = renderWithIntl(<ClientDesignsSection clientId="c1" designs={[]} total={0} />);
    expect(html).toContain("لا توجد تصاميم لهذه العميلة بعد");
    expect(html).toContain('href="/designs/new?clientId=c1"');
  });
});
