const { tenGodStructure } = require('../../../core/ganzhi');
const { analyze: analyzeBazi } = require('../../bazi/lib/analyze');
const {
  normalizeChart,
  REPORT_CONTRACT: QIMEN_REPORT_CONTRACT,
} = require('../../qimen/lib/chart');
const { EVIDENCE_RULES, REDLINES, disclaimerFor, FORBIDDEN_CLAIMS } = require('../../_shared/safety');
const { INDUSTRY_SYMBOL_SEEDS, OPEN_MAPPING_NOTE } = require('./industry');

const REPORT_SECTIONS = Object.freeze([
  '输入与口径',
  '八字事业财运信号',
  '职业组合与限制',
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
  disclaimer: [...disclaimerFor('财经')],
  evidenceRules: [...EVIDENCE_RULES],
  redlines: [...REDLINES.财经],
  禁止断语: FORBIDDEN_CLAIMS,
});
const QIMEN_SHARED_CONTRACT = deepFreeze({
  disclaimer: [...QIMEN_REPORT_CONTRACT.disclaimer],
  evidenceRules: [...QIMEN_REPORT_CONTRACT.evidenceRules],
  redlines: [...QIMEN_REPORT_CONTRACT.redlines],
  // 逐项浅拷贝：快照必须与 qimen 模块的常量互不共享引用
  禁止断语: QIMEN_REPORT_CONTRACT.禁止断语.map(item => ({ ...item })),
});

const TEN_GOD_GROUPS = deepFreeze({
  财: ['正财', '偏财'],
  官杀: ['正官', '七杀'],
  印: ['正印', '偏印'],
  食伤: ['食神', '伤官'],
  比劫: ['比肩', '劫财'],
});
const TEN_GOD_MEANINGS = deepFreeze({
  财: {
    十神: ['正财', '偏财'],
    收益面: '资源掌控',
    代价面: '占有与维护资源会持续消耗注意力和成本',
    边界: '双向语义只作为待核验假设，不是对现实财富或结果的确定判断。',
  },
  官杀: {
    十神: ['正官', '七杀'],
    收益面: '规则、压力与塑形机会',
    代价面: '被约束的同时也会被环境重塑',
    边界: '双向语义只作为待核验假设，不是对现实职位或压力事件的确定判断。',
  },
  印: {
    十神: ['正印', '偏印'],
    收益面: '支持、名声与学术背景',
    代价面: '获取支持也会占用环境资源并形成依赖成本',
    边界: '双向语义只作为待核验假设，不是对贵人或学历事实的确定判断。',
  },
  食伤: {
    十神: ['食神', '伤官'],
    收益面: '产出、创意与表达',
    代价面: '持续产出与表达会消耗精力',
    边界: '双向语义只作为待核验假设，不是对才华或业绩的确定判断。',
  },
  比劫: {
    十神: ['比肩', '劫财'],
    收益面: '同侪合作',
    代价面: '同侪也可能形成资源竞争',
    边界: '双向语义只作为待核验假设，不是对同事行为的确定判断。',
  },
});

const CAREER_COMBINATIONS = deepFreeze([
  {
    id: 'partial-wealth-seven-killings',
    名称: '偏财与七杀',
    类型: '创业型',
    赛道: '高风险开拓、复杂经营、资本运作与新市场探索',
    条件组: [['偏财'], ['七杀']],
  },
  {
    id: 'hurting-officer-partial-wealth',
    名称: '伤官与偏财',
    类型: '创意技术型',
    赛道: '技术创新、独立开发、创意设计与内容业务',
    条件组: [['伤官'], ['偏财']],
  },
  {
    id: 'eating-god-seven-killings',
    名称: '食神与七杀',
    类型: '对抗型人才',
    赛道: '危机处理、攻坚、法律博弈与高压风险管理',
    条件组: [['食神'], ['七杀']],
  },
  {
    id: 'partial-wealth-direct-resource',
    名称: '偏财与正印',
    类型: '名利协同型',
    赛道: '资源经营与社会声望协同',
    条件组: [['偏财'], ['正印']],
  },
  {
    id: 'peer-wealth-competition',
    名称: '比肩或劫财',
    类型: '身体执行型',
    赛道: '运动、体力劳动与身体执行行业',
    条件组: [['比肩', '劫财']],
  },
  {
    id: 'resource-stars',
    名称: '印星',
    类型: '学术型',
    赛道: '高等学问、理论与深入研究',
    条件组: [['正印', '偏印']],
  },
]);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function pillarsOf(calculation) {
  const source = calculation.四柱结果;
  return { 年: source.年, 月: source.月, 日: source.日, 时: source.时 };
}

