const lunar = require('../../vendor/lunar-javascript');
const { TIANGAN, DIZHI } = require('../ganzhi/constants');
const { addDateTimeDays, isValidDateTime } = require('./civil-time');
const { jieList } = require('./jieqi');
const { trueSolarTime } = require('./truesolar');

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const DAY_BOUNDARIES = ['23:00', '00:00'];
// 十二「节」各自开启的月支。「气」不参与月柱分界。
const JIE_MONTH_BRANCH = {
  立春: '寅', 惊蛰: '卯', 清明: '辰', 立夏: '巳', 芒种: '午', 小暑: '未',
  立秋: '申', 白露: '酉', 寒露: '戌', 立冬: '亥', 大雪: '子', 小寒: '丑',
};

function shichenIndex(hour) {
  return Math.floor(((hour + 1) % 24) / 2);
}

function ziHourStemIndex(dayStem) {
  return (TIANGAN.indexOf(dayStem) % 5) * 2;
}

// 墙钟序数。历法库输出的节气时刻与出生时间都按墙钟分量比较，
// 因此不受运行机器时区与历史夏令时影响。
function wallClockKey(date) {
  return ((((date.getFullYear() * 100 + date.getMonth() + 1) * 100
    + date.getDate()) * 100 + date.getHours()) * 100
    + date.getMinutes()) * 100 + date.getSeconds();
}

function jieBefore(referenceTime) {
  const key = wallClockKey(referenceTime);
  const year = referenceTime.getFullYear();
  const candidates = [year - 1, year, year + 1]
    .flatMap(jieList)
    .map(item => ({ 名: item.名, key: wallClockKey(item.时刻), 年: item.时刻.getFullYear() }))
    .sort((left, right) => left.key - right.key);
  const hit = candidates.filter(item => item.key <= key).at(-1);
  if (!hit) throw new Error(`找不到 ${referenceTime.toString()} 之前的节`);
  return { hit, candidates };
}

// 年柱以立春的精确时刻为界，月柱以「节」的精确时刻为界。
// 不能用历法库的 getYearInGanZhiByLiChun / getMonthInGanZhi —— 它们在节气所在日的
// 零点就切换，节气当天、精确时刻之前出生的人会拿到下一个月柱（立春当天还会错年柱）。
function yearMonthPillars(referenceTime) {
  const { hit, candidates } = jieBefore(referenceTime);
  const lichun = candidates.filter(item => item.名 === '立春' && item.key <= hit.key).at(-1);
  if (!lichun) throw new Error(`找不到 ${referenceTime.toString()} 之前的立春`);

  const yearIndex = ((lichun.年 - 4) % 60 + 60) % 60;
  const yearStemIndex = yearIndex % TIANGAN.length;
  const 年 = TIANGAN[yearStemIndex] + DIZHI[yearIndex % DIZHI.length];

  const monthBranchIndex = DIZHI.indexOf(JIE_MONTH_BRANCH[hit.名]);
  // 五虎遁：甲己之年丙作首，自寅月起顺推。
  const offsetFromYin = (monthBranchIndex - DIZHI.indexOf('寅') + DIZHI.length) % DIZHI.length;
  const monthStemIndex = (yearStemIndex * 2 + 2 + offsetFromYin) % TIANGAN.length;
  return { 年, 月: TIANGAN[monthStemIndex] + DIZHI[monthBranchIndex] };
}

function dayPillar(date) {
  return lunar.Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ).getLunar().getDayInGanZhi();
}

function calculateSchool({ referenceTime, dayBoundary }) {
  const hour = referenceTime.getHours();
  const dayOffset = dayBoundary === '23:00' && hour >= 23 ? 1 : 0;
  const dayReference = addDateTimeDays(referenceTime, dayOffset);

  const { 年, 月 } = yearMonthPillars(referenceTime);
  const 日 = dayPillar(dayReference);
  const branchIndex = shichenIndex(hour);
  const 时 = TIANGAN[(ziHourStemIndex(日[0]) + branchIndex) % TIANGAN.length] + SHICHEN[branchIndex];
  return { 年, 月, 日, 时 };
}

function fourPillars({ datetime, longitude, options = {} } = {}) {
  if (!isValidDateTime(datetime)) {
    throw new Error(`datetime 须为合法 Date，收到：${datetime}`);
  }

  const useTrueSolar = options.useTrueSolar !== false;
  if (useTrueSolar && (typeof longitude !== 'number' || Number.isNaN(longitude))) {
    throw new Error('启用真太阳时校正时必须提供经度（longitude）');
  }

  const dayBoundary = options.dayBoundary || '23:00';
  if (!DAY_BOUNDARIES.includes(dayBoundary)) {
    throw new Error(`dayBoundary 只能是 '23:00' 或 '00:00'，收到：${dayBoundary}`);
  }

  let referenceTime = datetime;
  let 真太阳时信息 = null;
  if (useTrueSolar) {
    真太阳时信息 = trueSolarTime({
      datetime,
      longitude,
      utcOffsetMinutes: options.utcOffsetMinutes,
      standardMeridian: options.standardMeridian,
    });
    referenceTime = 真太阳时信息.真太阳时;
  }

  const selected = calculateSchool({ referenceTime, dayBoundary });
  const otherBoundary = dayBoundary === '23:00' ? '00:00' : '23:00';
  const other = calculateSchool({ referenceTime, dayBoundary: otherBoundary });

  return {
    ...selected,
    真太阳时信息,
    采用规则: {
      dayBoundary,
      useTrueSolar,
      说明: dayBoundary === '23:00'
        ? '子时换日：23:00 起算为次日，依十二时辰制以子时为日首（多数派）'
        : '子夜换日：00:00 起算为次日，依现代计时以午夜为日首',
    },
    另一派: {
      dayBoundary: otherBoundary,
      ...other,
      是否不同: other.日 !== selected.日,
    },
  };
}

module.exports = { fourPillars };
