import { ref, type Ref } from "vue";
import {
  computeTriangleOptions,
  extractUniquePoints,
  footOfPerpendicular,
  getBounds,
  vectorLength,
} from "../utils/geometry";
import type { Point, Segment, TriangleOption } from "../utils/types";
import {
  buildSegments,
  drawDimensionPair,
  drawSegment,
  findPerpendicularPairs,
  getDimensionConfig,
} from "../utils/segment-utils";

export function useRoomViewer(canvas: Ref<HTMLCanvasElement | null>) {
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  const segments = ref<Segment[]>([]);
  const allPairs = ref<[Segment, Segment][]>([]);
  const flipInPair = ref(false);
  const currentPairIndex = ref(0);
  const triangleOptions = ref<TriangleOption[]>([]);
  const currentTriangleOptionIndex = ref(0);
  const currentShapeFile = ref("");

  const shapeFiles = [
    "src/data/simple.json",
    "src/data/triangle.json",
    "src/data/t_shape.json",
  ];

  function pickRandomShapeFile() {
    return shapeFiles[Math.floor(Math.random() * shapeFiles.length)];
  }

  function drawTShape(ctx: CanvasRenderingContext2D) {
    segments.value.forEach((seg) => drawSegment(ctx, seg, "#333"));

    let bottomSeg: Segment | null = null;
    let bottomY = Infinity;
    let topSeg: Segment | null = null;
    let topY = -Infinity;

    for (const seg of segments.value) {
      const [p1, p2] = seg;
      const dy = Math.abs(p2[1] - p1[1]);
      if (dy < 5) {
        const avgY = (p1[1] + p2[1]) / 2;
        if (avgY < bottomY) {
          bottomY = avgY;
          bottomSeg = seg;
        }
        if (avgY > topY) {
          topY = avgY;
          topSeg = seg;
        }
      }
    }
    if (!bottomSeg) return;

    let refPoint: Point;
    if (topSeg) {
      refPoint = [
        (topSeg[0][0] + topSeg[1][0]) / 2,
        (topSeg[0][1] + topSeg[1][1]) / 2,
      ];
    } else {
      const { minX, maxX, maxY } = getBounds(segments.value);
      refPoint = [(minX + maxX) / 2, maxY];
    }

    const foot = footOfPerpendicular(bottomSeg, refPoint);
    const perpSeg: Segment = [refPoint, foot];

    const config = getDimensionConfig(flipInPair.value);
    drawDimensionPair(ctx, bottomSeg, perpSeg, config);
  }

  function drawTriangle(ctx: CanvasRenderingContext2D) {
    const pointSet = new Set<string>();
    const points: Point[] = [];
    for (const seg of segments.value) {
      const [p1, p2] = seg;
      const key1 = `${p1[0]},${p1[1]}`;
      const key2 = `${p2[0]},${p2[1]}`;
      if (!pointSet.has(key1)) {
        pointSet.add(key1);
        points.push(p1);
      }
      if (!pointSet.has(key2)) {
        pointSet.add(key2);
        points.push(p2);
      }
    }
    if (points.length < 3) return;

    const options = computeTriangleOptions(points);
    triangleOptions.value = options;

    const triangleOption =
      triangleOptions.value[currentTriangleOptionIndex.value];
    if (!triangleOption) return;

    segments.value.forEach((seg) => drawSegment(ctx, seg));

    const config = getDimensionConfig(flipInPair.value);
    drawDimensionPair(
      ctx,
      triangleOption.baseSeg,
      triangleOption.perpSeg,
      config
    );
  }

  function drawRoom(pair: [Segment, Segment] | null = null) {
    if (!ctx.value) return;

    ctx.value.clearRect(0, 0, 800, 400);
    ctx.value.save();

    const { minX, maxX, minY, maxY } = getBounds(segments.value);
    const scale = Math.min(700 / (maxX - minX), 300 / (maxY - minY));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    ctx.value.translate(400, 200);
    ctx.value.scale(scale, -scale);
    ctx.value.translate(-centerX, -centerY);

    if (currentShapeFile.value.includes("t_shape")) {
      drawTShape(ctx.value);
    } else if (currentShapeFile.value.includes("triangle")) {
      drawTriangle(ctx.value);
    } else {
      segments.value.forEach((seg) => drawSegment(ctx.value!, seg));
      if (pair) {
        const [s1, s2] = pair;

        const config = getDimensionConfig(flipInPair.value);
        drawDimensionPair(ctx.value, s1, s2, config);
      }
    }

    ctx.value.restore();
  }

  function changeValues() {
    if (currentShapeFile.value.includes("triangle")) {
      if (triangleOptions.value.length === 0) return;
      currentTriangleOptionIndex.value =
        (currentTriangleOptionIndex.value + 1) % triangleOptions.value.length;
      drawRoom();
    } else {
      if (allPairs.value.length === 0) return;
      const [s1, s2] = allPairs.value[currentPairIndex.value];
      if (vectorLength(s1) !== vectorLength(s2) && !flipInPair.value) {
        flipInPair.value = true;
        drawRoom([s1, s2]);
        return;
      }
      currentPairIndex.value =
        (currentPairIndex.value + 1) % allPairs.value.length;
      flipInPair.value = false;
      drawRoom(allPairs.value[currentPairIndex.value]);
    }
  }

  async function initialize() {
    ctx.value = canvas.value?.getContext("2d") || null;

    const file = pickRandomShapeFile();
    currentShapeFile.value = file;

    try {
      const res = await fetch(file);
      const data = await res.json();
      if (!data?.corners || !data?.walls) {
        console.warn("Invalid shape data");
        return;
      }

      segments.value = buildSegments(data.corners, data.walls);
      allPairs.value = findPerpendicularPairs(segments.value);

      if (file.includes("triangle")) {
        const pts = extractUniquePoints(segments.value);
        if (pts.length >= 3) {
          triangleOptions.value = computeTriangleOptions(pts);
          currentTriangleOptionIndex.value = 0;
        }
      }

      drawRoom(allPairs.value[0] ?? null);
    } catch (error) {
      console.error("Error initializing shape:", error);
    }
  }

  return {
    initialize,
    changeValues,
  };
}
