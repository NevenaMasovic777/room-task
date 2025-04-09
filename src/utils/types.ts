export type Point = [number, number];
export type Segment = [Point, Point];
export type Wall = { id: string };
export type Corner = {
  id: string;
  x: number;
  y: number;
  wallStarts: Wall[];
  wallEnds: Wall[];
};

export type TriangleOption = {
  baseSeg: Segment;
  opp: Point;
  baseLength: number;
  perpSeg: Segment;
  perpLength: number;
};
