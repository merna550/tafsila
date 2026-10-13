/** Tolerances of the geometry kit (decision 124). All are far inside the ± 1 mm accuracy target of NFR-01. */

/** Two points closer than this, in mm, are the same point (path joins, closed-path check, duplicate roots). */
export const GEOMETRY_EPSILON_MM = 0.01;

/** A curve piece is short enough to measure when its chord and control net differ by at most this, in mm. */
export const CURVE_LENGTH_TOLERANCE_MM = 0.001;

/** Curve–curve intersection stops subdividing when both boxes are smaller than this, in mm. */
export const INTERSECTION_TOLERANCE_MM = 0.001;

/** Largest gap, in mm, allowed between an offset cubic and the true offset curve at the sampled checks. */
export const OFFSET_TOLERANCE_MM = 0.05;

/** A mitre corner may reach at most this many times the offset distance from the corner; beyond it the corner is cut square. */
export const MITRE_LIMIT = 4;

/** Safety limit on recursive subdivision (2^24 pieces is far below any useful tolerance). */
export const MAX_SUBDIVISION_DEPTH = 24;

/** Safety limit on bisection steps when searching a parameter (each step halves the range). */
export const MAX_BISECTION_STEPS = 60;

/** Number of checks along each offset cubic when measuring its error against the true offset. */
export const OFFSET_ERROR_SAMPLES = 8;

/** Number of straight pieces per cubic when a path is turned into a polygon (area, inside test). */
export const POLYGON_SAMPLES_PER_CURVE = 32;

/** Catmull-Rom tangents are a third of the neighbour chord when turned into Bézier control points. */
export const CATMULL_ROM_HANDLE_RATIO = 0.3333333333333333;

/** Smallest vector length, in mm, treated as a real direction (below this a tangent is undefined). */
export const DIRECTION_EPSILON_MM = 1e-9;

/** Most sub-problems a curve–curve intersection may visit before it reports the curves as overlapping. */
export const MAX_INTERSECTION_STEPS = 200_000;

/** Deepest subdivision when offsetting one cubic (2^10 = 1024 pieces); deeper means the offset has a cusp. */
export const OFFSET_MAX_DEPTH = 10;
