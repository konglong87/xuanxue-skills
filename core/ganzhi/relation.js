const { DIZHI, TIANGAN } = require('./constants');

const RELATION_PAIRS = {
  六冲: [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']],
  六合: [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']],
  相害: [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']],
  相破: [['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']],
  相刑: [['子', '卯'], ['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未']],
  暗合: [['寅', '丑'], ['卯', '申'], ['午', '亥'], ['子', '戌']],
};
const SELF_PUNISHMENT = ['辰', '午', '酉', '亥'];
const SANHE = [
  { zhis: ['申', '子', '辰'], 局: '申子辰水局', 五行: '水' },
  { zhis: ['寅', '午', '戌'], 局: '寅午戌火局', 五行: '火' },
  { zhis: ['亥', '卯', '未'], 局: '亥卯未木局', 五行: '木' },
  { zhis: ['巳', '酉', '丑'], 局: '巳酉丑金局', 五行: '金' },
];
const SANHUI = [
  { zhis: ['寅', '卯', '辰'], 局: '寅卯辰木局' },
  { zhis: ['巳', '午', '未'], 局: '巳午未火局' },
  { zhis: ['申', '酉', '戌'], 局: '申酉戌金局' },
  { zhis: ['亥', '子', '丑'], 局: '亥子丑水局' },
];
const GANHE = [
  { pair: ['甲', '己'], 化: '土' },
  { pair: ['乙', '庚'], 化: '金' },
  { pair: ['丙', '辛'], 化: '水' },
  { pair: ['丁', '壬'], 化: '木' },
  { pair: ['戊', '癸'], 化: '火' },
];

function hasPair(pairs, left, right) {
  return pairs.some(([a, b]) => (a === left && b === right) || (a === right && b === left));
}

function relation(left, right) {
  [left, right].forEach(branch => {
    if (!DIZHI.includes(branch)) throw new Error(`${branch} 不是地支`);
  });
  return Object.entries(RELATION_PAIRS)
    .filter(([name, pairs]) => hasPair(pairs, left, right)
      || (name === '相刑' && left === right && SELF_PUNISHMENT.includes(left)))
    .map(([name]) => name);
}

function sanhe(zhis) {
  const values = new Set(zhis);
  const complete = SANHE.find(item => item.zhis.every(branch => values.has(branch)));
  if (complete) return { 成立: true, 局: complete.局, 半合: null };
  const partial = SANHE.find(item => item.zhis.filter(branch => values.has(branch)).length === 2);
  if (!partial) return { 成立: false, 局: null, 半合: null };
  const matched = partial.zhis.filter(branch => values.has(branch));
  return { 成立: false, 局: null, 半合: `${matched.join('')}半合${partial.五行}` };
}

function sanhui(zhis) {
  const values = new Set(zhis);
  const match = SANHUI.find(item => item.zhis.every(branch => values.has(branch)));
  return match ? { 成立: true, 局: match.局 } : { 成立: false, 局: null };
}

function ganHe(left, right) {
  [left, right].forEach(stem => {
    if (!TIANGAN.includes(stem)) throw new Error(`${stem} 不是天干`);
  });
  const match = GANHE.find(item => hasPair([item.pair], left, right));
  return match ? { 成立: true, 化: match.化 } : { 成立: false, 化: null };
}

module.exports = { relation, sanhe, sanhui, ganHe, 暗合: RELATION_PAIRS.暗合 };
