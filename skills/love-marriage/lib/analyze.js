const { marriageSignals } = require('../../../core/ganzhi/domains');
const { hehun } = require('../../../core/ganzhi/marriage');
const { analyze: analyzeBazi } = require('../../bazi/lib/analyze');
const {
  normalizeChart,
  REPORT_CONTRACT: QIMEN_REPORT_CONTRACT,
} = require('../../qimen/lib/chart');
const { EVIDENCE_RULES, REDLINES, disclaimerFor, FORBIDDEN_CLAIMS } = require('../../_shared/safety');

const REPORT_SECTIONS = Object.freeze([
  '输入与口径',
  '八字婚恋信号',
  '奇门可选增强',
  '现实核验与行动',
  '流派与限制',
  '免责声明',
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const REPORT_CONTRACT = deepFreeze({
  章节: [...REPORT_SECTIONS],
  disclaimer: [...disclaimerFor('婚恋')],
  evidenceRules: [...EVIDENCE_RULES],
  redlines: [...REDLINES.婚恋],
  禁止断语: FORBIDDEN_CLAIMS,
});
const QIMEN_SHARED_CONTRACT = deepFreeze({
  disclaimer: [...QIMEN_REPORT_CONTRACT.disclaimer],
  evidenceRules: [...QIMEN_REPORT_CONTRACT.evidenceRules],
  redlines: [...QIMEN_REPORT_CONTRACT.redlines],
  // 逐项浅拷贝：快照必须与 qimen 模块的常量互不共享引用
  禁止断语: QIMEN_REPORT_CONTRACT.禁止断语.map(item => ({ ...item })),
});

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function pillarsOf(calculation) {
  const source = calculation.四柱结果;
  return { 年: source.年, 月: source.月, 日: source.日, 时: source.时 };
}

function palaceRef(palace) {
  return { 宫数: palace.宫数, 方向: palace.方向.value };
}

function locationsOf(chart, stem, field) {
  return chart.九宫
    .filter(palace => palace[field].status === 'confirmed' && palace[field].value === stem)
    .map(palaceRef);
}

function locationProblem(layer, role, stem, locations) {
  if (locations.length === 1) return null;
  return `${layer}中${role} ${stem} 出现 ${locations.length} 次，须唯一确认后才能比较宫位。`;
}

function samePalace(left, right) {
  return left.宫数 === right.宫数;
}

function stemPairing(chart, dayStem) {
  const partnerStem = hehun(dayStem).所合之干;
  const dayLocations = {
    天盘: locationsOf(chart, dayStem, '天盘干'),
    地盘: locationsOf(chart, dayStem, '地盘干'),
  };
  const partnerLocations = {
    天盘: locationsOf(chart, partnerStem, '天盘干'),
    地盘: locationsOf(chart, partnerStem, '地盘干'),
  };
  const problems = [
    locationProblem('天盘', '日干', dayStem, dayLocations.天盘),
    locationProblem('地盘', '日干', dayStem, dayLocations.地盘),
    locationProblem('天盘', '所合之干', partnerStem, partnerLocations.天盘),
    locationProblem('地盘', '所合之干', partnerStem, partnerLocations.地盘),
  ].filter(Boolean);
  const samePalacePairs = [];

  if (problems.length === 0) {
    if (samePalace(dayLocations.天盘[0], partnerLocations.地盘[0])) {
      samePalacePairs.push({
        日干层: '天盘', 所合干层: '地盘', 宫位: { ...dayLocations.天盘[0] },
      });
    }
    if (samePalace(dayLocations.地盘[0], partnerLocations.天盘[0])) {
      samePalacePairs.push({
        日干层: '地盘', 所合干层: '天盘', 宫位: { ...dayLocations.地盘[0] },
      });
    }
  }

  return {
    日干: dayStem,
    所合之干: partnerStem,
    状态: problems.length > 0 ? '不足' : (samePalacePairs.length > 0 ? '同宫' : '分宫'),
    日干宫位: dayLocations,
    所合之干宫位: partnerLocations,
    同宫组合: samePalacePairs,
    问题: problems,
  };
}

function unionPalace(chart) {
  const candidates = chart.九宫
    .filter(palace => palace.八神.status === 'confirmed' && palace.八神.value === '六合')
    .map(palaceRef);
  return {
    状态: candidates.length === 1 ? '已确认' : '不足',
    候选: candidates,
  };
}

function observedHarms(chart) {
  const observations = [];
  chart.九宫.forEach(palace => {
    const 宫位 = palaceRef(palace);
    ['天盘干', '地盘干'].forEach(field => {
      if (palace[field].status === 'confirmed' && palace[field].value === '庚') {
        observations.push({ 名称: '庚', 宫位: { ...宫位 }, 来源字段: field });
      }
    });
    if (palace.八神.status === 'confirmed' && palace.八神.value === '白虎') {
      observations.push({ 名称: '白虎', 宫位: { ...宫位 }, 来源字段: '八神' });
    }
    palace.标记.forEach(marker => {
      if (marker.名称.status !== 'confirmed') return;
      observations.push({
        名称: marker.名称.value,
        宫位: { ...宫位 },
        来源字段: '标记',
        provenance: { ...marker.provenance },
      });
    });
  });
  return observations;
}

function qimenContext(transcribed, dayStem, alternateDayStem) {
  const normalized = normalizeChart(transcribed);
  if (!normalized.safeChart || normalized.errors.length > 0) {
    return { status: 'degraded', errors: normalized.errors.map(error => ({ ...error })) };
  }
  const chart = normalized.safeChart;
  return {
    status: 'ready',
    输入来源: {
      类型: chart.来源.类型.value,
      名称: { ...chart.来源.名称 },
    },
    干合宫位: stemPairing(chart, dayStem),
    另一派干合宫位: alternateDayStem
      ? stemPairing(chart, alternateDayStem)
      : null,
    六合宫: unionPalace(chart),
    六害观察: observedHarms(chart),
    共享安全契约: QIMEN_SHARED_CONTRACT,
  };
}

function signalsOf(calculation, gender) {
  return marriageSignals(pillarsOf(calculation), {
    gender,
    targetGanzhi: calculation.目标流年.干支,
  });
}

function analyze(input, options) {
  if (!isPlainObject(input)) throw new Error('input 必须是非数组的普通对象');
  const hasQimen = Object.prototype.hasOwnProperty.call(input, 'qimen');
  const { qimen, ...baziInput } = input;
  const bazi = analyzeBazi(baziInput, options);
  if (bazi.status !== 'ready') return bazi;

  const marriage = signalsOf(bazi.calculation, bazi.input.gender);
  const alternateMarriage = bazi.alternateCalculation
    ? signalsOf(bazi.alternateCalculation, bazi.input.gender)
    : null;
  const qimenEnhancement = hasQimen
    ? qimenContext(
      qimen,
      bazi.calculation.命盘详情.日主.天干,
      bazi.alternateCalculation?.命盘详情.日主.天干 ?? null,
    )
    : { status: 'not_provided' };

  return {
    status: 'ready',
    bazi,
    marriageSignals: marriage,
    alternateMarriageSignals: alternateMarriage,
    qimenEnhancement,
    analysisContext: {
      八字分析上下文: bazi.analysisContext,
      报告契约: REPORT_CONTRACT,
      奇门边界: '奇门仅使用 errors 为空的 safeChart；审计原词不进入判读，宫位缺失或重复时保留“不足”，不猜寄宫。',
    },
  };
}

module.exports = {
  REPORT_CONTRACT,
  REPORT_SECTIONS,
  analyze,
};
