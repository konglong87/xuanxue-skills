const { DIZHI, JIAZI } = require('./constants');
const { canggan } = require('./basic');
const { shiShen } = require('./shishen');
const { relation } = require('./relation');

const PILLAR_NAMES = Object.freeze(['年', '月', '日', '时']);
const TEN_GODS = Object.freeze([
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印',
]);
const SPOUSE_GODS = Object.freeze({
  male: Object.freeze(['正财', '偏财']),
  female: Object.freeze(['正官', '七杀']),
});
const MARRIAGE_RELATIONS = Object.freeze(['相刑', '六冲', '六合', '相害']);
const PEACH_BLOSSOM = Object.freeze({
  寅: '卯', 午: '卯', 戌: '卯',
  申: '酉', 子: '酉', 辰: '酉',
  亥: '子', 卯: '子', 未: '子',
  巳: '午', 酉: '午', 丑: '午',
});
const RED_MATCHMAKER = Object.freeze({
  子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌',
  午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰',
});
const TRADITIONAL_SOURCE = Object.freeze({
  口径: '传统神煞查表口径',
  仓内资料边界: '仓内无一手古籍页码；本信号不作为 R3/R5 的流派裁决。',
  外部交叉验证: Object.freeze({
    repository: 'cantian-ai/bazi-mcp',
    commit: 'd5af26b043ac4ca62ef832179f700148285688e3',
    url: 'https://github.com/cantian-ai/bazi-mcp/blob/d5af26b043ac4ca62ef832179f700148285688e3/src/lib/god.ts',
  }),
});
const SPOUSE_SOURCE = Object.freeze({
  口径: '传统子平性别配偶星约定',
  仓内资料边界: '仓内无一手古籍页码；本信号不作为 R3/R5 的流派裁决。',
});

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validatePillars(pillars) {
  if (!isPlainObject(pillars)) throw new Error('pillars 必须是四柱普通对象');
  PILLAR_NAMES.forEach(name => {
    const value = pillars[name];
    if (typeof value !== 'string') throw new Error(`${name}柱缺失或不是干支字符串`);
    if (!JIAZI.includes(value)) throw new Error(`${name}柱不是合法干支：${value}`);
  });
}

function createGodSlots() {
  return Object.fromEntries(TEN_GODS.map(name => [name, { 显干: [], 藏干: [], 位置: [] }]));
}

function tenGodStructure(pillars) {
  validatePillars(pillars);
  const dayStem = pillars.日[0];
  const structure = createGodSlots();

  PILLAR_NAMES.forEach(name => {
    const ganzhi = pillars[name];
    const stem = ganzhi[0];
    const branch = ganzhi[1];
    if (name !== '日') {
      const slot = structure[shiShen(dayStem, stem)];
      slot.显干.push({ 柱: name, 干: stem });
      slot.位置.push({ 柱: name, 层: '天干', 干: stem });
    }
    canggan(branch).forEach(hidden => {
      const slot = structure[shiShen(dayStem, hidden.gan)];
      slot.藏干.push({
        柱: name,
        地支: branch,
        干: hidden.gan,
        类型: hidden.type,
      });
      slot.位置.push({
        柱: name,
        层: '藏干',
        干: hidden.gan,
        地支: branch,
        藏干类型: hidden.type,
      });
    });
  });

  return { 日主: dayStem, 十神: structure };
}

function pillarBranches(pillars) {
  return PILLAR_NAMES.map(name => ({ 柱: name, 地支: pillars[name][1] }));
}

function branchHits(branches, target) {
  return branches.filter(item => item.地支 === target).map(item => ({ ...item }));
}

function annualHit(targetGanzhi, branch) {
  return targetGanzhi ? targetGanzhi[1] === branch : null;
}

function orderedMarriageRelations(left, right) {
  const found = new Set(relation(left, right));
  return MARRIAGE_RELATIONS.filter(name => found.has(name));
}

