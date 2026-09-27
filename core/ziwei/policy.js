'use strict';
const { deepFreeze, isPlainObject } = require('../_shared/objects');

const DAY_BOUNDARIES = Object.freeze(['23:00', '00:00']);
const YEAR_BOUNDARIES = Object.freeze(['lunar-new-year', 'lichun']);
const POLICY_VALUES = deepFreeze({
  dayBoundary: DAY_BOUNDARIES,
  yearBoundary: YEAR_BOUNDARIES,
  useTrueSolar: [true, false],
  leapMonthPolicy: ['same-month'],
  transformationPolicy: ['traditional'],
});
const DEFAULT_POLICIES = Object.freeze({
  dayBoundary: DAY_BOUNDARIES[0],
  yearBoundary: YEAR_BOUNDARIES[0],
  useTrueSolar: true,
  leapMonthPolicy: 'same-month',
  transformationPolicy: 'traditional',
});
const RULES = Object.freeze({
  palaces: '命宫以寅为正月起点，按农历月顺行、子起时辰逆行；身宫按子起时辰顺行。',
  stars: '命宫干支定五行局；农历日与局数定位紫微天府，再安十四主星。',
  leap: '本版仅支持闰月按同月处理，不代表闰月所有流派；其他口径尚未实现。',
  transformations: '四化按 traditional 生年干表；文昌、文曲、左辅、右弼亦实际安入宫位。',
});
function normalizePolicies(options = {}) {
  if (!isPlainObject(options)) throw new TypeError('options 必须是普通对象');
  if (Object.keys(options).some(key => !Object.hasOwn(POLICY_VALUES, key))) {
    throw new Error('options 含未支持字段');
  }
  const result = { ...DEFAULT_POLICIES };
  for (const key of Object.keys(options)) {
    if (!POLICY_VALUES[key].includes(options[key])) throw new Error(`options.${key} 值无效或未支持`);
    result[key] = options[key];
  }
  return Object.freeze(result);
}
module.exports = { DAY_BOUNDARIES, YEAR_BOUNDARIES, DEFAULT_POLICIES, RULES, normalizePolicies };
