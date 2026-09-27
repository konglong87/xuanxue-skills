'use strict';
const { BRANCH_ORDER, ALL_STARS, MAIN_STARS, PALACE_NAMES, TIANGAN, YANG_STEMS,
  FIVE_ELEMENTS_CLASSES, DECADE_YEARS } = require('./constants');
const { deepFreeze, isPlainObject } = require('../_shared/objects');
const COUNT = BRANCH_ORDER.length;
const mod = n => (n % COUNT + COUNT) % COUNT;
function relationValid(p, chart) {
  const relation = p.关系;
  if (!isPlainObject(relation)) return false;
  const expected = { 三方: [4,8].map(n=>BRANCH_ORDER[mod(p.索引+n)]),
    对宫: BRANCH_ORDER[mod(p.索引+6)], 四正:[0,4,6,8].map(n=>BRANCH_ORDER[mod(p.索引+n)]) };
  return Object.entries(expected).every(([key,value])=>JSON.stringify(relation[key])===JSON.stringify(value))
    && JSON.stringify(chart.三方四正?.[p.宫名])===JSON.stringify(relation);
}
function decadesValid(chart, lifeIndex) {
  if (!Array.isArray(chart.大限) || chart.大限.length !== COUNT || lifeIndex < 0) return false;
  const { 生年干: stem, 性别: gender } = chart.输入 || {};
  if (!TIANGAN.includes(stem) || !['male','female'].includes(gender)) return false;
  const forward = YANG_STEMS.includes(stem) === (gender === 'male');
  return chart.大限.every((d, i) => isPlainObject(d)
    && d.序号 === i+1 && d.宫位索引 === mod(lifeIndex+(forward?i:-i))
    && d.顺逆 === (forward?'顺行':'逆行')
    && d.起始虚岁 === chart.五行局?.value+i*DECADE_YEARS
    && d.结束虚岁 === d.起始虚岁+DECADE_YEARS-1);
}
// Structural validation guards DTO completeness; only external comparisons test independent agreement.
function verifyChart(chart) {
  if (!isPlainObject(chart) || !Array.isArray(chart.宫位)
    || chart.宫位.some(p=>!isPlainObject(p)||!Array.isArray(p.星曜)||p.星曜.some(s=>!isPlainObject(s)))) {
    return deepFreeze({status:'failed',checks:{shape:false}});
  }
  const palaces=chart.宫位;
  const stars=palaces.flatMap(p=>p.星曜);
  const life=palaces.filter(p=>p.命宫);
  const body=palaces.filter(p=>p.身宫);
  const transformations=chart.安星?.四化;
  const checks={
    palaces:palaces.length===COUNT && palaces.every((p,i)=>p.索引===i && p.地支===BRANCH_ORDER[i])
      && PALACE_NAMES.every(name=>palaces.some(p=>p.宫名===name)),
    stems:palaces.every(p=>TIANGAN.includes(p.天干)),
    lifeBody:life.length===1 && body.length===1 && life[0].地支===chart.命身?.命宫
      && life[0].天干===chart.命身?.命宫天干 && body[0].地支===chart.命身?.身宫,
    bureau:Object.values(FIVE_ELEMENTS_CLASSES).some(b=>b.name===chart.五行局?.name
      && b.value===chart.五行局?.value && b.element===chart.五行局?.element),
    mainStars:MAIN_STARS.every(name=>stars.filter(s=>s.name===name).length===1),
    completeStars:stars.length===ALL_STARS.length && ALL_STARS.every(name=>stars.some(s=>s.name===name)),
    uniqueStars:new Set(stars.map(s=>s.name)).size===stars.length,
    transformations:Array.isArray(transformations) && transformations.length===4 && stars.filter(s=>s.四化).length===4
      && ['禄','权','科','忌'].every(label=>transformations.filter(t=>t?.四化===label).length===1)
      && transformations.every(t=>stars.filter(s=>s.name===t.星曜 && s.四化===t.四化).length===1),
    relations:palaces.every(p=>relationValid(p,chart)),
    decades:decadesValid(chart,life[0]?.索引 ?? -1),
  };
  return deepFreeze({status:Object.values(checks).every(Boolean)?'passed':'failed',checks});
}
module.exports={verifyChart};
