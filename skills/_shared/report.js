'use strict';

const { deepFreeze } = require('./lib/objects');

const REPORT_STAGES = Object.freeze([
  '输入口径',
  '算出',
  '依据',
  '可供判读',
  '行动',
  '边界',
]);

function standardReport({
  input,
  calculated = [],
  evidence = [],
  interpretation = [],
  actions = [],
  boundaries = [],
  status = 'ready',
  extra = {},
} = {}) {
  return deepFreeze({
    status,
    stages: [...REPORT_STAGES],
    输入口径: input ?? {},
    算出: calculated,
    依据: evidence,
    可供判读: interpretation,
    行动: actions,
    边界: boundaries,
    ...extra,
  });
}

module.exports = { REPORT_STAGES, standardReport };
