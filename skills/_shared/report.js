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
  missing = [],
  questions = [],
  supplement,
} = {}) {
  [
    ['calculated', calculated],
    ['evidence', evidence],
    ['interpretation', interpretation],
    ['actions', actions],
    ['boundaries', boundaries],
  ].forEach(([name, value]) => {
    if (!Array.isArray(value)) throw new TypeError(`${name} 必须是数组`);
  });
  if (!Array.isArray(missing)) throw new TypeError('missing 必须是数组');
  if (!Array.isArray(questions)) throw new TypeError('questions 必须是数组');

  const report = {
    status,
    stages: [...REPORT_STAGES],
    输入口径: input ?? {},
    算出: calculated,
    依据: evidence,
    可供判读: interpretation,
    行动: actions,
    边界: boundaries,
  };
  if (status === 'needs_input') {
    report.missing = [...missing];
    report.questions = [...questions];
  }
  if (supplement !== undefined) report.supplement = supplement;
  return deepFreeze(report);
}

module.exports = { REPORT_STAGES, standardReport };
