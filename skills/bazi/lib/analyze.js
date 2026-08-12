const { baziChart } = require('../../../core/calendar');
const { DISCLAIMER_BASE } = require('../../_shared/safety');

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const REQUIRED_FIELDS = Object.freeze([
  'birthDate',
  'birthTime',
  'longitude',
  'utcOffsetMinutes|standardMeridian',
  'gender',
]);

const REPORT_SECTIONS = Object.freeze([
  '综合',
  '性格与资源',
  '事业财运概览',
  '婚恋概览',
  '阶段趋势',
  '流派差异',
  '免责声明',
]);

const QUESTIONS = Object.freeze({
  birthDate: '请补充出生日期（公历 YYYY-MM-DD）。',
  birthTime: '请补充出生时间（出生地民用时间 HH:mm，尽量精确到分钟）。',
  longitude: '请补充出生地经度（东经为正、西经为负）；提供出生城市也可以先据此查询。',
  'utcOffsetMinutes|standardMeridian': '请补充出生当日的 UTC 时区偏移分钟，或当时采用的标准经线；历史时区和夏令时不能按今天猜测。',
  gender: '请补充性别（male 或 female），用于确定大运顺逆。',
});

const SCHOOL_METHODS = deepFreeze({
  旺衰: {
    方法: ['月令主导并结合通根透干', '全局生克制化与寒暖燥湿分别观察'],
    约束: '各法必须并列写出采用依据与差异，不得把明八字或藏干计数直接当成唯一旺衰裁决。',
  },
  格局: {
    方法: ['以月令取格并核对透干成败', '以全局做功与制化链条观察结构'],
    约束: '各法必须并列呈现成立条件与破格条件，不得输出未经论证的唯一格局。',
  },
  喜用神: {
    方法: ['扶抑取用', '调候取用', '通关取用'],
    约束: '三种取用目标可能不同，必须并列说明依据，不得合并成唯一喜用神。',
  },
});

const DISCLAIMER = DISCLAIMER_BASE;

function isMissing(value) {
  return value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '');
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneSchoolMethods() {
  return Object.fromEntries(Object.entries(SCHOOL_METHODS).map(([name, config]) => [
    name,
    { 方法: [...config.方法], 约束: config.约束 },
  ]));
}

function missingFields(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return REQUIRED_FIELDS.filter(field => {
    if (field === 'utcOffsetMinutes|standardMeridian') {
      return isMissing(source.utcOffsetMinutes) && isMissing(source.standardMeridian);
    }
    return isMissing(source[field]);
  });
}

function questionsFor(fields) {
  return fields.map(field => ({ field, question: QUESTIONS[field] }));
}

function pillarsText(chart) {
  const pillars = chart.四柱结果;
  return `四柱为 ${pillars.年}、${pillars.月}、${pillars.日}、${pillars.时}`;
}

function pillarEvidence(chart, alternateChart) {
  const selectedBoundary = chart.四柱结果.采用规则.dayBoundary;
  if (!alternateChart) {
    return {
      算出: pillarsText(chart),
      依据: `core/calendar.baziChart 按立春节气定年、以节定月、${chart.四柱结果.采用规则.说明}；${chart.四柱结果.采用规则.useTrueSolar ? '已按经度、时区经线和均时差校正真太阳时' : '按输入民用时间排盘，未校正真太阳时'}。已核对另一换日口径，本例四柱相同。`,
      可供判读: '日主是观察原点，四柱分别提供阶段、环境与关系结构的符号证据。',
    };
  }

  const alternateBoundary = alternateChart.四柱结果.采用规则.dayBoundary;
  return {
    算出: `${selectedBoundary} 口径${pillarsText(chart)}；${alternateBoundary} 口径${pillarsText(alternateChart)}`,
    依据: `分别以 ${selectedBoundary} 与 ${alternateBoundary} 显式调用 core/calendar.baziChart 两次，得到各自完整四柱、日主、十神、大运和流年；其他输入及排盘选项保持一致。`,
    可供判读: '两派日柱不同，后续所有日主、十神、关系与阶段分析必须分别引用对应完整命盘，禁止跨派拼接。',
  };
}

