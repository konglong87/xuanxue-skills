'use strict';

const TRIGRAMS = Object.freeze({
  乾: Object.freeze({ name: '乾', lines: [1, 1, 1] }),
  坤: Object.freeze({ name: '坤', lines: [0, 0, 0] }),
  震: Object.freeze({ name: '震', lines: [1, 0, 0] }),
  艮: Object.freeze({ name: '艮', lines: [0, 0, 1] }),
  坎: Object.freeze({ name: '坎', lines: [0, 1, 0] }),
  离: Object.freeze({ name: '离', lines: [1, 0, 1] }),
  巽: Object.freeze({ name: '巽', lines: [0, 1, 1] }),
  兑: Object.freeze({ name: '兑', lines: [1, 1, 0] }),
});

const KING_WEN = Object.freeze([
  ['乾', '乾', '乾'], ['坤', '坤', '坤'], ['坎', '震', '屯'], ['艮', '坎', '蒙'],
  ['坎', '乾', '需'], ['乾', '坎', '讼'], ['坤', '坎', '师'], ['坎', '坤', '比'],
  ['巽', '乾', '小畜'], ['乾', '兑', '履'], ['坤', '乾', '泰'], ['乾', '坤', '否'],
  ['乾', '离', '同人'], ['离', '乾', '大有'], ['坤', '艮', '谦'], ['震', '坤', '豫'],
  ['兑', '震', '随'], ['艮', '巽', '蛊'], ['坤', '兑', '临'], ['巽', '坤', '观'],
  ['离', '震', '噬嗑'], ['艮', '离', '贲'], ['艮', '坤', '剥'], ['坤', '震', '复'],
  ['乾', '震', '无妄'], ['艮', '乾', '大畜'], ['艮', '震', '颐'], ['兑', '巽', '大过'],
  ['坎', '坎', '坎'], ['离', '离', '离'], ['兑', '艮', '咸'], ['震', '巽', '恒'],
  ['乾', '艮', '遁'], ['震', '乾', '大壮'], ['离', '坤', '晋'], ['坤', '离', '明夷'],
  ['巽', '离', '家人'], ['离', '兑', '睽'], ['坎', '艮', '蹇'], ['震', '坎', '解'],
  ['艮', '兑', '损'], ['巽', '震', '益'], ['兑', '乾', '夬'], ['乾', '巽', '姤'],
  ['兑', '坤', '萃'], ['坤', '巽', '升'], ['兑', '坎', '困'], ['坎', '巽', '井'],
  ['兑', '离', '革'], ['离', '巽', '鼎'], ['震', '震', '震'], ['艮', '艮', '艮'],
  ['巽', '艮', '渐'], ['震', '兑', '归妹'], ['震', '离', '丰'], ['离', '艮', '旅'],
  ['巽', '巽', '巽'], ['兑', '兑', '兑'], ['巽', '坎', '涣'], ['坎', '兑', '节'],
  ['巽', '兑', '中孚'], ['震', '艮', '小过'], ['坎', '离', '既济'], ['离', '坎', '未济'],
]);

const TRIGRAM_BY_BITS = Object.freeze(Object.fromEntries(
  Object.entries(TRIGRAMS).map(([name, value]) => [value.lines.join(''), name]),
));

function assertLines(lines) {
  if (!Array.isArray(lines) || lines.length !== 6 || lines.some(line => line !== 0 && line !== 1)) {
    throw new Error('lines 必须是长度为 6、元素为 0 或 1 的数组，顺序为初爻到上爻');
  }
}

function guaFromLines(lines) {
  assertLines(lines);
  const lower = TRIGRAM_BY_BITS[lines.slice(0, 3).join('')];
  const upper = TRIGRAM_BY_BITS[lines.slice(3).join('')];
  const definition = KING_WEN.find(item => item[0] === upper && item[1] === lower);
  return Object.freeze({
    index: definition ? KING_WEN.indexOf(definition) + 1 : null,
    name: definition ? definition[2] : '未命名',
    upper,
    lower,
    lines: [...lines],
  });
}

function bianGua(gua, moving = []) {
  const movingLines = Array.isArray(moving) ? moving : [moving];
  if (movingLines.some(line => !Number.isInteger(line) || line < 1 || line > 6)) {
    throw new Error('moving 必须是 1~6 的爻位数组');
  }
  const lines = gua.lines.map((line, index) => movingLines.includes(index + 1) ? 1 - line : line);
  return guaFromLines(lines);
}

function hugua(gua) {
  return guaFromLines([
    gua.lines[1], gua.lines[2], gua.lines[3],
    gua.lines[2], gua.lines[3], gua.lines[4],
  ]);
}

function cuogua(gua) {
  return guaFromLines(gua.lines.map(line => 1 - line));
}

function zonggua(gua) {
  return guaFromLines([...gua.lines].reverse());
}

const NAJIA = Object.freeze({
  乾: [['甲子', '甲寅', '甲辰'], ['壬午', '壬申', '壬戌']],
  坤: [['乙未', '乙巳', '乙卯'], ['癸丑', '癸亥', '癸酉']],
  坎: [['戊寅', '戊辰', '戊午'], ['戊申', '戊戌', '戊子']],
  离: [['己卯', '己丑', '己亥'], ['己酉', '己未', '己巳']],
  震: [['庚子', '庚寅', '庚辰'], ['庚午', '庚申', '庚戌']],
  巽: [['辛丑', '辛亥', '辛酉'], ['辛未', '辛巳', '辛卯']],
  艮: [['丙辰', '丙午', '丙申'], ['丙戌', '丙子', '丙寅']],
  兑: [['丁巳', '丁卯', '丁丑'], ['丁亥', '丁酉', '丁未']],
});

function najia(gua) {
  const lower = NAJIA[gua.lower][0];
  const upper = NAJIA[gua.upper][1];
  return Object.freeze({
    初爻: lower[0], 二爻: lower[1], 三爻: lower[2],
    四爻: upper[0], 五爻: upper[1], 上爻: upper[2],
  });
}

const GUA64 = Object.freeze(KING_WEN.map(([upper, lower, name], index) => Object.freeze({
  index: index + 1,
  name,
  upper,
  lower,
  lines: [...TRIGRAMS[lower].lines, ...TRIGRAMS[upper].lines],
})));

module.exports = { GUA64, TRIGRAMS, bianGua, cuogua, guaFromLines, hugua, najia, zonggua };
