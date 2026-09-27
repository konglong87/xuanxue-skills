'use strict';

const ganzhi = require('../ganzhi/constants');
const DIZHI = Object.freeze([...ganzhi.DIZHI]);
const TIANGAN = Object.freeze([...ganzhi.TIANGAN]);

const BRANCH_ORDER = Object.freeze(['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']);
const PALACE_NAMES = Object.freeze([
  '命宫', '父母宫', '福德宫', '田宅宫', '官禄宫', '仆役宫',
  '迁移宫', '疾厄宫', '财帛宫', '子女宫', '夫妻宫', '兄弟宫',
]);
const MAIN_STARS = Object.freeze([
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
  '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
]);
const AUXILIARY_STARS = Object.freeze(['禄存', '擎羊', '陀罗', '天马', '文昌', '文曲', '左辅', '右弼']);
const ALL_STARS = Object.freeze([...MAIN_STARS, ...AUXILIARY_STARS]);
const DECADE_YEARS = 10;
const STAR_SYSTEM = Object.freeze({
  紫微系: Object.freeze(['紫微', '天机', null, '太阳', '武曲', '天同', null, null, '廉贞']),
  天府系: Object.freeze(['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', null, null, null, '破军']),
});
const STEM_TRANSFORMATIONS = Object.freeze({
  甲: Object.freeze({ 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' }),
  乙: Object.freeze({ 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' }),
  丙: Object.freeze({ 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' }),
  丁: Object.freeze({ 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' }),
  戊: Object.freeze({ 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' }),
  己: Object.freeze({ 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' }),
  庚: Object.freeze({ 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' }),
  辛: Object.freeze({ 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' }),
  壬: Object.freeze({ 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' }),
  癸: Object.freeze({ 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' }),
});
const TIGER_STEM = Object.freeze({ 甲: '丙', 乙: '戊', 丙: '庚', 丁: '壬', 戊: '甲', 己: '丙', 庚: '戊', 辛: '庚', 壬: '壬', 癸: '甲' });
const LUCUN_BRANCH = Object.freeze({ 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' });
const TIANMA_BRANCH = Object.freeze({
  寅: '申', 午: '申', 戌: '申',
  申: '寅', 子: '寅', 辰: '寅',
  巳: '亥', 酉: '亥', 丑: '亥',
  亥: '巳', 卯: '巳', 未: '巳',
});
const FIVE_ELEMENTS_CLASSES = Object.freeze({
  1: Object.freeze({ name: '木三局', value: 3, element: '木' }),
  2: Object.freeze({ name: '金四局', value: 4, element: '金' }),
  3: Object.freeze({ name: '水二局', value: 2, element: '水' }),
  4: Object.freeze({ name: '火六局', value: 6, element: '火' }),
  5: Object.freeze({ name: '土五局', value: 5, element: '土' }),
});
const YANG_STEMS = Object.freeze(['甲', '丙', '戊', '庚', '壬']);

module.exports = {
  ALL_STARS,
  AUXILIARY_STARS,
  DECADE_YEARS,
  BRANCH_ORDER,
  DIZHI,
  FIVE_ELEMENTS_CLASSES,
  LUCUN_BRANCH,
  MAIN_STARS,
  PALACE_NAMES,
  STAR_SYSTEM,
  STEM_TRANSFORMATIONS,
  TIANMA_BRANCH,
  TIGER_STEM,
  TIANGAN,
  YANG_STEMS,
};
