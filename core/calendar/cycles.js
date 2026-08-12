const lunar = require('../../vendor/lunar-javascript');
const { TIANGAN, DIZHI, JIAZI } = require('../ganzhi/constants');
const { shiShen } = require('../ganzhi/shishen');
const { relation } = require('../ganzhi/relation');
const { isValidDateTime } = require('./civil-time');

const GENDER_CODES = { male: 1, female: 0 };
const SECTS = [
  { sect: 1, 折算法: '按时辰天数折算' },
  { sect: 2, 折算法: '按分钟折算' },
];
const DEFAULT_CYCLE_COUNT = 8;
const MAX_CYCLE_COUNT = 12;
const MIN_TARGET_YEAR = 1800;
const MAX_TARGET_YEAR = 2300;
const SECONDS_PER_DAY = 86_400;
const START_PRECISION = {
  sect1: '时辰级：沿用 lunar-javascript 按时辰天数折算',
  sect2: '分钟级：顺排取出生时刻至下一节、逆排取上一节至出生时刻的有向秒差，四舍五入到最近整分钟',
};

function solarFromDateTime(datetime) {
  return lunar.Solar.fromYmdHms(
    datetime.getFullYear(),
    datetime.getMonth() + 1,
    datetime.getDate(),
    datetime.getHours(),
    datetime.getMinutes(),
    datetime.getSeconds(),
  );
}

function exactSect2Start(solar, eightChar, genderCode) {
  const lunarValue = solar.getLunar();
  const rawYun = eightChar.getYun(genderCode, 2);
  const forward = rawYun.isForward();
  // Vendor uses current→nextJie or prevJie→current, but subtractMinute discards both seconds.
  const boundary = forward
    ? lunarValue.getNextJie().getSolar()
    : lunarValue.getPrevJie().getSolar();
  const exactSeconds = Math.round(
    Math.abs(boundary.getJulianDay() - solar.getJulianDay()) * SECONDS_PER_DAY,
  );
  let remaining = Math.round(exactSeconds / 60);
  const year = Math.floor(remaining / 4320);
  remaining -= year * 4320;
  const month = Math.floor(remaining / 360);
  remaining -= month * 360;
  const day = Math.floor(remaining / 12);
  remaining -= day * 12;
  return { year, month, day, hour: remaining * 2, forward };
}

function flowYearDetails(flowYear) {
  return {
    年份: flowYear.getYear(),
    虚岁: flowYear.getAge(),
    干支: flowYear.getGanZhi(),
  };
}

function cyclePeriod(daYun, includeFlowYears = true) {
  const period = {
    起始年份: daYun.getStartYear(),
    结束年份: daYun.getEndYear(),
    起始虚岁: daYun.getStartAge(),
    结束虚岁: daYun.getEndAge(),
  };
  if (!includeFlowYears) return period;
  return {
    干支: daYun.getGanZhi(),
    ...period,
    流年: daYun.getLiuNian(10).map(flowYearDetails),
  };
}

function normalizeChildhood(period) {
  return period.结束年份 < period.起始年份 || period.结束虚岁 < period.起始虚岁
    ? null
    : period;
}

function schoolDetails(eightChar, genderCode, { sect, 折算法 }, count, birthYear) {
  const yun = eightChar.getYun(genderCode, sect);
  const allPeriods = yun.getDaYun(count + 1);
  return {
    sect,
    折算法,
    起运年: yun.getStartYear(),
    起运月: yun.getStartMonth(),
    起运日: yun.getStartDay(),
    起运时: yun.getStartHour(),
    顺排: yun.isForward(),
    起运公历: yun.getStartSolar().toYmdHms(),
    出生年份: birthYear,
    童限: normalizeChildhood(cyclePeriod(allPeriods[0], false)),
    大运: allPeriods.slice(1, count + 1).map(period => cyclePeriod(period)),
  };
}

function ganzhiOfYear(year) {
  const index = ((year - 4) % JIAZI.length + JIAZI.length) % JIAZI.length;
  return JIAZI[index];
}

function addStartOffset(solar, { year, month, day, hour }) {
  return solar.nextYear(year).nextMonth(month).next(day).nextHour(hour);
}