function oppositeBranch(branch) {
  return DIZHI[(DIZHI.indexOf(branch) + 6) % DIZHI.length];
}

function cloneTraditionalSource() {
  return {
    口径: TRADITIONAL_SOURCE.口径,
    仓内资料边界: TRADITIONAL_SOURCE.仓内资料边界,
    外部交叉验证: { ...TRADITIONAL_SOURCE.外部交叉验证 },
  };
}

function validateOptions(options) {
  if (!isPlainObject(options)) throw new Error('options 必须是普通对象');
  if (!Object.prototype.hasOwnProperty.call(SPOUSE_GODS, options.gender)) {
    throw new Error('gender 必须是 male 或 female');
  }
  if (options.targetGanzhi !== undefined && options.targetGanzhi !== null
    && !JIAZI.includes(options.targetGanzhi)) {
    throw new Error(`targetGanzhi 必须是合法干支，收到：${options.targetGanzhi}`);
  }
}

function marriageSignals(pillars, options = {}) {
  validatePillars(pillars);
  validateOptions(options);
  const targetGanzhi = options.targetGanzhi ?? null;
  const branches = pillarBranches(pillars);
  const dayBranch = pillars.日[1];
  const yearBranch = pillars.年[1];
  const structure = tenGodStructure(pillars);
  const spouseGodNames = SPOUSE_GODS[options.gender];
  const peachMethods = [
    { 起法: '年支起', 起支: yearBranch },
    { 起法: '日支起', 起支: dayBranch },
  ];
  const redBranch = RED_MATCHMAKER[yearBranch];
  const joyBranch = oppositeBranch(redBranch);

  const originalRelations = branches
    .filter(item => item.柱 !== '日')
    .map(item => ({
      ...item,
      关系: orderedMarriageRelations(dayBranch, item.地支),
    }))
    .filter(item => item.关系.length > 0);
  const targetRelations = targetGanzhi
    ? orderedMarriageRelations(dayBranch, targetGanzhi[1])
    : null;

  return {
    配偶宫: { 柱: '日', 地支: dayBranch },
    配偶星: {
      性别: options.gender,
      十神: [...spouseGodNames],
      位置: spouseGodNames.map(name => ({
        十神: name,
        显干: structure.十神[name].显干.map(item => ({ ...item })),
        藏干: structure.十神[name].藏干.map(item => ({ ...item })),
        位置: structure.十神[name].位置.map(item => ({ ...item })),
      })),
    },
    桃花: peachMethods.map(method => {
      const peachBranch = PEACH_BLOSSOM[method.起支];
      return {
        ...method,
        桃花支: peachBranch,
        原局命中: branchHits(branches, peachBranch),
        目标流年命中: annualHit(targetGanzhi, peachBranch),
      };
    }),
    红鸾天喜: {
      年支: yearBranch,
      红鸾支: redBranch,
      天喜支: joyBranch,
      推导: '天喜取红鸾对冲支',
      原局命中: {
        红鸾: branchHits(branches, redBranch),
        天喜: branchHits(branches, joyBranch),
      },
      目标流年命中: {
        红鸾: annualHit(targetGanzhi, redBranch),
        天喜: annualHit(targetGanzhi, joyBranch),
      },
    },
    夫妻宫关系: {
      收录关系: [...MARRIAGE_RELATIONS],
      原局: originalRelations,
      目标流年: targetGanzhi ? {
        干支: targetGanzhi,
        地支: targetGanzhi[1],
        关系: targetRelations,
      } : null,
    },
    来源: {
      配偶星: { ...SPOUSE_SOURCE },
      桃花红鸾: cloneTraditionalSource(),
    },
  };
}

module.exports = {
  MARRIAGE_RELATIONS,
  PEACH_BLOSSOM,
  RED_MATCHMAKER,
  TEN_GODS,
  marriageSignals,
  tenGodStructure,
};
