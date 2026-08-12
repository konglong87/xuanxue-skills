const { wuxingOf, yinyangOf, shengke } = require('./basic');
const { TIANGAN } = require('./constants');

const SHISHEN_BY_RELATION = {
  同: ['比肩', '劫财'],
  生: ['食神', '伤官'],
  克: ['偏财', '正财'],
  被克: ['七杀', '正官'],
  被生: ['偏印', '正印'],
};

function shiShen(dayStem, target) {
  if (!TIANGAN.includes(dayStem)) throw new Error(`日主必须是天干，收到：${dayStem}`);
  const relation = shengke(wuxingOf(dayStem), wuxingOf(target));
  const samePolarity = yinyangOf(dayStem) === yinyangOf(target);
  return SHISHEN_BY_RELATION[relation][samePolarity ? 0 : 1];
}

module.exports = { shiShen };
