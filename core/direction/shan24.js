const SHAN_NAMES = [
  '壬', '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳',
  '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥',
];
const GUA_NAMES = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];
const DIRECTIONS = { 坎: '正北', 艮: '东北', 震: '正东', 巽: '东南', 离: '正南', 坤: '西南', 兑: '正西', 乾: '西北' };
const YUAN_NAMES = ['地元', '天元', '人元'];
const START_DEGREE = 337.5;
const SHAN_WIDTH = 15;
const GUA_WIDTH = 45;
const DEFAULT_TOLERANCE = 1.5;

const SHAN24 = SHAN_NAMES.map((山, index) => {
  const 卦 = GUA_NAMES[Math.floor(index / 3)];
  const start = (START_DEGREE + index * SHAN_WIDTH) % 360;
  return {
    山,
    卦,
    方位: DIRECTIONS[卦],
    元: YUAN_NAMES[index % 3],
    range: [start, (start + SHAN_WIDTH) % 360],
    index,
  };
});

function normalize(degree) {
  if (typeof degree !== 'number' || Number.isNaN(degree)) throw new Error(`度数必须是数字：${degree}`);
  if (degree < 0 || degree > 360) throw new Error(`度数须在 0~360 之间：${degree}`);
  return degree % 360;
}

function shanFromDegree(degree) {
  const offset = (normalize(degree) - START_DEGREE + 360) % 360;
  const item = SHAN24[Math.floor(offset / SHAN_WIDTH) % SHAN24.length];
  return { 山: item.山, 卦: item.卦, 方位: item.方位, 元: item.元, range: [...item.range] };
}

function distanceToBoundary(offset, width) {
  const remainder = offset % width;
  return Math.min(remainder, width - remainder);
}

function kongwang(degree, { tolerance = DEFAULT_TOLERANCE } = {}) {
  const offset = (normalize(degree) - START_DEGREE + 360) % 360;
  const guaDistance = distanceToBoundary(offset, GUA_WIDTH);
  if (guaDistance <= tolerance) {
    return { type: '大空亡', 距边界: +guaDistance.toFixed(3), 说明: '八卦交界，气杂不纯' };
  }
  const shanDistance = distanceToBoundary(offset, SHAN_WIDTH);
  if (shanDistance <= tolerance) {
    return { type: '小空亡', 距边界: +shanDistance.toFixed(3), 说明: '二十四山交界，兼线' };
  }
  return { type: null, 距边界: +shanDistance.toFixed(3), 说明: '不在空亡线上' };
}

function zuoxiang(directionDegree) {
  const 向 = shanFromDegree(directionDegree);
  const 坐 = shanFromDegree((normalize(directionDegree) + 180) % 360);
  return { 坐, 向 };
}

module.exports = { SHAN24, shanFromDegree, kongwang, zuoxiang };