function buildCyclePeriods({ birthYear, startYear, monthPillar, forward, count }) {
  const monthIndex = JIAZI.indexOf(monthPillar);
  const 童限 = startYear > birthYear ? {
    起始年份: birthYear,
    结束年份: startYear - 1,
    起始虚岁: 1,
    结束虚岁: startYear - birthYear,
  } : null;
  const 大运 = Array.from({ length: count }, (_, index) => {
    const 起始年份 = startYear + index * 10;
    const 起始虚岁 = 起始年份 - birthYear + 1;
    const cycleIndex = (
      monthIndex + (forward ? index + 1 : -(index + 1)) + JIAZI.length
    ) % JIAZI.length;
    return {
      干支: JIAZI[cycleIndex],
      起始年份,
      结束年份: 起始年份 + 9,
      起始虚岁,
      结束虚岁: 起始虚岁 + 9,
      流年: Array.from({ length: 10 }, (_, flowIndex) => ({
        年份: 起始年份 + flowIndex,
        虚岁: 起始虚岁 + flowIndex,
        干支: ganzhiOfYear(起始年份 + flowIndex),
      })),
    };
  });
  return { 童限, 大运 };
}

function sect2SchoolDetails(solar, eightChar, genderCode, school, count) {
  const start = exactSect2Start(solar, eightChar, genderCode);
  const startSolar = addStartOffset(solar, start);
  const birthYear = solar.getYear();
  const periods = buildCyclePeriods({
    birthYear,
    startYear: startSolar.getYear(),
    monthPillar: eightChar.getMonth(),
    forward: start.forward,
    count,
  });
  return {
    sect: school.sect,
    折算法: school.折算法,
    起运年: start.year,
    起运月: start.month,
    起运日: start.day,
    起运时: start.hour,
    顺排: start.forward,
    起运公历: startSolar.toYmdHms(),
    出生年份: birthYear,
    ...periods,
  };
}

function luckCycles({ datetime, gender, count = DEFAULT_CYCLE_COUNT } = {}) {
  if (!isValidDateTime(datetime)) {
    throw new Error(`datetime 须为合法 Date 或民用时间值对象，收到：${datetime}`);
  }
  if (!Object.hasOwn(GENDER_CODES, gender)) {
    throw new Error(`gender 只能是 male 或 female，收到：${gender}`);
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_CYCLE_COUNT) {
    throw new Error(`count 须为 1~${MAX_CYCLE_COUNT} 的整数，收到：${count}`);
  }

  const solar = solarFromDateTime(datetime);
  const eightChar = solar.getLunar().getEightChar();
  return {
    性别: gender,
    起运精度: { ...START_PRECISION },
    起运流派: SECTS.map(school => (school.sect === 2
      ? sect2SchoolDetails(solar, eightChar, GENDER_CODES[gender], school, count)
      : schoolDetails(eightChar, GENDER_CODES[gender], school, count, solar.getYear()))),
  };
}

function annualCycle(targetYear, dayStem, dayBranch) {
  if (!Number.isInteger(targetYear)) throw new Error(`targetYear 须为整数，收到：${targetYear}`);
  if (targetYear < MIN_TARGET_YEAR || targetYear > MAX_TARGET_YEAR) {
    throw new Error(`targetYear 须在 ${MIN_TARGET_YEAR}~${MAX_TARGET_YEAR} 之间，收到：${targetYear}`);
  }
  if (!TIANGAN.includes(dayStem)) throw new Error(`日干必须是天干，收到：${dayStem}`);
  if (!DIZHI.includes(dayBranch)) throw new Error(`日支必须是地支，收到：${dayBranch}`);

  const 干支 = ganzhiOfYear(targetYear);
  const [天干, 地支] = 干支;
  return {
    年份: targetYear,
    干支,
    天干,
    地支,
    天干十神: shiShen(dayStem, 天干),
    与日支关系: relation(dayBranch, 地支),
    边界说明: '流年以立春为界，不以公历 1 月 1 日为界',
  };
}

module.exports = { luckCycles, annualCycle };