function positionsFor(structure, godNames, scope) {
  return godNames.flatMap(十神 => {
    const positions = scope === 'visible-only'
      ? structure.十神[十神].显干.map(item => ({ ...item, 层: '天干' }))
      : structure.十神[十神].位置;
    return positions.map(position => ({ 十神, ...position }));
  });
}

function summarizedScope(positions) {
  return {
    positions,
    count: positions.length,
    present: positions.length > 0,
  };
}

function groupedTenGods(structure) {
  return Object.fromEntries(Object.entries(TEN_GOD_GROUPS).map(([name, gods]) => {
    const visible = positionsFor(structure, gods, 'visible-only');
    const all = positionsFor(structure, gods, 'all-positions');
    return [name, {
      十神: [...gods],
      visibleOnly: summarizedScope(visible),
      allPositions: summarizedScope(all),
    }];
  }));
}

function evidenceFor(structure, conditionGroup, scope) {
  const positions = positionsFor(structure, conditionGroup, scope);
  const matched = conditionGroup.filter(god => positions.some(item => item.十神 === god));
  return {
    任选十神: [...conditionGroup],
    命中: matched.length > 0,
    命中十神: matched,
    位置: positions,
  };
}

function scopeResult(structure, conditionGroups, scope) {
  const evidence = conditionGroups.map(group => evidenceFor(structure, group, scope));
  return { 命中: evidence.every(group => group.命中), 分组证据: evidence };
}

function careerCombinations(structure) {
  return CAREER_COMBINATIONS.map(definition => ({
    id: definition.id,
    名称: definition.名称,
    类型: definition.类型,
    赛道: definition.赛道,
    条件组: definition.条件组.map(group => [...group]),
    口径结果: {
      'visible-only': scopeResult(structure, definition.条件组, 'visible-only'),
      'all-positions': scopeResult(structure, definition.条件组, 'all-positions'),
    },
  }));
}

function signalsOf(calculation) {
  const structure = tenGodStructure(pillarsOf(calculation));
  return {
    日主: structure.日主,
    十神结构: structure,
    十神分组: groupedTenGods(structure),
    职业组合: careerCombinations(structure),
    口径: 'visibleOnly 只含原局年、月、时天干；allPositions 再加入四支藏干。两者均不加权，不代表旺衰、等级、收入或必然适职。',
  };
}

function palaceRef(palace) {
  return { 宫数: palace.宫数, 方向: palace.方向.value };
}

function createQimenChartContext(chart) {
  const 同宫标记摘要表 = {};
  const markerSummaryByPalace = new Map();
  chart.九宫.forEach((palace, palaceIndex) => {
    const summaryRef = `qimen:九宫[${palaceIndex}].标记`;
    const entries = palace.标记.flatMap(marker => {
      if (marker.名称.status !== 'confirmed') return [];
      const 名称 = marker.名称.value;
      const provenance = { ...marker.provenance };
      return [{ 名称, provenanceRef: provenance.provenanceRef, provenance }];
    });
    同宫标记摘要表[summaryRef] = entries.map(({ 名称, provenanceRef }) => ({
      名称,
      provenanceRef,
    }));
    markerSummaryByPalace.set(palace, { count: entries.length, summaryRef, entries });
  });
  return { chart, 同宫标记摘要表, markerSummaryByPalace };
}

function markerSummary(context, palace, excludedRef = null) {
  const { count, summaryRef } = context.markerSummaryByPalace.get(palace);
  return excludedRef ? { count, summaryRef, excludedRef } : { count, summaryRef };
}

function palaceObservation(context, palace, fields, excludedRef = null) {
  return {
    ...fields,
    宫位: palaceRef(palace),
    同宫标记摘要: markerSummary(context, palace, excludedRef),
  };
}

function palaceCandidate(context, palace) {
  return {
    ...palaceRef(palace),
    同宫标记摘要: markerSummary(context, palace),
  };
}

