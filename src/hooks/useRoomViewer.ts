import { ref, type Ref } from "vue";
import { getBounds, vectorLength } from "../utils/geometry";
import type { Point, Segment, TriangleOption } from "../utils/types";
import {
  buildSegments,
  drawLabelRotated,
  drawSegment,
  findPerpendicularPairs,
} from "../utils/segment-utils";
import { computeTriangleOptions, extractUniquePoints } from "../utils/triangle";

export function useRoomViewer(canvas: Ref<HTMLCanvasElement | null>) {
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  const segments = ref<Segment[]>([]);
  const allPairs = ref<[Segment, Segment][]>([]);
  const flipInPair = ref(false);

  const currentPairIndex = ref(0);

  const triangleOptions = ref<TriangleOption[]>([]);
  const currentTriangleOptionIndex = ref(0);

  const shapeFiles = [
    "src/data/simple.json",
    "src/data/triangle.json",
    "src/data/t_shape.json",
  ];

  const currentShapeFile = ref("");

  function pickRandomShapeFile() {
    return shapeFiles[Math.floor(Math.random() * shapeFiles.length)];
  }

  function drawTshape(ctx: CanvasRenderingContext2D) {
    segments.value.forEach((seg) => drawSegment(ctx, seg));

    let largestH: Segment | null = null;
    let maxH = 0;
    let sumVertical = 0;
    let vertMinX = Infinity,
      vertMaxX = -Infinity,
      vertMinY = Infinity,
      vertMaxY = -Infinity;

    for (const seg of segments.value) {
      const [p1, p2] = seg;
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const length = Math.hypot(dx, dy);

      if (Math.abs(dx) > Math.abs(dy)) {
        if (length > maxH) {
          maxH = length;
          largestH = seg;
        }
      } else {
        sumVertical += length;
        vertMinX = Math.min(vertMinX, p1[0], p2[0]);
        vertMaxX = Math.max(vertMaxX, p1[0], p2[0]);
        vertMinY = Math.min(vertMinY, p1[1], p2[1]);
        vertMaxY = Math.max(vertMaxY, p1[1], p2[1]);
      }
    }

    const horizColor = flipInPair.value ? "red" : "blue";
    const vertColor = flipInPair.value ? "blue" : "red";
    const horizLabel = flipInPair.value ? "Length" : "Width";
    const vertLabel = flipInPair.value ? "Width" : "Length";

    if (largestH) {
      drawSegment(ctx, largestH, horizColor, 6);
      drawLabelRotated(ctx, largestH, horizLabel, horizColor);
    }
    if (sumVertical > 0 && vertMinY < vertMaxY) {
      const centerX = (vertMinX + vertMaxX) / 2;
      const dimensionSeg: Segment = [
        [centerX, vertMinY],
        [centerX, vertMaxY],
      ];
      drawSegment(ctx, dimensionSeg, vertColor, 6);
      drawLabelRotated(ctx, dimensionSeg, vertLabel, vertColor);
    }
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

    const color1 = flipInPair.value ? "red" : "blue";
    const label1 = flipInPair.value ? "Width" : "Length";
    const color2 = flipInPair.value ? "blue" : "red";
    const label2 = flipInPair.value ? "Length" : "Width";

    segments.value.forEach((seg) => drawSegment(ctx, seg));

    drawSegment(ctx, triangleOption.baseSeg, color1, 6);
    drawLabelRotated(ctx, triangleOption.baseSeg, label1, color1);

    drawSegment(ctx, triangleOption.perpSeg, color2, 6);
    drawLabelRotated(ctx, triangleOption.perpSeg, label2, color2);
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
      drawTshape(ctx.value);
    } else if (currentShapeFile.value.includes("triangle")) {
      drawTriangle(ctx.value);
    } else {
      segments.value.forEach((seg) => drawSegment(ctx.value!, seg));
      if (pair) {
        const [s1, s2] = pair;
        const [primary, secondary] = flipInPair.value ? [s2, s1] : [s1, s2];
        drawSegment(ctx.value, primary, "red", 5);
        drawSegment(ctx.value, secondary, "blue", 5);
        drawLabelRotated(ctx.value, primary, "Length", "red");
        drawLabelRotated(ctx.value, secondary, "Width", "blue");
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
