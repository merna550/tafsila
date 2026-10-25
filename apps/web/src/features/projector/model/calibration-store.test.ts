import { afterEach, describe, expect, it, vi } from "vitest";
import { CALIBRATION_KEY, readCalibration, writeCalibration } from "./calibration-store";
import type { ProjectorCalibration, ScreenInfo } from "../projector.schema";

const SCREEN: ScreenInfo = { widthPx: 1920, heightPx: 1080, devicePixelRatio: 1 };
const CALIBRATION: ProjectorCalibration = {
  version: 1,
  pxPerMmX: 1.02,
  pxPerMmY: 0.99,
  screen: SCREEN,
  calibratedAt: "2026-10-25T10:00:00.000Z",
};

/**
 * Puts a map-backed `window.localStorage` in place.
 *
 * @returns The map behind it.
 */
function stubMemoryStorage(): Map<string, string> {
  const data = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    },
  });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe("calibration store", () => {
  it("round-trips a calibration made on this screen", () => {
    stubMemoryStorage();
    expect(writeCalibration(CALIBRATION)).toBe(true);
    expect(readCalibration(SCREEN)).toEqual({ status: "ok", calibration: CALIBRATION });
  });

  it("is stale after a change of screen width, height or pixel ratio", () => {
    stubMemoryStorage();
    writeCalibration(CALIBRATION);
    for (const changed of [
      { ...SCREEN, widthPx: 1366 },
      { ...SCREEN, heightPx: 768 },
      { ...SCREEN, devicePixelRatio: 1.25 },
    ]) {
      expect(readCalibration(changed).status).toBe("stale");
    }
    expect(readCalibration({ ...SCREEN, devicePixelRatio: 1.005 }).status).toBe("ok");
  });

  it("is missing when nothing, broken JSON or a wrong shape is stored", () => {
    const data = stubMemoryStorage();
    expect(readCalibration(SCREEN).status).toBe("missing");
    data.set(CALIBRATION_KEY, "{oops");
    expect(readCalibration(SCREEN).status).toBe("missing");
    data.set(CALIBRATION_KEY, JSON.stringify({ ...CALIBRATION, pxPerMmX: -1 }));
    expect(readCalibration(SCREEN).status).toBe("missing");
    data.set(CALIBRATION_KEY, JSON.stringify({ ...CALIBRATION, version: 2 }));
    expect(readCalibration(SCREEN).status).toBe("missing");
  });

  it("reads as missing and refuses to write when storage throws", () => {
    const blocked = (): never => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", { localStorage: { getItem: blocked, setItem: blocked } });
    expect(readCalibration(SCREEN).status).toBe("missing");
    expect(writeCalibration(CALIBRATION)).toBe(false);
  });
});