function observationItem(id, 名称, status, options = {}) {
  return {
    id,
    名称,
    status,
    observations: options.observations ?? [],
    problems: options.problems ?? [],
    requiredContext: options.requiredContext ?? [],
    limitation: options.limitation ?? null,
  };
}

function palaceObservations(context, field, value, symbol) {
  return context.chart.九宫
    .filter(palace => palace[field].status === 'confirmed' && palace[field].value === value)
    .map(palace => palaceObservation(context, palace, { 符号: symbol, 来源字段: field }));
}

function uniqueObservation(id, name, context, field, value, symbol = value) {
  const observations = palaceObservations(context, field, value, symbol);
  const problems = observations.length === 1
    ? []
    : [`${field}中${symbol}出现 ${observations.length} 次，须唯一确认后才能使用。`];
  return observationItem(id, name, problems.length === 0 ? 'chart-supported' : 'ambiguous', {
    observations,
    problems,
  });
}

function wuItem(context) {
  const layers = ['天盘干', '地盘干'];
  const observations = layers.flatMap(field => palaceObservations(context, field, '戊', '戊'));
  const problems = layers.flatMap(field => {
    const count = observations.filter(item => item.来源字段 === field).length;
    return count === 1 ? [] : [`${field}中戊出现 ${count} 次，须唯一确认后才能使用。`];
  });
  return observationItem('capital-wu', '戊', problems.length === 0 ? 'chart-supported' : 'ambiguous', {
    observations,
    problems,
  });
}

function monthCommandItem(chart) {
  return observationItem('month-command', '月令', 'chart-supported', {
    observations: [{
      来源字段: '月令',
      值: chart.月令.value,
      provenance: { ...chart.月令.provenance },
    }],
    limitation: '仅保留外部局盘月令原值；仓内没有月令生克或成本推导算法。',
  });
}

function requiredItem(id, name, contexts, limitation) {
  return observationItem(id, name, 'needs_context', {
    requiredContext: contexts,
    limitation,
  });
}


function unsupportedItem(id, name, limitation) {
  return observationItem(id, name, 'unsupported', { limitation });
}

function markerObservations(context, markerName) {
  return context.chart.九宫.flatMap(palace => {
    const summary = context.markerSummaryByPalace.get(palace);
    return summary.entries
      .filter(entry => entry.名称 === markerName)
      .map(entry => palaceObservation(context, palace, {
        符号: markerName,
        来源字段: '标记',
        provenance: { ...entry.provenance },
      }, entry.provenanceRef));
  });
}

function gengTigerItem(context) {
  const categories = [
    { 来源字段: '天盘干', 符号: '庚', observations: palaceObservations(context, '天盘干', '庚', '庚') },
    { 来源字段: '地盘干', 符号: '庚', observations: palaceObservations(context, '地盘干', '庚', '庚') },
    { 来源字段: '八神', 符号: '白虎', observations: palaceObservations(context, '八神', '白虎', '白虎') },
    { 来源字段: '标记', 符号: '虎', observations: markerObservations(context, '虎') },
  ];
  const observations = categories.flatMap(category => category.observations);
  const problems = categories.flatMap(category => category.observations.length === 1
    ? []
    : [`${category.来源字段}中${category.符号}出现 ${category.observations.length} 次，必须独立唯一确认。`]);
  return observationItem('geng-tiger', '庚/虎', problems.length === 0 ? 'chart-supported' : 'ambiguous', {
    observations,
    problems,
    limitation: '庚天盘、庚地盘、白虎八神与原始虎标记分别保留，不互相等同。',
  });
}

function chiefObservation(context, role, headerField, palaceField) {
  const { chart } = context;
  const value = chart[headerField].value;
  const palaces = chart.九宫
    .filter(palace => palace[palaceField].status === 'confirmed' && palace[palaceField].value === value)
    .map(palace => palaceCandidate(context, palace));
  return {
    observation: { 角色: role, 盘头值: value, 来源字段: palaceField, 候选宫位: palaces },
    problem: palaces.length === 1
      ? null
      : `${role}盘头值 ${value} 在${palaceField}中出现 ${palaces.length} 次，须唯一确认。`,
  };
}

