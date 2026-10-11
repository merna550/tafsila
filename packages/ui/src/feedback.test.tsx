import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { PageHeader } from "./page-header";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { Tooltip } from "./tooltip";

describe("Card", () => {
  it("shows title, content and footer", () => {
    const html = renderToStaticMarkup(
      <Card title="تفاصيل" footer={<span>تذييل</span>}>
        المحتوى
      </Card>,
    );
    expect(html).toContain("<h3");
    expect(html).toContain("المحتوى");
    expect(html).toContain("تذييل");
    expect(html).toContain("border-border");
  });

  it("omits title and footer when not given", () => {
    const html = renderToStaticMarkup(<Card>x</Card>);
    expect(html).not.toContain("<h3");
  });
});

describe("Badge", () => {
  it("uses the token class of its tone", () => {
    expect(renderToStaticMarkup(<Badge tone="danger">x</Badge>)).toContain("text-danger");
    expect(renderToStaticMarkup(<Badge>x</Badge>)).toContain("text-muted");
  });
});

describe("Avatar", () => {
  it("renders a round root (initials appear after mount, images after load)", () => {
    const html = renderToStaticMarkup(<Avatar alt="منى" initials="من" />);
    expect(html).toContain("rounded-full");
    expect(html).toContain("size-11");
  });
});

describe("Skeleton and Spinner", () => {
  it("hides skeletons from screen readers and renders table rows", () => {
    const html = renderToStaticMarkup(<Skeleton variant="table" rows={3} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/h-11/g)).toHaveLength(3);
  });

  it("announces the spinner with its label", () => {
    const html = renderToStaticMarkup(<Spinner label="جارٍ التحميل" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="جارٍ التحميل"');
  });
});

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="فارغ" description="ابدئي" action={<Button>إضافة</Button>} />,
    );
    expect(html).toContain("فارغ");
    expect(html).toContain("ابدئي");
    expect(html).toContain("إضافة");
  });
});

describe("ErrorState", () => {
  it("is an alert with a retry button when a handler is given", () => {
    const html = renderToStaticMarkup(
      <ErrorState title="تعذر" onRetry={vi.fn()} retryLabel="حاولي مرة أخرى" requestId="req-1" />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("حاولي مرة أخرى");
    expect(html).toContain("req-1");
  });

  it("hides the retry button without a handler", () => {
    expect(renderToStaticMarkup(<ErrorState title="تعذر" />)).not.toContain("<button");
  });
});

describe("PageHeader", () => {
  it("renders the title as h1 with actions", () => {
    const html = renderToStaticMarkup(<PageHeader title="العملاء" actions={<Button>جديد</Button>} />);
    expect(html).toContain("<h1");
    expect(html).toContain("جديد");
  });
});

describe("Tooltip", () => {
  it("renders its trigger", () => {
    const html = renderToStaticMarkup(
      <Tooltip content="تلميح">
        <Button>زر</Button>
      </Tooltip>,
    );
    expect(html).toContain("زر");
  });
});
