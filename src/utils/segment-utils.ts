import { arePerpendicular, midpoint } from "./geometry";
import type { Corner, Point, Segment, Wall } from "./types";

export function buildSegments(corners: Corner[], walls: Wall[]): Segment[] {
  const result: Segment[] = [];
  for (const wall of walls) {
    const connected = corners.filter(
      (c) =>
        c.wallStarts.some((w: Wall) => w.id === wall.id) ||
        c.wallEnds.some((w: Wall) => w.id === wall.id)
    );
    if (connected.length === 2) {
      const [p1, p2] = connected.map((c) => [c.x, c.y] as Point);
      result.push([p1, p2]);
    }
  }
  return result;
}

export function findPerpendicularPairs(segs: Segment[]): [Segment, Segment][] {
  const pairs: [Segment, Segment][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < segs.length; i++) {
    for (let j = 0; j < segs.length; j++) {
      if (i === j) continue;
      const key = [i, j].sort().join("-");
      if (!seen.has(key) && arePerpendicular(segs[i], segs[j])) {
        seen.add(key);
        pairs.push([segs[i], segs[j]]);
      }
    }
  }
  return pairs;
}

export function drawSegment(
  ctx: CanvasRenderingContext2D,
  [p1, p2]: Segment,
  color = "black",
  width = 2
) {
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawLabelRotated(
  ctx: CanvasRenderingContext2D,
  [p1, p2]: Segment,
  text: string,
  color = "black"
) {
  const mid = midpoint([p1, p2]);
  let angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    angle += Math.PI;
  }
  const dx = p2[1] - p1[1];
  const dy = p1[0] - p2[0];
  const len = Math.hypot(dx, dy);
  const offsetX = (dx / len) * 20;
  const offsetY = (dy / len) * 20;
  ctx.save();
  ctx.translate(mid[0] + offsetX, mid[1] + offsetY);
  ctx.rotate(-angle);
  ctx.scale(1, -1);
  ctx.font = "40px sans-serif";
  ctx.fillStyle = color;
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, -textWidth / 2, 0);
  ctx.restore();
}

export function getDimensionConfig(flip: boolean) {
  return {
    primaryColor: flip ? "red" : "blue",
    primaryLabel: flip ? "Width" : "Length",
    secondaryColor: flip ? "blue" : "red",
    secondaryLabel: flip ? "Length" : "Width",
    lineWidth: 6,
  };
}

export function drawDimensionPair(
  ctx: CanvasRenderingContext2D,
  segPrimary: Segment,
  segSecondary: Segment,
  config: ReturnType<typeof getDimensionConfig>
) {
  drawSegment(ctx, segPrimary, config.primaryColor, config.lineWidth);
  drawLabelRotated(ctx, segPrimary, config.primaryLabel, config.primaryColor);
  drawSegment(ctx, segSecondary, config.secondaryColor, config.lineWidth);
  drawLabelRotated(
    ctx,
    segSecondary,
    config.secondaryLabel,
    config.secondaryColor
  );
}
