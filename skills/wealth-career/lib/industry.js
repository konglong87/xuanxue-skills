'use strict';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

// 行业取象种子表（师承资料 4.5）。
//
// 资料明确写「这是开放的映射」——行业符号必须根据具体职业取象，不是封闭查表。
// 所以这张表的定位是**锚点**：四条有出处的映射先给出，其余行业由判读层按取象推理
// 补充，并要求写出推理过程与来源。之所以要把这四条落进代码，是因为它们有唯一
// 出处，属于查表内容 —— 让模型凭印象说出「程序员对应哪个门」正是要避免的事。
//
// 「医疗」一行资料原文给的是两个并列符号（天心在西、乙木在中），两说都保留，
// 不替使用者择一。

const INDUSTRY_SYMBOL_SEEDS = deepFreeze([
  {
    id: 'rnd',
    行业: 'R&D / 技术 / 程序员',
    符号原文: '杜门',
    符号: Object.freeze([Object.freeze({ 类别: '八门', 值: '杜门' })]),
    来源: '师承资料 4.5 行业取象表',
    开放映射: true,
  },
  {
    id: 'medical',
    行业: '医疗',
    符号原文: '天心（西）/ 乙木（中）',
    符号: Object.freeze([
      Object.freeze({ 类别: '九星', 值: '天心', 方位限定: '西' }),
      Object.freeze({ 类别: '天干', 值: '乙', 方位限定: '中' }),
    ]),
    来源: '师承资料 4.5 行业取象表',
    开放映射: true,
    并列口径: '资料原文并列给出两个符号与各自方位限定，两说都保留，不替使用者择一。',
  },
  {
    id: 'performance',
    行业: '演艺 / 网红 / 主播',
    符号原文: '景门',
    符号: Object.freeze([Object.freeze({ 类别: '八门', 值: '景门' })]),
    来源: '师承资料 4.5 行业取象表',
    开放映射: true,
  },
  {
    id: 'public-service',
    行业: '公务 / 领袖',
    符号原文: '值符',
    符号: Object.freeze([Object.freeze({ 类别: '八神', 值: '值符' })]),
    来源: '师承资料 4.5 行业取象表',
    开放映射: true,
  },
]);

const OPEN_MAPPING_NOTE = '行业取象是开放映射，不是封闭查表。'
  + '种子表只覆盖四类有明确出处的行业；其余行业须由判读层按取象推理补充，'
  + '并写出推理链与依据，不得把推理结果冒充资料原文。';

// 只做字面量匹配，不猜同义词：命中即返回有出处的种子，未命中即如实报「需取象」。
function industrySeedFor(industry) {
  if (typeof industry !== 'string' || industry.trim() === '') return null;
  const value = industry.trim();
  return INDUSTRY_SYMBOL_SEEDS.find(seed => seed.行业 === value) || null;
}

module.exports = { INDUSTRY_SYMBOL_SEEDS, OPEN_MAPPING_NOTE, industrySeedFor };
