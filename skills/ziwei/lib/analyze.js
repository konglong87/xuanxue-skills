'use strict';
const { birthChart } = require('../../../core/ziwei');
const { REQUIRED_FIELDS, normalizeBirthInput } = require('../../../core/ziwei/birth-input');
const { disclaimerFor, EVIDENCE_RULES } = require('../../_shared/safety');
const { deepFreeze } = require('../../_shared/lib/objects');
const { standardReport } = require('../../_shared/report');

const QUESTIONS = Object.freeze({
  birthDate: '请补充公历出生日期（YYYY-MM-DD，本版支持 1900–2100 年）。',
  birthTime: '请补充出生地民用时间（HH:mm[:ss]）。',
  longitude: '请补充出生地经度（东经为正、西经为负）。',
  'utcOffsetMinutes|standardMeridian': '请补充出生当日 UTC 偏移分钟或标准经线，不能猜测历史时区或夏令时。',
  gender: '请补充性别（male 或 female），用于大限顺逆。',
});
const DISCLAIMER = Object.freeze(disclaimerFor('命理', '婚恋', '财经'));
const TOPICS = Object.freeze({ 命宫: '自我与资源', 夫妻宫: '关系互动', 官禄宫: '事业角色', 财帛宫: '财务习惯' });
const LIMITS = Object.freeze([
  '闰月仅支持同月口径，四化仅支持 traditional 表；其他流派尚未实现，不能据此给出唯一裁决。',
  '本版没有完整辅星亮度、流年流月流日、飞星与小限；只提供已实现星曜和大限骨架。',
]);
function missingFields(input) {
  return normalizeBirthInput(input).missing;
}
function signalFor(chart, name, topic) {
  const palace = chart.宫位.find(p => p.宫名 === name);
  const stars = palace.星曜.map(s => `${s.name}${s.四化 || ''}`).join('、');
  return { 主题: topic,
    算出: `${name}位于${palace.天干}${palace.地支}，已实现星曜为${stars || '无'}；三方为${palace.关系.三方.join('、')}，对宫为${palace.关系.对宫}`,
    依据: '只引用已排出的宫位、星曜和四化；不把单星直接等同于现实事件。',
    可供判读: '可结合现实经历核验该主题的资源、压力和选择模式；证据不足时不作确定断语。' };
}
function analyze(input = {}, options) {
  const normalized = normalizeBirthInput(input, options);
  if (normalized.missing.length) {
    return standardReport({ status: 'needs_input', input: { ...normalized.input, options: normalized.policies }, missing: normalized.missing,
      questions: normalized.missing.map(field => ({ field, question: QUESTIONS[field] })), boundaries: DISCLAIMER });
  }
  const result = birthChart(normalized.input, normalized.policies);
  if (result.verification.status !== 'passed') throw new Error('紫微验证未通过，停止判读');
  const chart = result.calculation;
  const report = standardReport({
    input: { ...result.input, policies: result.policies, calendar: result.calendar },
    calculated: [
      { 算出: `采用农历日期${result.calendar.lunar.中文}`, 依据: '先校正出生墙钟时间，再按换日口径移动完整日期，最后公历转农历。' },
      { 算出: `命宫${chart.命身.命宫}、身宫${chart.命身.身宫}、${chart.五行局.name}`, 依据: chart.规则.palaces },
      { 算出: `紫微在${chart.安星.紫微宫位}、天府在${chart.安星.天府宫位}`, 依据: chart.规则.stars },
      { 算出: `生年四化：${chart.安星.四化.map(t => `${t.星曜}${t.四化}`).join('、')}`, 依据: chart.规则.transformations },
    ],
    evidence: [
      { 算出: result.policies, 依据: '年界可选农历新年或立春瞬间；日界可选23:00或00:00，不能沿用未声明的八字默认值。' },
      { 算出: result.verification, 依据: '已支持的四种年界/日界组合均复算；结构校验不等同于外部独立验证。' },
      ...EVIDENCE_RULES.map(rule => ({ 算出: '标准判读规则', 依据: rule })),
    ],
    interpretation: Object.entries(TOPICS).map(([name, topic]) => signalFor(chart, name, topic)),
    actions: [
      '把宫位主题与真实经历核对，记录支持与不支持的证据。',
      '对 supplement.alternatives 中 differs 为 true 的完整对照盘分别解读，不得跨盘拼接星曜。',
      '深入婚恋或事业财运可转对应技能；领域技能尚未自动接入紫微增强，不从单一符号替用户决定。',
    ],
    boundaries: [...DISCLAIMER, ...LIMITS],
    supplement: { skill: 'ziwei', version: 2, calculation: chart, rules: chart.规则说明,
      alternatives: result.alternatives, verification: result.verification },
  });
  return deepFreeze(report);
}
module.exports = { DISCLAIMER, REQUIRED_FIELDS, analyze, missingFields };
