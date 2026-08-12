const DEFAULT_STEP = 0.5;
const CONSISTENCY_TOLERANCE = 0.5;
const MAX_GRID_CELLS = 1_000_000;

function validatePolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    throw new Error(`户型多边形至少需要 3 个顶点，收到：${polygon && polygon.length}`);
  }
  polygon.forEach(point => {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error('户型顶点必须包含有限数值 x、y');
    }
  });
}

function boundingBox(polygon) {
  const xs = polygon.map(point => point.x);
  const ys = polygon.map(point => point.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function centerByDiagonal(polygon) {
  validatePolygon(polygon);
  const box = boundingBox(polygon);
  return {
    x: (box.x0 + box.x1) / 2,
    y: (box.y0 + box.y1) / 2,
    算法: '对角线法',
    说明: '取户型外接矩形两条对角线交点',
  };
}

function pointInPolygon(polygon, x, y) {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    const crosses = (a.y > y) !== (b.y > y)
      && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function largestSolidRectangle(polygon, box, step) {
  const columns = Math.ceil((box.x1 - box.x0) / step);
  const rows = Math.ceil((box.y1 - box.y0) / step);
  if (columns * rows > MAX_GRID_CELLS) {
    throw new Error(`采样网格过大（${columns * rows}），请增大 step`);
  }

  const heights = Array(columns).fill(0);
  let best = null;
  for (let row = 0; row < rows; row++) {
    const y = Math.min(box.y0 + (row + 0.5) * step, box.y1 - Number.EPSILON);
    for (let column = 0; column < columns; column++) {
      const x = Math.min(box.x0 + (column + 0.5) * step, box.x1 - Number.EPSILON);
      heights[column] = pointInPolygon(polygon, x, y) ? heights[column] + 1 : 0;
    }

    const stack = [];
    for (let column = 0; column <= columns; column++) {
      const height = column === columns ? 0 : heights[column];
      let start = column;
      while (stack.length && stack[stack.length - 1].height > height) {
        const item = stack.pop();
        start = item.start;
        const width = column - item.start;
        const area = width * item.height;
        if (!best || area > best.area) {
          best = { area, left: item.start, right: column, bottom: row - item.height + 1, top: row + 1 };
        }
      }
      if (!stack.length || stack[stack.length - 1].height < height) stack.push({ start, height });
    }
  }
  if (!best) throw new Error('户型采样后没有可用实墙区域，请检查顶点与 step');
  return {
    x0: box.x0 + best.left * step,
    y0: box.y0 + best.bottom * step,
    x1: Math.min(box.x0 + best.right * step, box.x1),
    y1: Math.min(box.y0 + best.top * step, box.y1),
  };
}

function centerBySolidWall(polygon, { step = DEFAULT_STEP } = {}) {
  validatePolygon(polygon);
  if (!Number.isFinite(step) || step <= 0) throw new Error(`step 必须是正数：${step}`);
  const rectangle = largestSolidRectangle(polygon, boundingBox(polygon), step);
  return {
    x: (rectangle.x0 + rectangle.x1) / 2,
    y: (rectangle.y0 + rectangle.y1) / 2,
    算法: '实墙逼近法',
    说明: `按 ${step} 米网格取完全落在户型内的最大轴对齐实墙矩形`,
    采用矩形: rectangle,
  };
}

function houseCenter(polygon) {
  const diagonal = centerByDiagonal(polygon);
  const solidWall = centerBySolidWall(polygon);
  const difference = Math.hypot(diagonal.x - solidWall.x, diagonal.y - solidWall.y);
  const consistent = difference < CONSISTENCY_TOLERANCE;
  return {
    对角线法: diagonal,
    实墙逼近法: solidWall,
    一致: consistent,
    偏差: +difference.toFixed(4),
    提示: consistent
      ? '两种算法结果一致，中心点可直接采用'
      : `两种算法结果分歧 ${difference.toFixed(2)} 米；户型存在凹凸或缺角，两套结果均需呈现`,
  };
}

module.exports = { centerByDiagonal, centerBySolidWall, houseCenter };