function chiefsItem(context) {
  const candidates = [
    chiefObservation(context, '值符', '值符', '九星'),
    chiefObservation(context, '值使', '值使', '八门'),
  ];
  const problems = candidates.map(item => item.problem).filter(Boolean);
  return observationItem('chiefs', '符使', problems.length === 0 ? 'chart-supported' : 'ambiguous', {
    observations: candidates.map(item => item.observation),
    problems,
    limitation: '仅定位盘头九星与八门候选，不推导领导支持或协调结果。',
  });
}

function wealthItems(context) {
  return [
    wuItem(context),
    uniqueObservation('profit-door', '生门', context, '八门', '生', '生门'),
    uniqueObservation('union', '六合', context, '八神', '六合'),
    monthCommandItem(context.chart),
    requiredItem('industry', '行业', ['用户当前行业或目标岗位', '采用的行业取象符号与来源'], '外部局盘不包含用户行业语境。'),
    requiredItem('execution', '实干', ['现实市场需求', '平台与资源承载条件'], '实干需要现实机会、平台和需求证据，不能只由局盘确定。'),
    unsupportedItem('stem-wealth', '干财', '仓内没有日干财、生年财及资源控制深度的确定性算法。'),
  ];
}

function careerItems(context) {
  return [
    uniqueObservation('open-door', '开门', context, '八门', '开', '开门'),
    uniqueObservation('scenery-door', '景门', context, '八门', '景', '景门'),
    uniqueObservation('black-tortoise', '玄武', context, '八神', '玄武'),
    gengTigerItem(context),
    requiredItem('industry', '行业', ['用户当前行业或目标岗位', '采用的行业取象符号与来源'], '外部局盘不包含岗位适配语境。'),
    chiefsItem(context),
    unsupportedItem('people-stems', '诸干', 'qimen DTO 不含起局年干、月干、时干；不得以出生八字干支替代。'),
  ];
}

function qimenContext(transcribed) {
  const normalized = normalizeChart(transcribed);
  if (!normalized.safeChart || normalized.errors.length > 0) {
    return { status: 'degraded', errors: normalized.errors.map(error => ({ ...error })) };
  }
  const chart = normalized.safeChart;
  const context = createQimenChartContext(chart);
  return {
    status: 'ready',
    输入来源: {
      类型: chart.来源.类型.value,
      名称: { ...chart.来源.名称 },
    },
    同宫标记摘要表: context.同宫标记摘要表,
    // 行业取象种子与七项表并列，不挂进单个 item —— 七项必须保持统一 DTO。
    行业取象种子: INDUSTRY_SYMBOL_SEEDS,
    行业取象说明: OPEN_MAPPING_NOTE,
    财富七项: wealthItems(context),
    事业七项: careerItems(context),
    共享安全契约: QIMEN_SHARED_CONTRACT,
  };
}

function analyze(input, options) {
  if (!isPlainObject(input)) throw new Error('input 必须是非数组的普通对象');
  const hasQimen = Object.prototype.hasOwnProperty.call(input, 'qimen');
  const { qimen, ...baziInput } = input;
  const bazi = analyzeBazi(baziInput, options);
  if (bazi.status !== 'ready') return bazi;

  return {
    status: 'ready',
    bazi,
    wealthCareerSignals: signalsOf(bazi.calculation),
    alternateWealthCareerSignals: bazi.alternateCalculation
      ? signalsOf(bazi.alternateCalculation)
      : null,
    qimenEnhancement: hasQimen ? qimenContext(qimen) : { status: 'not_provided' },
    analysisContext: {
      八字分析上下文: bazi.analysisContext,
      报告契约: REPORT_CONTRACT,
      十神双向语义: TEN_GOD_MEANINGS,
      八字边界: '只列原局十神位置与资料组合，不据计数裁决旺衰、等级、收入或必然适职。',
      奇门边界: '奇门只使用 errors 为空的 safeChart 并记录盘面事实；审计原词不进入判读，缺失或重复保留 ambiguous，不推出现实事件。',
    },
  };
}

module.exports = {
  CAREER_COMBINATIONS,
  REPORT_CONTRACT,
  REPORT_SECTIONS,
  TEN_GOD_GROUPS,
  TEN_GOD_MEANINGS,
  analyze,
};
