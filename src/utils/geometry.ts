import type { Point, Segment, TriangleOption } from "./types";

export function dotProduct(v1: Point, v2: Point) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

export function vectorLength([p1, p2]: Segment) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint([p1, p2]: Segment, offset = 40): Point {
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const dx = p2[1] - p1[1];
  const dy = p1[0] - p2[0];
  const len = Math.sqrt(dx * dx + dy * dy);
  return [mx + (dx / len) * offset, my + (dy / len) * offset];
}

export function getBounds(segs: Segment[]) {
  const allPoints: Point[] = [];
  for (const [p1, p2] of segs) {
    allPoints.push(p1, p2);
  }
  const xs = allPoints.map((p) => p[0]);
  const ys = allPoints.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function arePerpendicular(
  [p1, p2]: Segment,
  [q1, q2]: Segment
): boolean {
  const v1: Point = [p2[0] - p1[0], p2[1] - p1[1]];
  const v2: Point = [q2[0] - q1[0], q2[1] - q1[1]];
  const dot = dotProduct(v1, v2);
  const mag1 = Math.hypot(...v1);
  const mag2 = Math.hypot(...v2);
  const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  return Math.abs(angle - 90) < 10;
}

export function footOfPerpendicular([A, B]: Segment, P: Point): Point {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const denom = dx * dx + dy * dy;
  if (denom === 0) return A;
  const t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / denom;
  return [A[0] + t * dx, A[1] + t * dy];
}

export function computeTriangleOptions(points: Point[]): TriangleOption[] {
  const options = [];

  const option1: TriangleOption = (() => {
    const baseSeg: Segment = [points[0], points[1]];
    const baseLength = vectorLength(baseSeg);
    const perpLength = perpendicularDistance(baseSeg, points[2]);
    const foot = footOfPerpendicular(baseSeg, points[2]);
    const perpSeg: Segment = [points[2], foot];
    return { baseSeg, opp: points[2], baseLength, perpSeg, perpLength };
  })();

  const option2: TriangleOption = (() => {
    const baseSeg: Segment = [points[1], points[2]];
    const baseLength = vectorLength(baseSeg);
    const perpLength = perpendicularDistance(baseSeg, points[0]);
    const foot = footOfPerpendicular(baseSeg, points[0]);
    const perpSeg: Segment = [points[0], foot];
    return { baseSeg, opp: points[0], baseLength, perpSeg, perpLength };
  })();

  const option3: TriangleOption = (() => {
    const baseSeg: Segment = [points[2], points[0]];
    const baseLength = vectorLength(baseSeg);
    const perpLength = perpendicularDistance(baseSeg, points[1]);
    const foot = footOfPerpendicular(baseSeg, points[1]);
    const perpSeg: Segment = [points[1], foot];
    return { baseSeg, opp: points[1], baseLength, perpSeg, perpLength };
  })();

  options.push(option1, option2, option3);

  return options;
}

function perpendicularDistance([A, B]: Segment, P: Point): number {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const numerator = Math.abs(dy * P[0] - dx * P[1] + B[0] * A[1] - B[1] * A[0]);
  const denominator = Math.hypot(dx, dy);
  return numerator / denominator;
}

export function extractUniquePoints(segs: Segment[]): Point[] {
  const pointSet = new Set<string>();
  const pts: Point[] = [];
  for (const seg of segs) {
    const [p1, p2] = seg;
    const key1 = `${p1[0]},${p1[1]}`;
    const key2 = `${p2[0]},${p2[1]}`;
    if (!pointSet.has(key1)) {
      pointSet.add(key1);
      pts.push(p1);
    }
    if (!pointSet.has(key2)) {
      pointSet.add(key2);
      pts.push(p2);
    }
  }
  return pts;
}
