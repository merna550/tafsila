import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell } from "./app-shell";
import { Dialog } from "./dialog";
import { SHEET_SIDE_CLASSES, Sheet } from "./sheet";
import { Table } from "./table";
import { Tabs } from "./tabs";
import { ToastProvider, useToast } from "./toast";

describe("Dialog", () => {
  it("renders its trigger with dialog semantics and keeps the panel closed", () => {
    const html = renderToStaticMarkup(
      <Dialog trigger={<button>فتح</button>} title="حذف" closeLabel="إغلاق" />,
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="dialog"');
  });
});

describe("Sheet", () => {
  it("uses logical edges only", () => {
    for (const classes of Object.values(SHEET_SIDE_CLASSES)) {
      expect(classes).not.toMatch(/\b(left|right|ml|mr)-/);
    }
    expect(SHEET_SIDE_CLASSES.start).toContain("start-0");
    expect(SHEET_SIDE_CLASSES.end).toContain("end-0");
  });

  it("renders its trigger closed", () => {
    const html = renderToStaticMarkup(<Sheet trigger={<button>قائمة</button>} title="t" closeLabel="c" />);
    expect(html).toContain('aria-expanded="false"');
  });
});

describe("Tabs", () => {
  it("renders a named tab list and shows the first panel", () => {
    const html = renderToStaticMarkup(
      <Tabs
        label="الأقسام"
        items={[
          { value: "a", label: "الأول", content: "محتوى أول" },
          { value: "b", label: "الثاني", content: "محتوى ثان" },
        ]}
      />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="الأقسام"');
    expect(html).toContain("محتوى أول");
    expect(html).not.toContain("محتوى ثان");
  });
});

describe("Table", () => {
  const rows = [
    { id: "1", name: "منى", amount: 10 },
    { id: "2", name: "سلمى", amount: 20 },
  ];
  const columns = [
    { id: "name", header: "الاسم", cell: (r: (typeof rows)[number]) => r.name },
    { id: "amount", header: "المبلغ", numeric: true, cell: (r: (typeof rows)[number]) => r.amount },
  ];

  it("renders a caption, headers and one row per item with numbers aligned to the end", () => {
    const html = renderToStaticMarkup(
      <Table caption="العملاء" columns={columns} rows={rows} getRowKey={(r) => r.id} />,
    );
    expect(html).toContain("<caption");
    expect(html.match(/scope="col"/g)).toHaveLength(2);
    expect(html.match(/<tr/g)).toHaveLength(3);
    expect(html).toContain("text-end");
  });
});

describe("AppShell", () => {
  it("renders the banner slot above the header, and the navigation and content", () => {
    const html = renderToStaticMarkup(
      <AppShell banner={<p>بدون اتصال</p>} header="تفصيلة" navigation="روابط" navigationLabel="التنقل">
        المحتوى
      </AppShell>,
    );
    expect(html.indexOf("بدون اتصال")).toBeLessThan(html.indexOf("<header"));
    expect(html).toContain('aria-label="التنقل"');
    expect(html).toContain("<main");
    expect(html).toContain("المحتوى");
  });

  it("omits the banner slot and navigation when not given", () => {
    const html = renderToStaticMarkup(<AppShell header="h">c</AppShell>);
    expect(html).not.toContain("data-slot");
    expect(html).not.toContain("<nav");
  });
});

describe("Toast", () => {
  it("renders the notifications region and children", () => {
    const html = renderToStaticMarkup(
      <ToastProvider closeLabel="إغلاق" regionLabel="إشعارات">
        <p>التطبيق</p>
      </ToastProvider>,
    );
    expect(html).toContain("التطبيق");
  });

  it("throws a clear error when used without a provider", () => {
    function Probe(): null {
      useToast();
      return null;
    }
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(/ToastProvider/);
  });
});
