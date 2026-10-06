/** Shared measurement fixtures for tests (never copy measurements into individual test files). */
import type { Measurements } from "@tafsila/schemas";

/** Standard size M body (Egyptian/EU chart, demo values) in millimetres. */
export const sizeM: Measurements = {
  unit: "mm",
  height: 1650,
  bust: 920,
  highBust: 860,
  underBust: 780,
  waist: 740,
  hip: 1000,
  hipDepth: 200,
  neck: 360,
  shoulderWidth: 380,
  backLength: 400,
  frontLength: 430,
  bustPointDistance: 190,
  bustHeight: 250,
  armLength: 590,
  upperArm: 290,
  wrist: 160,
  waistToKnee: 580,
  waistToFloor: 1050,
};
