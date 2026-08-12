const LUOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const NUMBER_TO_DIRECTION = {
  1: '正北', 2: '西南', 3: '正东', 4: '东南', 5: '中宫',
  6: '西北', 7: '正西', 8: '东北', 9: '正南',
};
const DIRECTION_TO_NUMBER = Object.fromEntries(
  Object.entries(NUMBER_TO_DIRECTION).map(([number, direction]) => [direction, Number(number)]),
);
const FLYING_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4].map(number => NUMBER_TO_DIRECTION[number]);
const CYCLE_START = 1864;
const CYCLE_YEARS = 180;
const PERIOD_YEARS = 20;

function luoshuOf(direction) {
  const number = DIRECTION_TO_NUMBER[direction];
  if (!number) throw new Error(`未知方位：${direction}`);
  return number;
}

function fangweiOf(number) {
  const direction = NUMBER_TO_DIRECTION[number];
  if (!direction) throw new Error(`洛书数须在 1~9 之间：${number}`);
  return direction;
}

function flyStars(center, direction) {
  if (!Number.isInteger(center) || center < 1 || center > 9) {
    throw new Error(`入中数须为 1~9 的整数：${center}`);
  }
  if (!['顺飞', '逆飞'].includes(direction)) {
    throw new Error(`飞星方向须为「顺飞」或「逆飞」：${direction}`);
  }
  const step = direction === '顺飞' ? 1 : -1;
  return Object.fromEntries(FLYING_PATH.map((position, index) => [
    position,
    ((center - 1 + step * index) % 9 + 9) % 9 + 1,
  ]));
}

function standardYuan(period) {
  if (period <= 3) return '上元';
  if (period <= 6) return '中元';
  return '下元';
}

function provisionalYuan(period) {
  if (period >= 6) return '下元';
  if (period >= 3) return '中元';
  return '上元';
}

function yunOf(year) {
  if (!Number.isInteger(year)) throw new Error(`年份须为整数：${year}`);
  const offset = ((year - CYCLE_START) % CYCLE_YEARS + CYCLE_YEARS) % CYCLE_YEARS;
  const 运 = Math.floor(offset / PERIOD_YEARS) + 1;
  const start = year - (offset % PERIOD_YEARS);
  return {
    运,
    元: provisionalYuan(运),
    标准元: standardYuan(运),
    临时口径: true,
    区间: [start, start + PERIOD_YEARS - 1],
    依据: 'C2 尚未裁决；元字段临时按资料所述 1964–2043 窗口将六至九运列为下元，同时用标准元字段并列呈现通说',
  };
}

module.exports = { LUOSHU, luoshuOf, fangweiOf, flyStars, yunOf, 飞星路径: FLYING_PATH };
