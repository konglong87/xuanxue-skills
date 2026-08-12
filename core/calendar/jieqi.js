const lunar = require('../../vendor/lunar-javascript');

const JIE12 = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
const DAY_MS = 86_400_000;
const INTERNAL_NAMES = {
  DONG_ZHI: '冬至', XIAO_HAN: '小寒', DA_HAN: '大寒', LI_CHUN: '立春',
  YU_SHUI: '雨水', JING_ZHE: '惊蛰', CHUN_FEN: '春分', QING_MING: '清明',
  GU_YU: '谷雨', LI_XIA: '立夏', XIAO_MAN: '小满', MANG_ZHONG: '芒种',
  XIA_ZHI: '夏至', XIAO_SHU: '小暑', DA_SHU: '大暑', LI_QIU: '立秋',
  CHU_SHU: '处暑', BAI_LU: '白露', QIU_FEN: '秋分', HAN_LU: '寒露',
  SHUANG_JIANG: '霜降', LI_DONG: '立冬', XIAO_XUE: '小雪', DA_XUE: '大雪',
};

function toDate(solar) {
  return new Date(
    solar.getYear(),
    solar.getMonth() - 1,
    solar.getDay(),
    solar.getHour(),
    solar.getMinute(),
    solar.getSecond(),
  );
}

function jieqiTable(year) {
  if (!Number.isInteger(year)) throw new Error(`年份须为整数：${year}`);
  const seen = new Map();
  for (let month = 1; month <= 12; month++) {
    const table = lunar.Lunar.fromDate(new Date(year, month - 1, 15)).getJieQiTable();
    for (const [rawName, solar] of Object.entries(table)) {
      const name = INTERNAL_NAMES[rawName] || rawName;
      const date = toDate(solar);
      if (date.getFullYear() !== year) continue;
      seen.set(`${name}:${date.getTime()}`, { 名: name, 时刻: date, 是节: JIE12.includes(name) });
    }
  }
  return [...seen.values()].sort((left, right) => left.时刻 - right.时刻);
}

function jieList(year) {
  return jieqiTable(year).filter(item => item.是节);
}

function surroundingJie(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error(`date 须为合法 Date：${date}`);
  }
  const year = date.getFullYear();
  return [...jieList(year - 1), ...jieList(year), ...jieList(year + 1)];
}

function prevJie(date) {
  const hit = surroundingJie(date).filter(item => item.时刻 <= date).at(-1);
  if (!hit) throw new Error(`找不到 ${date.toISOString()} 之前的节`);
  return { ...hit, 相差天数: +((date - hit.时刻) / DAY_MS).toFixed(4) };
}

function nextJie(date) {
  const hit = surroundingJie(date).find(item => item.时刻 > date);
  if (!hit) throw new Error(`找不到 ${date.toISOString()} 之后的节`);
  return { ...hit, 相差天数: +((hit.时刻 - date) / DAY_MS).toFixed(4) };
}

module.exports = { jieqiTable, jieList, prevJie, nextJie, JIE12 };
