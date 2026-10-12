// Tests for removing the custom auth email templates before the staging config push (issue #107).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stripEmailTemplates } from "./strip-email-templates.mjs";

const before = `[auth.email]
enable_signup = true

[auth.email.template.confirmation]
subject = "تأكيد"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "استعادة"
content_path = "./supabase/templates/recovery.html"

# Uncomment to customize notification email template
# [auth.email.notification.password_changed]

[auth.sms]
enable_signup = true
`;

describe("stripEmailTemplates", () => {
  it("removes every template table and keeps the rest byte-identical", () => {
    expect(stripEmailTemplates(before)).toBe(`[auth.email]
enable_signup = true

[auth.sms]
enable_signup = true
`);
  });

  it("leaves a config without templates unchanged", () => {
    const toml = "[api]\nport = 54321\n\n[auth.sms]\nenable_signup = true\n";
    expect(stripEmailTemplates(toml)).toBe(toml);
  });

  it("removes the templates from the real config and nothing outside them", () => {
    const real = readFileSync(new URL("../supabase/config.toml", import.meta.url), "utf8");
    const stripped = stripEmailTemplates(real);
    expect(stripped).not.toContain("[auth.email.template.");
    expect(stripped).toMatch(/^\[auth\.sms\]$/m);
    expect(stripped).toMatch(/^\[auth\.sms\.test_otp\]$/m);
    expect(stripped).toMatch(/^\[api\]$/m);
  });
});
