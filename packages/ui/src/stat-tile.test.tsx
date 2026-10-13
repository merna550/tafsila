import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SegmentedControl } from "./segmented-control";
import { StatTile } from "./stat-tile";

describe("StatTile", () => {
  it("renders the label and the value as a term and its description", () => {
    const html = renderToStaticMarkup(
      <dl>
        <StatTile label="Users" value={42} />
      </dl>,
    );
    expect(html).toContain("<dt");
    expect(html).toContain(">Users<");
    expect(html).toContain("<dd");
    expect(html).toContain(">42<");
  });

  it("passes native props such as data attributes through", () => {
    const html = renderToStaticMarkup(
      <dl>
        <StatTile label="a" value="b" data-testid="tile" />
      </dl>,
    );
    expect(html).toContain('data-testid="tile"');
  });
});

describe("SegmentedControl", () => {
  const options = [
    { value: "all", label: "All" },
    { value: "yes", label: "Verified" },
  ] as const;

  it("is a labelled group with one pressed button", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl label="Filter" value="yes" onChange={() => undefined} options={options} />,
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Filter"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Verified/);
  });

  it("makes every button a 44px target of type button", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl label="Filter" value="all" onChange={() => undefined} options={options} />,
    );
    expect(html.match(/type="button"/g)).toHaveLength(2);
    expect(html).toContain("min-h-11");
  });
});
