import { describe, expect, it, vi } from "vitest";
import { ApiError, clientApiError } from "../api";
import { DataState } from "../data-state";
import { renderWithIntl, renderWithIntl as renderToStaticMarkup } from "../i18n/testing";
import { ApiErrorView } from "./ApiErrorView";
import { AppErrorBoundary, ErrorBoundaryFallback } from "./AppErrorBoundary";
import { ConnectionBannerView } from "./ConnectionBanner";
import { routeError, signInUrl } from "./route-error";

/**
 * Builds a server-style ApiError for a test.
 *
 * @param status - HTTP status.
 * @param kind - Reaction group.
 * @param extra - Optional field errors and request id.
 * @returns The error.
 */
function apiError(
  status: number,
  kind: ApiError["kind"],
  extra: { fieldErrors?: Record<string, string>; requestId?: string } = {},
): ApiError {
  return new ApiError({ code: "X", kind, status, messageAr: "رسالة عربية", messageEn: "english", ...extra });
}

describe("routeError: every ApiError lands in its fixed place", () => {
  it("validation with fields goes under the field", () => {
    const route = routeError(apiError(400, "validation", { fieldErrors: { phone: "غلط" } }), "action");
    expect(route.place).toBe("field");
    expect(route.fieldErrors).toEqual({ phone: "غلط" });
  });

  it("a failed action is a toast", () => {
    expect(routeError(apiError(404, "not-found"), "action").place).toBe("toast");
  });

  it("failed page data is an ErrorState", () => {
    expect(routeError(apiError(500, "server"), "load").place).toBe("page-error-state");
  });

  it("401 redirects to sign-in", () => {
    expect(routeError(apiError(401, "unauthenticated"), "load").place).toBe("redirect-sign-in");
  });

  it("403 shows the no-permission message", () => {
    expect(routeError(apiError(403, "forbidden"), "action").place).toBe("no-permission");
  });

  it("network failure uses the connection banner", () => {
    expect(routeError(clientApiError("network"), "load").place).toBe("connection-banner");
  });

  it("unknown server errors carry a copyable request id and are reported", () => {
    const route = routeError(apiError(500, "server", { requestId: "req-1" }), "load");
    expect(route.requestId).toBe("req-1");
    expect(route.unexpected).toBe(true);
  });

  it("hides technical text of non-ApiError values", () => {
    const route = routeError(new TypeError("x is undefined"), "action");
    expect(route.message).not.toContain("TypeError");
    expect(route.message).toContain("حدث خطأ");
    expect(route.unexpected).toBe(true);
  });

  it("expected errors are not reported", () => {
    expect(routeError(apiError(403, "forbidden"), "action").unexpected).toBe(false);
  });
});

describe("signInUrl", () => {
  it("returns to the same page", () => {
    expect(signInUrl("/clients?page=2")).toBe("/sign-in?next=%2Fclients%3Fpage%3D2");
  });

  it("refuses other sites", () => {
    expect(signInUrl("//evil.com")).toBe("/sign-in?next=%2F");
    expect(signInUrl("https://evil.com")).toBe("/sign-in?next=%2F");
  });
});

describe("ApiErrorView", () => {
  it("shows the message, the request id with a copy button and Try again", () => {
    const route = routeError(apiError(500, "server", { requestId: "req-42" }), "load");
    const html = renderToStaticMarkup(<ApiErrorView route={route} onRetry={() => undefined} />);
    expect(html).toContain("رسالة عربية");
    expect(html).toContain("req-42");
    expect(html).toContain("نسخ رقم المرجع");
    expect(html).toContain("إعادة المحاولة");
    expect(html).not.toContain("500");
  });

  it("uses the no-permission title and no retry for 403", () => {
    const route = routeError(apiError(403, "forbidden"), "load");
    const html = renderToStaticMarkup(<ApiErrorView route={route} onRetry={() => undefined} />);
    expect(html).toContain("ليس لديك صلاحية");
    expect(html).not.toContain("إعادة المحاولة");
  });
});

describe("error display in English", () => {
  it("reads its texts from messages/en.json", () => {
    const route = routeError(apiError(500, "server", { requestId: "req-7" }), "load", "en");
    const html = renderWithIntl(<ApiErrorView route={route} onRetry={() => undefined} />, "en");
    expect(html).toContain("english");
    expect(html).toContain("Copy reference");
    expect(html).toContain("Try again");
    expect(renderWithIntl(<ConnectionBannerView offline />, "en")).toContain("No internet connection");
  });
});

describe("ConnectionBannerView", () => {
  it("shows the offline message", () => {
    expect(renderToStaticMarkup(<ConnectionBannerView offline />)).toContain("لا يوجد اتصال");
  });

  it("renders nothing while online", () => {
    expect(renderToStaticMarkup(<ConnectionBannerView offline={false} />)).toBe("");
  });
});

describe("AppErrorBoundary", () => {
  it("switches to the fallback state", () => {
    expect(AppErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
  });

  it("renders ErrorState without technical text", () => {
    const html = renderToStaticMarkup(<ErrorBoundaryFallback />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("حدثت مشكلة غير متوقعة");
  });

  it("reports to monitoring with the request id", () => {
    const report = vi.fn();
    const boundary = new AppErrorBoundary({ children: null, report });
    const error = apiError(500, "server", { requestId: "req-9" });
    boundary.componentDidCatch(error);
    expect(report).toHaveBeenCalledWith(error, "req-9");
  });

  it("reports without a request id for plain errors", () => {
    const report = vi.fn();
    const error = new Error("boom");
    new AppErrorBoundary({ children: null, report }).componentDidCatch(error);
    expect(report).toHaveBeenCalledWith(error, undefined);
  });
});

describe("DataState (three states)", () => {
  const content = <p>data</p>;

  it("shows a skeleton while loading", () => {
    const html = renderToStaticMarkup(
      <DataState isPending isEmpty={false}>
        {content}
      </DataState>,
    );
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("data");
  });

  it("shows an empty state", () => {
    const html = renderToStaticMarkup(
      <DataState isPending={false} isEmpty>
        {content}
      </DataState>,
    );
    expect(html).toContain("لا يوجد شيء هنا بعد");
  });

  it("shows an error state with Try again", () => {
    const html = renderToStaticMarkup(
      <DataState isPending={false} isEmpty={false} error={apiError(500, "server")} onRetry={() => undefined}>
        {content}
      </DataState>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("إعادة المحاولة");
  });

  it("shows the content when loaded", () => {
    expect(
      renderToStaticMarkup(
        <DataState isPending={false} isEmpty={false}>
          {content}
        </DataState>,
      ),
    ).toBe("<p>data</p>");
  });
});
