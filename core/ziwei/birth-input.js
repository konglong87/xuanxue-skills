'use strict';
const { isPlainObject } = require('../_shared/objects');
const { parseCivilDateTime } = require('../calendar/civil-time');
const { normalizePolicies } = require('./policy');
const { GENDERS, assertEnum } = require('./input');

const REQUIRED_FIELDS = Object.freeze(['birthDate', 'birthTime', 'longitude', 'utcOffsetMinutes|standardMeridian', 'gender']);
const BIRTH_FIELDS = Object.freeze(['birthDate', 'birthTime', 'longitude', 'utcOffsetMinutes', 'standardMeridian', 'gender']);
const BIRTH_YEAR_RANGE = Object.freeze([1900, 2100]);
const isMissing = value => value === undefined || value === null || value === '';
function finiteRange(value, min, max, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} 必须是 ${min}~${max} 的有限数字`);
  }
}
function validateValue(key, value) {
  if (key === 'birthDate') {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('birthDate 格式无效');
    const year = Number(value.slice(0, 4));
    finiteRange(year, ...BIRTH_YEAR_RANGE, key);
    try { parseCivilDateTime({ date: value, time: '12:00' }); } catch { throw new Error('birthDate 日期无效'); }
  }
  if (key === 'birthTime' && (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))) {
    throw new Error('birthTime 格式无效');
  }
  if (key === 'gender') assertEnum(value, GENDERS, key);
  if (key === 'longitude') finiteRange(value, -180, 180, key);
  if (key === 'utcOffsetMinutes') finiteRange(value, -720, 840, key);
  if (key === 'standardMeridian') finiteRange(value, -180, 210, key);
}
function normalizeBirthInput(input = {}, options) {
  if (!isPlainObject(input)) throw new TypeError('出生输入必须是普通对象');
  if (Object.keys(input).some(key => !BIRTH_FIELDS.includes(key) && key !== 'options')) {
    throw new Error('出生输入含未支持字段');
  }
  if (Object.hasOwn(input, 'options') && options !== undefined) throw new Error('options 只能在输入或第二参数中提供一次');
  const policies = normalizePolicies(options === undefined ? input.options : options);
  const safe = {};
  BIRTH_FIELDS.forEach(key => {
    if (isMissing(input[key])) return;
    validateValue(key, input[key]);
    safe[key] = input[key];
  });
  if (safe.utcOffsetMinutes !== undefined && safe.standardMeridian !== undefined
    && safe.utcOffsetMinutes / 4 !== safe.standardMeridian) throw new Error('时区与标准经线不一致');
  const missing = REQUIRED_FIELDS.filter(key => key === 'utcOffsetMinutes|standardMeridian'
    ? safe.utcOffsetMinutes === undefined && safe.standardMeridian === undefined
    : safe[key] === undefined);
  return { input: safe, policies, missing };
}
module.exports = { REQUIRED_FIELDS, BIRTH_FIELDS, BIRTH_YEAR_RANGE, normalizeBirthInput };
