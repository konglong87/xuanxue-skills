'use strict';

const { baziChart } = require('../../../core/calendar');
const { parseCivilDateTime } = require('../../../core/calendar/civil-time');
const { solarToLunar } = require('../../../core/calendar/lunar');
const { ziweiChart } = require('../../../core/ziwei');
const { disclaimerFor, EVIDENCE_RULES, FORBIDDEN_CLAIMS } = require('../../_shared/safety');
const { deepFreeze, isPlainObject } = require('../../_shared/lib/objects');
const { standardReport } = require('../../_shared/report');

const REQUIRED_FIELDS = Object.freeze([
  'birthDate',
  'birthTime',
  'longitude',
  'utcOffsetMinutes|standardMeridian',
  'gender',
]);
const QUESTIONS = Object.freeze({
  birthDate: '请补充出生日期（公历 YYYY-MM-DD）。',
  birthTime: '请补充出生时间（出生地民用时间 HH:mm，尽量精确到分钟）。',
  longitude: '请补充出生地经度（东经为正、西经为负）。',
  'utcOffsetMinutes|standardMeridian': '请补充出生当日 UTC 时区偏移分钟，或标准经线；历史时区和夏令时不能按今天猜测。',
  gender: '请补充性别（male 或 female），用于确定大限顺逆。',
});
const DISCLAIMER = disclaimerFor('命理', '婚恋', '财经');
const DEFAULT_TARGET_YEAR = 2026;
const INTERPRETATION_LIMIT = Object.freeze([
  '紫微斗数只输出符号结构、宫位主题和可核验倾向，不把星曜关系当作确定事实。',
  '不同安星、四化和闰月口径可能存在差异，报告必须保留采用规则。',
]);

function isMissing(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function missingFields(input) {
  const source = isPlainObject(input) ? input : {};
  return REQUIRED_FIELDS.filter(field => field === 'utcOffsetMinutes|standardMeridian'
    ? isMissing(source.utcOffsetMinutes) && isMissing(source.standardMeridian)
    : isMissing(source[field]));
}

function questionsFor(fields) {
  return fields.map(field => ({ field, question: QUESTIONS[field] }));
}

function buildInput(input, chart) {
  return {
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    longitude: input.longitude,
    utcOffsetMinutes: input.utcOffsetMinutes,
    standardMeridian: input.standardMeridian,
    gender: input.gender,
    solarPillars: chart.四柱结果,
  };
}

function extractZiweiInput(input, calculated) {
  const solar = parseCivilDateTime({ date: input.birthDate, time: input.birthTime });
  const reference = calculated.四柱结果.真太阳时信息?.真太阳时 || solar;
  const lunar = solarToLunar({
    year: reference.getFullYear(),
    month: reference.getMonth() + 1,
    day: reference.getDate(),
  });
  const yearPillar = calculated.四柱结果.年;
  const timePillar = calculated.四柱结果.时;
  return {
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    timeBranch: timePillar[1],
    yearStem: yearPillar[0],
    yearBranch: yearPillar[1],
    gender: input.gender,
    isLeapMonth: lunar.isLeap,
    lunar,
  };
}

function palaceByName(chart, name) {
  return chart.宫位.find(palace => palace.宫名 === name);
}

function signalFor(chart, name, topic) {
  const palace = palaceByName(chart, name);
  return {
    主题: topic,
    算出: `${name}位于${palace.天干}${palace.地支}，星曜为${palace.星曜.map(star => `${star.name}${star.四化 || ''}`).join('、') || '无主星'}；三方为${palace.关系.三方.join('、')}，对宫为${palace.关系.对宫}`,
    依据: '只引用已排出的宫位、星曜和四化；不把单星直接等同于现实事件。',
    可供判读: '可结合现实经历核验该主题的资源、压力和选择模式；证据不足时不作确定断语。',
  };
}

function analyze(input, options = {}) {
  const missing = missingFields(input);
  if (missing.length > 0) {
    return standardReport({
      status: 'needs_input',
      input: isPlainObject(input) ? input : {},
      missing,
      questions: questionsFor(missing),
      boundaries: DISCLAIMER,
    });
  }

  const calculated = baziChart({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    longitude: input.longitude,
    utcOffsetMinutes: input.utcOffsetMinutes,
    standardMeridian: input.standardMeridian,
    gender: input.gender,
    targetYear: Number.isInteger(options.targetYear) ? options.targetYear : DEFAULT_TARGET_YEAR,
    options: {
      dayBoundary: options.dayBoundary || '23:00',
      useTrueSolar: options.useTrueSolar !== false,
    },
  });
  const ziweiInput = extractZiweiInput(input, calculated);
  const chart = ziweiChart(ziweiInput);
  const signals = [
    signalFor(chart, '命宫', '自我与资源'),
    signalFor(chart, '夫妻宫', '关系互动'),
    signalFor(chart, '官禄宫', '事业角色'),
    signalFor(chart, '财帛宫', '财务习惯'),
  ];
  const report = standardReport({
    input: buildInput(input, calculated),
    calculated: [
      { 算出: `公历转换为${ziweiInput.lunar.中文}`, 依据: '复用仓库历法内核的公历转农历结果。' },
      { 算出: `命宫${chart.命身.命宫}、身宫${chart.命身.身宫}、${chart.五行局.name}`, 依据: chart.规则说明[0] },
      { 算出: `紫微在${chart.安星.紫微宫位}、天府在${chart.安星.天府宫位}`, 依据: chart.规则说明[1] },
      { 算出: `生年四化：${chart.安星.四化.map(item => `${item.星曜}${item.四化}`).join('、')}`, 依据: chart.规则说明[2] },
    ],
    evidence: [
      { 算出: `采用${calculated.四柱结果.采用规则.dayBoundary}换日和${calculated.四柱结果.采用规则.useTrueSolar ? '真太阳时' : '民用时间'}，生年柱${calculated.四柱结果.年}、时柱${calculated.四柱结果.时}`, 依据: '先用统一历法内核确定紫微输入，再进入紫微排盘；不得由模型改写。' },
      ...EVIDENCE_RULES.map(rule => ({ 算出: '标准判读规则', 依据: rule })),
    ],
    interpretation: signals,
    actions: [
      '把命宫、夫妻宫、官禄宫和财帛宫的倾向分别与真实经历核对，记录支持与不支持的证据。',
      '如需要深入婚恋或事业财运，转入对应领域技能，不从单一紫微符号推导决定。',
    ],
    boundaries: [...DISCLAIMER, ...INTERPRETATION_LIMIT, ...FORBIDDEN_CLAIMS.map(item => item.替代写法)],
    supplement: {
      skill: 'ziwei',
      version: 1,
      calculation: chart,
      rules: chart.规则说明,
    },
  });
  return deepFreeze(report);
}

module.exports = {
  DISCLAIMER,
  REQUIRED_FIELDS,
  analyze,
  missingFields,
};
