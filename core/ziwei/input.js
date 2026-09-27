'use strict';
const { isPlainObject } = require('../_shared/objects');
const { TIANGAN, DIZHI, JIAZI } = require('../ganzhi/constants');
const { normalizePolicies } = require('./policy');

const GENDERS = Object.freeze(['male', 'female']);
const LUNAR_FIELDS = Object.freeze(['lunarMonth', 'lunarDay', 'timeBranch', 'yearStem', 'yearBranch', 'gender', 'isLeapMonth', 'options']);
function assertEnum(value, allowed, name) {
  if (!allowed.includes(value)) throw new Error(`${name} 值无效`);
}
function assertInteger(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} 必须是 ${min}~${max} 的整数`);
}
function assertLunarInput(input) {
  if (!isPlainObject(input)) throw new TypeError('紫微输入必须是普通对象');
  if (Object.keys(input).some(key => !LUNAR_FIELDS.includes(key))) throw new Error('紫微输入含未支持字段');
  assertInteger(input.lunarMonth, 1, 12, 'lunarMonth');
  assertInteger(input.lunarDay, 1, 30, 'lunarDay');
  assertEnum(input.timeBranch, DIZHI, 'timeBranch');
  assertEnum(input.yearStem, TIANGAN, 'yearStem');
  assertEnum(input.yearBranch, DIZHI, 'yearBranch');
  assertEnum(input.gender, GENDERS, 'gender');
  if (!JIAZI.includes(input.yearStem + input.yearBranch)) throw new Error('生年干支不是有效六十甲子组合');
  if (input.isLeapMonth !== undefined && typeof input.isLeapMonth !== 'boolean') throw new Error('isLeapMonth 必须是 boolean');
  normalizePolicies(input.options);
}
module.exports = { GENDERS, assertEnum, assertInteger, assertLunarInput };
