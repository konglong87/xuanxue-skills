'use strict';
const { solarToLunar, trueSolarTime, ganzhiYearOf } = require('../calendar');
const { parseCivilDateTime, addDateTimeDays, dateTimeValueOf, dateFromTimeValue } = require('../calendar/civil-time');
const { TIANGAN, DIZHI } = require('../ganzhi/constants');
const { DAY_BOUNDARIES, YEAR_BOUNDARIES } = require('./policy');
const { normalizeBirthInput } = require('./birth-input');
const { ziweiChart } = require('./chart');
const { deepFreeze } = require('../_shared/objects');

const MINUTE_MS = 60_000;
const TERM_OFFSET_MINUTES = 480; // core/calendar solar terms are expressed in Beijing wall time.
const GANZHI_EPOCH_YEAR = 4;
function atYear(year) {
  const ordinal = ((year - GANZHI_EPOCH_YEAR) % 60 + 60) % 60;
  return { yearStem: TIANGAN[ordinal % TIANGAN.length], yearBranch: DIZHI[ordinal % DIZHI.length] };
}
function prepareTime(input) {
  const civil = parseCivilDateTime({ date: input.birthDate, time: input.birthTime });
  // Validate and resolve timezone even when using uncorrected civil time.
  const solar = trueSolarTime({ datetime: civil, longitude: input.longitude,
    utcOffsetMinutes: input.utcOffsetMinutes, standardMeridian: input.standardMeridian });
  const offset = input.utcOffsetMinutes ?? input.standardMeridian * 4;
  const termClock = dateFromTimeValue(civil, dateTimeValueOf(civil) + (TERM_OFFSET_MINUTES - offset) * MINUTE_MS);
  return { civil, solar, lichunYear: ganzhiYearOf(termClock) };
}
function calculateVariant(input, time, policies) {
  const reference = policies.useTrueSolar ? time.solar.真太阳时 : time.civil;
  const advance = policies.dayBoundary === '23:00' && reference.getHours() >= 23;
  const date = addDateTimeDays(reference, advance ? 1 : 0);
  const lunar = solarToLunar({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
  const year = policies.yearBoundary === 'lunar-new-year' ? lunar.year : time.lichunYear;
  const timeBranch = DIZHI[Math.floor(((reference.getHours() + 1) % 24) / 2)];
  const chart = ziweiChart({ lunarMonth: lunar.month, lunarDay: lunar.day, timeBranch, ...atYear(year),
    gender: input.gender, isLeapMonth: lunar.isLeap, options: policies });
  return {
    calendar: { civilTime: time.civil.toString(), referenceTime: reference.toString(),
      lunarDateReference: date.toString().slice(0, 10), lunar, year, timeBranch,
      trueSolar: policies.useTrueSolar ? { standardMeridian: time.solar.标准经线, offsetMinutes: time.solar.总偏移分钟 } : null },
    calculation: chart,
  };
}
function birthChart(input, options) {
  const normalized = normalizeBirthInput(input, options);
  if (normalized.missing.length) throw new Error('出生资料不完整，不能排盘');
  const source = normalized.input;
  const policies = normalized.policies;
  const time = prepareTime(source);
  const selected = calculateVariant(source, time, policies);
  const alternatives = [];
  for (const dayBoundary of DAY_BOUNDARIES) {
    for (const yearBoundary of YEAR_BOUNDARIES) {
      if (dayBoundary === policies.dayBoundary && yearBoundary === policies.yearBoundary) continue;
      const variant = calculateVariant(source, time, { ...policies, dayBoundary, yearBoundary });
      alternatives.push({ policies: variant.calculation.采用规则,
        differs: JSON.stringify(variant.calculation.输入) !== JSON.stringify(selected.calculation.输入), ...variant });
    }
  }
  return deepFreeze({ input: source, policies, ...selected, alternatives,
    verification: { status: 'passed', comparedPolicies: alternatives.length + 1,
      note: '四种已支持年界/日界组合均完整计算并通过结构校验；不是所有流派的准确性保证。' } });
}
module.exports = { birthChart };
