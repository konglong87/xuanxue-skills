const { JIAZI } = require('./constants');
const { wuxingOf, yinyangOf, canggan, nayin } = require('./basic');
const { shiShen } = require('./shishen');
const { relation, sanhe, sanhui } = require('./relation');

const PILLAR_NAMES = ['年', '月', '日', '时'];
const ELEMENTS = ['木', '火', '土', '金', '水'];
const ELEMENT_STATS_NOTE = '明八字按四个天干与四个地支本五行计数；藏干逐项计数、不加权，仅展示组成，不等于旺衰。';

function validatePillars(pillars) {
  if (!pillars || typeof pillars !== 'object') throw new Error('pillars 必须是四柱对象');
  PILLAR_NAMES.forEach(name => {
    const ganzhi = pillars[name];
    if (ganzhi === undefined) throw new Error(`缺少${name}柱`);
    if (!JIAZI.includes(ganzhi)) throw new Error(`${name}柱必须是合法干支，收到：${ganzhi}`);
  });
}

function pillarDetails(name, ganzhi, dayStem) {
  const [stem, branch] = ganzhi;
  return {
    干支: ganzhi,
    天干: stem,
    地支: branch,
    天干五行: wuxingOf(stem),
    地支五行: wuxingOf(branch),
    天干阴阳: yinyangOf(stem),
    地支阴阳: yinyangOf(branch),
    天干十神: name === '日' ? '日主' : shiShen(dayStem, stem),
    藏干: canggan(branch).map(({ gan, type }) => ({
      干: gan,
      类型: type,
      五行: wuxingOf(gan),
      十神: shiShen(dayStem, gan),
    })),
    纳音: nayin(ganzhi),
  };
}

function emptyElementCounts() {
  return Object.fromEntries(ELEMENTS.map(element => [element, 0]));
}

function elementStats(details) {
  const 明八字 = emptyElementCounts();
  const 藏干 = emptyElementCounts();
  Object.values(details).forEach(pillar => {
    明八字[pillar.天干五行] += 1;
    明八字[pillar.地支五行] += 1;
    pillar.藏干.forEach(item => { 藏干[item.五行] += 1; });
  });
  return { 明八字, 藏干, 说明: ELEMENT_STATS_NOTE };
}

function increment(stats, name) {
  stats[name] = (stats[name] || 0) + 1;
}

function tenGodStats(details) {
  const 透干 = {};
  const 藏干 = {};
  Object.values(details).forEach(pillar => {
    increment(透干, pillar.天干十神);
    pillar.藏干.forEach(item => increment(藏干, item.十神));
  });
  return { 透干, 藏干 };
}

function branchRelations(details) {
  const pairs = [];
  PILLAR_NAMES.forEach((leftName, leftIndex) => {
    PILLAR_NAMES.slice(leftIndex + 1).forEach(rightName => {
      pairs.push({
        柱一: leftName,
        地支一: details[leftName].地支,
        柱二: rightName,
        地支二: details[rightName].地支,
        关系: relation(details[leftName].地支, details[rightName].地支),
      });
    });
  });
  return pairs;
}

function chartDetails(pillars) {
  validatePillars(pillars);
  const dayStem = pillars.日[0];
  const 四柱 = Object.fromEntries(
    PILLAR_NAMES.map(name => [name, pillarDetails(name, pillars[name], dayStem)]),
  );
  const branches = PILLAR_NAMES.map(name => 四柱[name].地支);
  return {
    日主: { 天干: dayStem, 五行: wuxingOf(dayStem), 阴阳: yinyangOf(dayStem) },
    四柱,
    五行统计: elementStats(四柱),
    十神统计: tenGodStats(四柱),
    地支关系: branchRelations(四柱),
    三合: sanhe(branches),
    三会: sanhui(branches),
  };
}

module.exports = {
  chartDetails,
  pillarDetails,
  elementStats,
  tenGodStats,
  branchRelations,
};
