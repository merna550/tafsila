/** Composition root: the only place that chooses which adapter implements each port (ADR-006). */
import { loadBuildInfo, type BuildInfo } from "@tafsila/config";
import { createSystemClock } from "./adapters/system/system-clock";
import type { Clock } from "./ports/clock";

/** Build information reported by the health endpoint. */
export type AppInfo = BuildInfo;

/** Everything the routes and services need, wired once per process. */
export interface Container {
  /** Time source. */
  readonly clock: Clock;
  /** Build information. */
  readonly appInfo: AppInfo;
}

/**
 * Wires real adapters for the running environment; tests pass overrides with fakes.
 *
 * @param overrides - Ports to replace (e.g. a fixed clock in tests).
 * @returns The dependency container.
 */
export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    clock: createSystemClock(),
    appInfo: loadBuildInfo(),
    ...overrides,
  };
}
