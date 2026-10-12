import { sizeM } from "@tafsila/test-fixtures";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { toKeyValues } from "../model/measurement-summary";
import type { ClientRowView } from "../model/client-view";
import { ClientProfileCard } from "./ClientProfileCard";
import { ClientsList } from "./ClientsList";
import { MeasurementSetsSection } from "./MeasurementSetsSection";

vi.mock("@/shared/i18n", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
}));

const ROWS: ClientRowView[] = [
  { id: "a", name: "سلمى عادل", initial: "س", meta: { kind: "size", size: "M", when: "أمس" } },
  { id: "b", name: "هبة محمود", initial: "ه", meta: { kind: "custom", when: "قبل 3 أيام" } },
  { id: "c", name: "فاطمة يوسف", initial: "ف", meta: { kind: "none" } },
];
const noop = (): void => undefined;

describe("ClientsList", () => {
  it("shows each client with the three meta line forms and a link to her profile", () => {
    const html = renderWithIntl(
      <ClientsList
        rows={ROWS}
        query=""
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={noop}
        onClearSearch={noop}
      />,
    );
    expect(html).toContain("مقاس M · أمس");
    expect(html).toContain("مقاسات مخصّصة · قبل 3 أيام");
    expect(html).toContain("لا توجد مقاسات بعد");
    expect(html).toContain('href="/clients/a"');
    expect(html).not.toContain("عرض المزيد");
  });

  it("offers more only when more pages exist", () => {
    const html = renderWithIntl(
      <ClientsList
        rows={ROWS}
        query=""
        hasMore
        isLoadingMore={false}
        onLoadMore={noop}
        onClearSearch={noop}
      />,
      "en",
    );
    expect(html).toContain("Show more");
  });

  it("shows no results with a clear-search action for a search without matches", () => {
    const html = renderWithIntl(
      <ClientsList
        rows={[]}
        query="زينب"
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={noop}
        onClearSearch={noop}
      />,
    );
    expect(html).toContain("لا توجد نتائج");
    expect(html).toContain("زينب");
    expect(html).toContain("مسح البحث");
  });
});

describe("ClientProfileCard", () => {
  const client = { id: "a", name: "Salma", initial: "S", notes: "Likes loose cuts", since: "March 2026" };

  it("shows name, since date, notes and both actions", () => {
    const html = renderWithIntl(<ClientProfileCard client={client} onEdit={noop} onDelete={noop} />, "en");
    expect(html).toContain("Salma");
    expect(html).toContain("Client since March 2026");
    expect(html).toContain("Likes loose cuts");
    expect(html).toContain("Edit details");
    expect(html).toContain("Delete client");
  });

  it("leaves out the notes block when there are none", () => {
    const html = renderWithIntl(
      <ClientProfileCard client={{ ...client, notes: null }} onEdit={noop} onDelete={noop} />,
      "en",
    );
    expect(html).not.toContain("Notes");
  });
});

describe("MeasurementSetsSection", () => {
  const set = { id: "s1", label: "Summer", sizeLabel: "M", when: "yesterday" };
  const older = { id: "s2", label: "Winter", sizeLabel: null, when: "3 months ago" };

  it("shows an empty state and the new-measurements link with no sets", () => {
    const html = renderWithIntl(<MeasurementSetsSection clientId="c1" sets={[]} latestValues={[]} />, "en");
    expect(html).toContain("No measurements yet");
    expect(html).toContain('href="/clients/c1/measurements/new"');
    expect(html).toContain("(0)");
  });

  it("expands the newest set with six values in cm and lists older sets as links", () => {
    const html = renderWithIntl(
      <MeasurementSetsSection clientId="c1" sets={[set, older]} latestValues={toKeyValues(sizeM)} />,
      "en",
    );
    expect(html).toContain("Latest");
    expect(html).toContain("Based on size M");
    expect(html.match(/ cm</g)).toHaveLength(6);
    expect(html).toContain('href="/clients/c1/measurements/s2"');
    expect(html).toContain("(2)");
  });
});
