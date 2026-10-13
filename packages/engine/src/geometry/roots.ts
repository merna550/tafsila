/** Real roots of quadratic and cubic polynomials (Cardano / trigonometric method, then Newton polishing). */

/** Coefficients smaller than this fraction of the largest are treated as zero. */
const RELATIVE_ZERO = 1e-12;
/** Roots closer than this are the same root. */
const ROOT_MERGE_EPSILON = 1e-9;
/** Newton steps that sharpen each root to full double precision. */
const NEWTON_STEPS = 3;
/** Constants of the quadratic formula and the depressed-cubic substitution x = y − b/3a. */
const THREE = 3;
const FOUR = 4;
const TWENTY_SEVEN = 27;
/** One third of a full turn, between the three trigonometric roots. */
const THIRD_TURN_RAD = (2 * Math.PI) / THREE;

/**
 * Removes duplicate roots and sorts them.
 *
 * @param roots - Raw roots.
 * @returns Sorted distinct roots.
 */
function distinctSorted(roots: readonly number[]): number[] {
  const sorted = [...roots].sort((a, b) => a - b);
  return sorted.filter((r, i) => i === 0 || r - sorted[i - 1]! > ROOT_MERGE_EPSILON);
}

/**
 * Real roots of a·x² + b·x + c = 0 (falls back to the linear case when a is zero).
 *
 * @param a - x² coefficient.
 * @param b - x coefficient.
 * @param c - Constant.
 * @returns Sorted distinct real roots (empty when none, or when every x solves it).
 */
export function solveQuadratic(a: number, b: number, c: number): number[] {
  const largest = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (largest === 0) return [];
  if (Math.abs(a) <= RELATIVE_ZERO * largest) {
    return Math.abs(b) <= RELATIVE_ZERO * largest ? [] : [-c / b];
  }
  const disc = b * b - FOUR * a * c;
  if (disc < 0) return [];
  const sqrtDisc = Math.sqrt(disc);
  // Stable form: avoid subtracting nearly equal numbers.
  const q = -(b + Math.sign(b || 1) * sqrtDisc) / 2;
  const roots = [q / a];
  if (q !== 0) roots.push(c / q);
  return distinctSorted(roots);
}

/**
 * Roots of the depressed cubic y³ + p·y + q = 0.
 *
 * @param p - y coefficient.
 * @param q - Constant.
 * @returns Real roots in y.
 */
function depressedRoots(p: number, q: number): number[] {
  const disc = (q * q) / FOUR + (p * p * p) / TWENTY_SEVEN;
  if (Math.abs(p) <= RELATIVE_ZERO) return [Math.cbrt(-q)];
  if (disc > 0) {
    const sqrtDisc = Math.sqrt(disc);
    return [Math.cbrt(-q / 2 + sqrtDisc) + Math.cbrt(-q / 2 - sqrtDisc)];
  }
  const r = Math.sqrt(-p / THREE);
  const cosArg = Math.min(1, Math.max(-1, -q / (2 * r * r * r)));
  const phi = Math.acos(cosArg) / THREE;
  return [0, 1, 2].map((k) => 2 * r * Math.cos(phi - k * THIRD_TURN_RAD));
}

/**
 * Sharpens a root of a·x³ + b·x² + c·x + d with a few Newton steps.
 *
 * @param coefficients - [a, b, c, d].
 * @param x - Approximate root.
 * @returns The polished root.
 */
function polish(coefficients: readonly [number, number, number, number], x: number): number {
  const [a, b, c, d] = coefficients;
  let root = x;
  for (let i = 0; i < NEWTON_STEPS; i += 1) {
    const value = ((a * root + b) * root + c) * root + d;
    const slope = (THREE * a * root + 2 * b) * root + c;
    if (slope === 0) break;
    root -= value / slope;
  }
  return root;
}

/**
 * Real roots of a·x³ + b·x² + c·x + d = 0.
 *
 * @param a - x³ coefficient.
 * @param b - x² coefficient.
 * @param c - x coefficient.
 * @param d - Constant.
 * @returns Sorted distinct real roots.
 */
export function solveCubic(a: number, b: number, c: number, d: number): number[] {
  const largest = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  if (largest === 0) return [];
  if (Math.abs(a) <= RELATIVE_ZERO * largest) return solveQuadratic(b, c, d);
  const [nb, nc, nd] = [b / a, c / a, d / a];
  const p = nc - (nb * nb) / THREE;
  const q = (2 * nb * nb * nb) / TWENTY_SEVEN - (nb * nc) / THREE + nd;
  const shift = -nb / THREE;
  const raw = depressedRoots(p, q).map((y) => y + shift);
  return distinctSorted(raw.map((x) => polish([1, nb, nc, nd], x)));
}
