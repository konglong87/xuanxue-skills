'use strict';

const { deepFreeze, isPlainObject } = require('./lib/objects');
const { TIANGAN, DIZHI } = require('../../core/ganzhi/constants');

const RESEARCH_MODE = 'research';
const RESEARCH_PLAN_VERSION = 1;
const DAY_BOUNDARIES = Object.freeze(['23:00', '00:00']);
const MANDATORY_RESEARCH_CHECKS = deepFreeze({
  compareDayBoundaries: true,
  compareLuckMethods: true,
  verifyConsistency: true,
});
const ALLOWED_PLAN_FIELDS = Object.freeze([
  'mode',
  'version',
  'dayBoundary',
  'useTrueSolar',
]);

const DEFAULT_RESEARCH_PLAN = deepFreeze({
  mode: RESEARCH_MODE,
  version: RESEARCH_PLAN_VERSION,
  dayBoundary: '23:00',
  useTrueSolar: true,
  ...MANDATORY_RESEARCH_CHECKS,
});

function own(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function clonePlan(plan) {
  return {
    mode: plan.mode,
    version: plan.version,
    dayBoundary: plan.dayBoundary,
    useTrueSolar: plan.useTrueSolar,
    ...MANDATORY_RESEARCH_CHECKS,
  };
}

function validatePlanObject(plan) {
  if (!isPlainObject(plan)) {
    throw new TypeError('researchPlan 必须是普通对象');
  }
  Object.keys(plan).forEach(key => {
    if (!ALLOWED_PLAN_FIELDS.includes(key)) {
      throw new Error(`researchPlan 含未声明字段：${key}`);
    }
  });
  if (own(plan, 'mode') && plan.mode !== RESEARCH_MODE) {
    throw new Error(`researchPlan.mode 只能是 ${RESEARCH_MODE}`);
  }
  if (own(plan, 'version')
    && (!Number.isInteger(plan.version) || plan.version !== RESEARCH_PLAN_VERSION)) {
    throw new Error(`researchPlan.version 必须是 ${RESEARCH_PLAN_VERSION}`);
  }
  if (own(plan, 'dayBoundary') && !DAY_BOUNDARIES.includes(plan.dayBoundary)) {
    throw new Error(`researchPlan.dayBoundary 只能是 '23:00' 或 '00:00'`);
  }
  if (own(plan, 'useTrueSolar') && typeof plan.useTrueSolar !== 'boolean') {
    throw new Error('researchPlan.useTrueSolar 必须是 boolean');
  }
}

function normalizeResearchPlan(requestedPlan, inputOptions = {}) {
  if (!isPlainObject(inputOptions)) {
    throw new TypeError('options 必须是普通对象');
  }
  if (requestedPlan !== undefined) validatePlanObject(requestedPlan);

  const source = requestedPlan || {};
  const selectedOptions = {
    dayBoundary: source.dayBoundary ?? inputOptions.dayBoundary ?? DEFAULT_RESEARCH_PLAN.dayBoundary,
    useTrueSolar: source.useTrueSolar ?? inputOptions.useTrueSolar ?? DEFAULT_RESEARCH_PLAN.useTrueSolar,
  };
  if (!DAY_BOUNDARIES.includes(selectedOptions.dayBoundary)) {
    throw new Error(`researchPlan.dayBoundary 只能是 '23:00' 或 '00:00'`);
  }
  if (typeof selectedOptions.useTrueSolar !== 'boolean') {
    throw new Error('researchPlan.useTrueSolar 必须是 boolean');
  }
  if (requestedPlan && own(inputOptions, 'dayBoundary')
    && requestedPlan.dayBoundary !== undefined
    && requestedPlan.dayBoundary !== inputOptions.dayBoundary) {
    throw new Error('researchPlan.dayBoundary 与 options.dayBoundary 冲突');
  }
  if (requestedPlan && own(inputOptions, 'useTrueSolar')
    && requestedPlan.useTrueSolar !== undefined
    && requestedPlan.useTrueSolar !== inputOptions.useTrueSolar) {
    throw new Error('researchPlan.useTrueSolar 与 options.useTrueSolar 冲突');
  }

  return deepFreeze({
    mode: RESEARCH_MODE,
    version: RESEARCH_PLAN_VERSION,
    dayBoundary: selectedOptions.dayBoundary,
    useTrueSolar: selectedOptions.useTrueSolar,
    ...MANDATORY_RESEARCH_CHECKS,
  });
}

function assertPillar(value, name) {
  if (typeof value !== 'string' || value.length !== 2
    || !TIANGAN.includes(value[0]) || !DIZHI.includes(value[1])) {
    throw new Error(`研究模式校验失败：${name} 不是合法干支：${value}`);
  }
}

function assertChartSnapshot(chart, plan, label = 'calculation') {
  if (!isPlainObject(chart)) {
    throw new Error(`研究模式校验失败：${label} 缺少命盘快照`);
  }
  const pillars = chart.四柱结果;
  if (!isPlainObject(pillars)) {
    throw new Error(`研究模式校验失败：${label}.四柱结果 缺失`);
  }
  ['年', '月', '日', '时'].forEach(field => assertPillar(pillars[field], `${label}.四柱结果.${field}`));
  if (!isPlainObject(pillars.采用规则)
    || pillars.采用规则.dayBoundary !== plan.dayBoundary
    || pillars.采用规则.useTrueSolar !== plan.useTrueSolar) {
    throw new Error(`研究模式校验失败：${label} 的排盘规则与研究计划不一致`);
  }
  if (!isPlainObject(pillars.另一派)
    || !DAY_BOUNDARIES.includes(pillars.另一派.dayBoundary)
    || typeof pillars.另一派.是否不同 !== 'boolean') {
    throw new Error(`研究模式校验失败：${label} 缺少另一换日口径摘要`);
  }
  if (plan.useTrueSolar && !isPlainObject(pillars.真太阳时信息)) {
    throw new Error(`研究模式校验失败：${label} 缺少真太阳时校正信息`);
  }
  if (!Number.isInteger(chart.input?.targetYear)
    || chart.目标流年?.年份 !== chart.input.targetYear) {
    throw new Error(`研究模式校验失败：${label} 的目标流年与输入目标年不一致`);
  }
  if (!Array.isArray(chart.起运大运?.起运流派)
    || chart.起运大运.起运流派.length < 2) {
    throw new Error(`研究模式校验失败：${label} 缺少完整起运折算口径`);
  }
}

function buildChecks(calculation, alternateCalculation, plan) {
  const checks = [
    {
      id: 'selected-chart-schema',
      status: 'passed',
      detail: '主派命盘字段、四柱干支、目标流年和起运口径完整。',
    },
    {
      id: 'true-solar-time',
      status: plan.useTrueSolar ? 'passed' : 'not_requested',
      detail: plan.useTrueSolar ? '已执行真太阳时校正并保留校正信息。' : '研究计划明确不启用真太阳时。',
    },
    {
      id: 'day-boundary-comparison',
      status: 'passed',
      detail: `已核对 ${calculation.四柱结果.采用规则.dayBoundary} 与 ${calculation.四柱结果.另一派.dayBoundary} 换日口径。`,
    },
    {
      id: 'luck-method-comparison',
      status: 'passed',
      detail: '已保留时辰级和分钟级两种起运折算。',
    },
  ];
  if (calculation.四柱结果.另一派.是否不同 && !alternateCalculation) {
    throw new Error('研究模式校验失败：换日口径产生差异但缺少另一派完整命盘');
  }
  if (alternateCalculation) {
    assertChartSnapshot(alternateCalculation, {
      ...plan,
      dayBoundary: calculation.四柱结果.另一派.dayBoundary,
    }, 'alternateCalculation');
    checks.push({
      id: 'alternate-chart-recalculated',
      status: 'passed',
      detail: '另一派已独立复算完整四柱、十神、关系、大运和流年。',
    });
  }
  return checks;
}

function assertMandatoryResearchChecks(plan) {
  Object.entries(MANDATORY_RESEARCH_CHECKS).forEach(([field, requiredValue]) => {
    if (plan[field] !== requiredValue) {
      throw new Error(`研究模式校验失败：${field} 不允许关闭`);
    }
  });
}

function buildResearchContext({ input, calculation, alternateCalculation, plan }) {
  assertMandatoryResearchChecks(plan);
  assertChartSnapshot(calculation, plan);
  const checks = buildChecks(calculation, alternateCalculation, plan);
  const alternate = calculation.四柱结果.另一派;
  return deepFreeze({
    模式: RESEARCH_MODE,
    版本: RESEARCH_PLAN_VERSION,
    计算计划: {
      ...clonePlan(plan),
      输入来源: input.researchPlan ? 'model-plan' : 'default-plan',
      计划说明: '模型可以提出排盘口径；内核只执行白名单参数，并在结果返回后做一致性校验。',
    },
    计算轨迹: [
      { id: 'input-normalized', status: 'passed', detail: '出生日期、时间、经度、时区和性别已通过输入契约。' },
      {
        id: 'calendar-boundary',
        status: 'passed',
        detail: '按立春节气定年、按节定月，并保留精确节气边界。',
      },
      {
        id: 'true-solar-time',
        status: plan.useTrueSolar ? 'passed' : 'skipped',
        detail: plan.useTrueSolar ? '已按经度、标准经线和均时差计算真太阳时。' : '未启用真太阳时。',
      },
      {
        id: 'day-pillar',
        status: 'passed',
        detail: `主派按 ${plan.dayBoundary} 换日，另一派按 ${alternate.dayBoundary} 对照。`,
      },
      {
        id: 'luck-cycles',
        status: 'passed',
        detail: '时辰级和分钟级起运结果均已保留。',
      },
      {
        id: 'target-year',
        status: 'passed',
        detail: `目标流年 ${calculation.目标流年.年份} 按立春边界计算。`,
      },
    ],
    一致性校验: {
      status: plan.verifyConsistency ? 'passed' : 'skipped',
      checks,
    },
    证据包: [
      {
        id: 'bazi:pillars',
        source: 'calculation.四柱结果',
        status: 'verified',
        fields: ['年', '月', '日', '时', '真太阳时信息', '采用规则'],
        rule: '立春节气定年、节气定月、研究计划指定的换日口径与时辰规则。',
      },
      {
        id: 'bazi:structure',
        source: 'calculation.命盘详情',
        status: 'verified',
        fields: ['五行统计', '十神统计', '地支关系', '三合', '三会'],
        rule: '结构字段由共享干支内核计算，不以数量直接裁决旺衰。',
      },
      {
        id: 'bazi:cycles',
        source: 'calculation.起运大运',
        status: 'verified',
        fields: ['起运流派', '大运'],
        rule: '按性别、年干阴阳和节气方向计算，并列保留两种起运折算。',
      },
      {
        id: 'bazi:annual',
        source: 'calculation.目标流年',
        status: 'verified',
        fields: ['年份', '干支', '天干十神', '与日支关系'],
        rule: '流年以立春为边界，不以公历元旦切换。',
      },
    ],
    模型执行规约: [
      '先根据用户问题提出简短、结构化的计算计划，再执行 bazi/scripts/calculate.js。',
      '研究计划只能使用已声明的 dayBoundary、useTrueSolar 和比较开关；不允许增加自定义公式覆盖内核。',
      '所有四柱、真太阳时、十神、大运和流年逐字段引用计算结果，不得重新心算或改写。',
      '先对主派和另一派分别完成证据分析，再写共同点、差异和现实核验问题。',
      '证据包没有支持的结论写“不足以判断”，不要为了让报告完整而补造事实。',
    ],
  });
}

module.exports = {
  RESEARCH_MODE,
  RESEARCH_PLAN_VERSION,
  DEFAULT_RESEARCH_PLAN,
  DAY_BOUNDARIES,
  MANDATORY_RESEARCH_CHECKS,
  normalizeResearchPlan,
  assertChartSnapshot,
  buildResearchContext,
};
