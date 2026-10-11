import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import { FormField } from "./form-field";
import { Input } from "./input";
import { Radio, RadioGroup } from "./radio";
import { Select } from "./select";
import { Switch } from "./switch";

describe("FormField", () => {
  it("shows the error under the control and links it with aria-describedby", () => {
    const html = renderToStaticMarkup(
      <FormField label="الاسم" hint="اسم العميلة" error="الاسم مطلوب">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-invalid="true"');
    expect(html.indexOf("<input")).toBeLessThan(html.indexOf("الاسم مطلوب"));
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1] ?? "";
    for (const id of describedBy.split(" ")) expect(html).toContain(`id="${id}"`);
  });

  it("omits hint, error and describedby when none are given", () => {
    const html = renderToStaticMarkup(<FormField label="x">{(control) => <Input {...control} />}</FormField>);
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain('role="alert"');
    expect(html).toContain('aria-invalid="false"');
  });

  it("points the label at the control", () => {
    const html = renderToStaticMarkup(<FormField label="x">{(control) => <Input {...control} />}</FormField>);
    const id = /<input[^>]* id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`for="${id}"`);
  });
});

describe("selection controls", () => {
  it("renders a checkbox with its checked state", () => {
    const html = renderToStaticMarkup(<Checkbox checked aria-label="موافقة" />);
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('data-state="checked"');
  });

  it("renders a radio group with radios", () => {
    const html = renderToStaticMarkup(
      <RadioGroup defaultValue="m" aria-label="المقاس">
        <Radio value="m" aria-label="M" />
        <Radio value="l" aria-label="L" />
      </RadioGroup>,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(2);
  });

  it("renders a switch", () => {
    const html = renderToStaticMarkup(<Switch checked aria-label="تنبيهات" />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });

  it("renders a select trigger with the placeholder", () => {
    const html = renderToStaticMarkup(<Select placeholder="اختاري" options={[{ value: "a", label: "أ" }]} />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain("اختاري");
  });
});
