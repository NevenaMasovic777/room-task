import type { Point, Segment } from "./types";

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