function evidenceChain(chart, alternateChart) {
  const elements = chart.命盘详情.五行统计;
  const cycles = chart.起运大运;
  return [
    pillarEvidence(chart, alternateChart),
    {
      算出: `五行明八字计数 ${JSON.stringify(elements.明八字)}；藏干计数 ${JSON.stringify(elements.藏干)}`,
      依据: elements.说明,
      可供判读: '可比较显露与潜藏资源，但计数不含月令、通根、透干和制化权重，不能直接裁决旺衰。',
    },
    {
      算出: `十神透干与藏干结构 ${JSON.stringify(chart.命盘详情.十神统计)}`,
      依据: '十神由日干与其余天干、藏干的五行生克及阴阳关系确定。',
      可供判读: '用于观察支持、产出、约束、资源掌控与同侪博弈，并同时说明每种关系的收益和代价。',
    },
    {
      算出: `地支关系、三合与三会 ${JSON.stringify({
        地支关系: chart.命盘详情.地支关系,
        三合: chart.命盘详情.三合,
        三会: chart.命盘详情.三会,
      })}`,
      依据: '按四支两两关系及完整三支组合查表得出，空关系也保留为可复核证据。',
      可供判读: '用于定位结构中的协同、牵制与阶段触发，不单独推导具体人生事件。',
    },
    {
      算出: `起运、大运与 ${chart.目标流年.年份} 流年已计算，起运同时保留 ${cycles.起运流派.map(item => item.折算法).join('、')} 两派`,
      依据: `大运顺逆取年干阴阳与性别，起运折算精度为 ${JSON.stringify(cycles.起运精度)}；流年以立春为界。`,
      可供判读: alternateChart
        ? '用于讨论主派阶段趋势；另一换日派必须从 alternateCalculation 的独立起运、大运与流年继续分析，两套结果并列披露。'
        : '用于讨论阶段趋势和目标年份的结构变化；两种起运折算法的时间差异必须并列披露。',
    },
  ];
}

function buildAnalysisContext(chart, alternateChart, targetYearInjected) {
  const targetYear = chart.目标流年.年份;
  return {
    输入说明: {
      目标年: targetYearInjected
        ? `目标年由技能层按调用时当前公历年 ${targetYear} 注入；core 仍收到显式 targetYear。`
        : `目标年由用户显式提供：${targetYear}。`,
      换日复算: alternateChart
        ? '本例换日口径导致日柱不同，已显式调用 core/calendar.baziChart 两次，分别保留两派完整命盘。'
        : '已由 core 核对两种换日口径，本例日柱相同，无需重复生成完整命盘。',
    },
    依据链: evidenceChain(chart, alternateChart),
    报告契约: {
      章节: [...REPORT_SECTIONS],
      章节要求: {
        综合: '先给总体结构与现实核验点，不使用宿命化定论。',
        性格与资源: '围绕日主、十神和四柱阶段说明优势、代价与可行动方向。',
        事业财运概览: '只作结构概览；深入问题转入 wealth-career，不保证结果或收益。',
        婚恋概览: '只作关系模式概览；深入问题转入 love-marriage，不断言必婚、必离或他人事实。',
        阶段趋势: '以大运、流年证据说明窗口与风险，区分两派起运时间。',
        流派差异: '并列换日、起运、旺衰、格局和取用方法的依据与结果差异。',
        免责声明: '原样保留文化娱乐、医疗与投资职业边界。',
      },
      免责声明: [...DISCLAIMER],
    },
    流派方法: cloneSchoolMethods(),
    表达规则: [
      '每项判断按“算出 -> 依据 -> 可供判读/结论”展开。',
      '把象征性倾向写成可由用户核验的假设，不把它写成已经发生的事实。',
      '每项优势同时说明资源成本，每项风险同时给出可执行的现实行动。',
    ],
  };
}

function analyze(input, { currentYear = new Date().getFullYear() } = {}) {
  if (!isPlainObject(input)) {
    throw new Error('input 必须是非数组的普通对象');
  }
  const missing = missingFields(input);
  if (missing.length > 0) {
    return { status: 'needs_input', missing, questions: questionsFor(missing) };
  }

  const targetYearInjected = isMissing(input.targetYear);
  const effectiveInput = {
    ...input,
    targetYear: targetYearInjected ? currentYear : input.targetYear,
  };
  const calculation = baziChart(effectiveInput);
  const alternateCalculation = calculation.四柱结果.另一派.是否不同
    ? baziChart({
      ...effectiveInput,
      options: {
        ...calculation.input.options,
        dayBoundary: calculation.四柱结果.另一派.dayBoundary,
      },
    })
    : null;
  const analysisContext = buildAnalysisContext(
    calculation,
    alternateCalculation,
    targetYearInjected,
  );
  return {
    status: 'ready',
    input: {
      ...calculation.input,
      targetYearSource: targetYearInjected ? 'skill-current-year' : 'user',
    },
    calculation,
    alternateCalculation,
    analysisContext,
  };
}

module.exports = {
  DISCLAIMER,
  REPORT_SECTIONS,
  REQUIRED_FIELDS,
  SCHOOL_METHODS,
  analyze,
  missingFields,
};
