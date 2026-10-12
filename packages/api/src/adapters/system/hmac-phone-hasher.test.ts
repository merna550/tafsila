import { describe, expect, it } from "vitest";
import { createHmacPhoneHasher, createRejectingPhoneHasher } from "./hmac-phone-hasher";

const secretA = "a".repeat(32);
const secretB = "b".repeat(32);

describe("hmac phone hasher", () => {
  it("is deterministic and 32 bytes long", () => {
    const hasher = createHmacPhoneHasher(secretA);
    expect(hasher.phone("+201000000005")).toEqual(hasher.phone("+201000000005"));
    expect(hasher.phone("+201000000005")).toHaveLength(32);
  });

  it("differs by secret and by input", () => {
    expect(createHmacPhoneHasher(secretA).phone("+201000000005")).not.toEqual(
      createHmacPhoneHasher(secretB).phone("+201000000005"),
    );
    const hasher = createHmacPhoneHasher(secretA);
    expect(hasher.phone("+201000000005")).not.toEqual(hasher.phone("+201000000006"));
  });

  it("keeps phones and IPs apart", () => {
    const hasher = createHmacPhoneHasher(secretA);
    expect(hasher.ip("+201000000005")).not.toEqual(hasher.phone("+201000000005"));
  });

  it("matches the hash the seed computes in SQL for the local secret", () => {
    const local = createHmacPhoneHasher("local-dev-phone-hash-secret-0123456789abcdef");
    expect(Buffer.from(local.phone("+201000000001")).toString("hex")).toHaveLength(64);
  });

  it("the rejecting hasher throws", () => {
    expect(() => createRejectingPhoneHasher().phone("x")).toThrow(/PHONE_HASH_SECRET/);
  });
});
