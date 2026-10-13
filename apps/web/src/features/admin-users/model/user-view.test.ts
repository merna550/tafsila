import type { AdminUser } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { displayName, toAdminUserDetail, toAdminUserRow } from "./user-view";

const NOW = new Date("2026-10-12T12:00:00.000Z");
const USER: AdminUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "منى إبراهيم",
  email: "mona@example.com",
  phone: "+201012345678",
  phoneVerifiedAt: "2026-10-03T10:00:00.000Z",
  createdAt: "2026-10-03T10:00:00.000Z",
  lastSignInAt: "2026-10-11T12:00:00.000Z",
  clientCount: 5,
};

describe("toAdminUserRow", () => {
  it("maps a verified user with relative last sign-in", () => {
    const row = toAdminUserRow(USER, NOW, "en");
    expect(row).toMatchObject({ phoneVerified: true, clientCount: 5, joined: "October 3" });
    expect(row.lastSignIn).toBe("yesterday");
  });

  it("marks a user without a verified phone and without a sign-in", () => {
    const row = toAdminUserRow(
      { ...USER, phoneVerifiedAt: null, lastSignInAt: null, phone: null },
      NOW,
      "ar",
    );
    expect(row.phoneVerified).toBe(false);
    expect(row.lastSignIn).toBeNull();
    expect(row.phone).toBeNull();
  });
});

describe("toAdminUserDetail", () => {
  it("adds the counts and settings", () => {
    const detail = toAdminUserDetail(
      { ...USER, measurementSetCount: 7, locale: "ar", role: "admin" },
      NOW,
      "en",
    );
    expect(detail).toMatchObject({ measurementSetCount: 7, locale: "ar", role: "admin", clientCount: 5 });
  });
});

describe("displayName", () => {
  it("falls back from name to e-mail to phone", () => {
    expect(displayName({ name: " منى ", email: "a@b.c", phone: "1" })).toBe("منى");
    expect(displayName({ name: null, email: "a@b.c", phone: "1" })).toBe("a@b.c");
    expect(displayName({ name: "  ", email: null, phone: "1" })).toBe("1");
    expect(displayName({ name: null, email: null, phone: null })).toBe("");
  });
});
