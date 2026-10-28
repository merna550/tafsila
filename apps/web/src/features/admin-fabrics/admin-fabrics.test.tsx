import { DRAFT_CATALOGUE, DRAFT_RULES } from "@tafsila/fabric-kb";
import type { AdminFabric, AdminFabricRule } from "@tafsila/schemas";
import type { AnchorHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { clientApiError } from "@/shared/api";
import { renderWithIntl } from "@/shared/i18n/testing";
import { AdminFabricEditScreen } from "./AdminFabricEditScreen";
import { AdminFabricRulesScreen } from "./AdminFabricRulesScreen";
import { AdminFabricsScreen } from "./AdminFabricsScreen";
import { useAdminFabricRules, useAdminFabrics } from "./hooks/use-admin-fabrics";
import { useFabricForm } from "./hooks/use-fabric-form";
import { EMPTY_FABRIC_FORM, fabricFormSchema, type FabricFormValues } from "./model/fabric-form";
import { zodResolver } from "@hookform/resolvers/zod";

vi.mock("./hooks/use-admin-fabrics", () => ({ useAdminFabrics: vi.fn(), useAdminFabricRules: vi.fn() }));
vi.mock("./hooks/use-catalogue-mutations", () => ({ useDeleteFabric: vi.fn(), useDeleteRule: vi.fn() }));
vi.mock("./hooks/use-delete-action", () => ({
  useDeleteAction: () => ({ confirm: vi.fn(), pending: false }),
}));
vi.mock("./hooks/use-fabric-form", () => ({ useFabricForm: vi.fn() }));
vi.mock("./hooks/use-rule-form", () => ({ useRuleForm: vi.fn() }));
vi.mock("@/shared/i18n", () => ({
  DIRECTION: { ar: "rtl", en: "ltr" },
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest} />,
  useRouter: () => ({ push: vi.fn() }),
}));

/** The catalogue as the admin API returns it: two drafts and one reviewed fabric. */
const FABRICS: AdminFabric[] = DRAFT_CATALOGUE.slice(0, 3).map((f, i) => ({
  ...f,
  isDraft: i < 2,
  updatedAt: "2026-10-28T10:00:00.000Z",
  updatedBy: null,
}));

/** The rules as the admin API returns them. */
const RULES: AdminFabricRule[] = DRAFT_RULES.slice(0, 3).map((r) => ({
  ...r,
  isDraft: true,
  updatedAt: "2026-10-28T10:00:00.000Z",
  updatedBy: null,
}));

/**
 * Makes a list hook answer with a query-like state.
 *
 * @param hook - The mocked hook.
 * @param state - The pieces of the query the screen reads.
 */
function answer(hook: typeof useAdminFabrics | typeof useAdminFabricRules, state: object): void {
  vi.mocked(hook as typeof useAdminFabrics).mockReturnValue({
    refetch: vi.fn(),
    error: null,
    data: undefined,
    isPending: false,
    ...state,
  } as unknown as ReturnType<typeof useAdminFabrics>);
}

/**
 * Makes the fabric form hook return a real form with the given values.
 *
 * @param values - The starting values.
 */
function answerForm(values: FabricFormValues): void {
  vi.mocked(useFabricForm).mockImplementation(() => {
    const form = useForm<FabricFormValues>({
      resolver: zodResolver(fabricFormSchema),
      defaultValues: values,
    });
    return { form, onSubmit: vi.fn(), pending: false };
  });
}

describe("AdminFabricsScreen", () => {
  it("lists the fabrics with names, status and the draft note", () => {
    answer(useAdminFabrics, { data: FABRICS });
    const html = renderWithIntl(<AdminFabricsScreen />, "en");
    expect(html).toContain(FABRICS[0]?.nameEn);
    expect(html).toContain("Draft");
    expect(html).toContain("Reviewed");
    expect(html).toContain("/admin/fabrics/new");
    expect(html).toContain("Every change is saved in the audit log");
    expect(html).toContain('aria-current="page"');
  });

  it("shows the Arabic name first in Arabic", () => {
    answer(useAdminFabrics, { data: FABRICS });
    const html = renderWithIntl(<AdminFabricsScreen />, "ar");
    expect(html).toContain(FABRICS[0]?.nameAr);
    expect(html).toContain("مسودة");
  });

  it("shows the empty and the error states", () => {
    answer(useAdminFabrics, { data: [] });
    expect(renderWithIntl(<AdminFabricsScreen />, "en")).toContain("No fabrics yet");
    answer(useAdminFabrics, { error: clientApiError("network") });
    expect(renderWithIntl(<AdminFabricsScreen />, "en")).toContain("Try again");
  });
});

describe("AdminFabricRulesScreen", () => {
  it("lists the rules in words, most decisive first, with the add button", () => {
    answer(useAdminFabricRules, { data: RULES });
    answer(useAdminFabrics, { data: FABRICS });
    const html = renderWithIntl(<AdminFabricRulesScreen />, "en");
    expect(html).toContain("New rule");
    expect(html).toContain("is one of");
    expect(html).toContain(RULES[0]?.reason.en);
    expect(html).toMatch(/Required|Preferred/);
  });

  it("shows the empty state", () => {
    answer(useAdminFabricRules, { data: [] });
    answer(useAdminFabrics, { data: FABRICS });
    expect(renderWithIntl(<AdminFabricRulesScreen />, "ar")).toContain("لا توجد قواعد بعد");
  });
});

describe("AdminFabricEditScreen", () => {
  it("shows the empty form for a new fabric with five-step pickers and stretch explained", () => {
    answer(useAdminFabrics, { data: FABRICS });
    answerForm(EMPTY_FABRIC_FORM);
    const html = renderWithIntl(<AdminFabricEditScreen />, "en");
    expect(html).toContain("New fabric");
    expect(html).toContain("Stretch is fixed");
    expect(html.match(/role="radio"/g)).toHaveLength(20);
    expect(html).toContain('aria-checked="true"');
    expect(html).not.toContain("readOnly");
  });

  it("fixes the id when editing and shows the status", () => {
    answer(useAdminFabrics, { data: FABRICS });
    answerForm({ ...EMPTY_FABRIC_FORM, id: FABRICS[0]?.id ?? "" });
    const html = renderWithIntl(<AdminFabricEditScreen id={FABRICS[0]?.id} />, "en");
    expect(html).toContain("Edit fabric");
    expect(html).toContain("Status: Draft");
    expect(html).toContain("readOnly");
  });

  it("says the fabric is missing for an unknown id", () => {
    answer(useAdminFabrics, { data: FABRICS });
    answerForm(EMPTY_FABRIC_FORM);
    expect(renderWithIntl(<AdminFabricEditScreen id="nope" />, "en")).toContain("Fabric not found");
  });
});
