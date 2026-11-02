import { describe, expect, it } from "vitest";
import { photoReducer } from "./photo-slots";

describe("photoReducer", () => {
  it("adds photos up to three", () => {
    let items = photoReducer([], { type: "add", id: "a" });
    for (const id of ["b", "c", "d"]) items = photoReducer(items, { type: "add", id });
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(items[0]?.status).toBe("preparing");
  });
  it("marks a photo ready, failed, uploading with progress, and removes it", () => {
    let items = photoReducer([], { type: "add", id: "a" });
    items = photoReducer(items, { type: "prepared", id: "a" });
    expect(items[0]?.status).toBe("ready");
    items = photoReducer(items, { type: "status", id: "a", status: "uploading" });
    items = photoReducer(items, { type: "progress", id: "a", progress: 0.5 });
    expect(items[0]).toMatchObject({ status: "uploading", progress: 0.5 });
    items = photoReducer(items, { type: "failed", id: "a", errorKey: "unreadable" });
    expect(items[0]).toMatchObject({ status: "failed", errorKey: "unreadable" });
    expect(photoReducer(items, { type: "remove", id: "a" })).toEqual([]);
  });
});
