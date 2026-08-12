// 五个技能共用的安全措辞唯一来源。
// 各技能只能引用或按领域叠加，不得自行改写同义版本，否则同一红线会出现多套宽严不一的表述。

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const DISCLAIMER_BASE = Object.freeze([
  '本报告属于中国传统术数的文化研究与娱乐性解读，不把象征关系当作确定事实。',
  '健康相关内容不构成医疗诊断或治疗建议；身体不适应咨询合格医疗专业人员。',
  '事业财运内容不构成投资、职业、法律或收益保证；重大决定应结合现实资料与专业意见。',
]);

const PALM_SAFE_HEALTH_TEXT =
  '健康内容只作体质倾向与精力状态提示，不构成医疗诊断；如有身体不适或疑虑，请及时就医。';
const PALM_REQUIRED_DISCLAIMER =
  '本报告属于中国传统文化中的手相娱乐性观察，不把象征关系当作确定事实，不保证医疗、寿命、职业、关系或收益结果。现实决定应结合真实经历与相应专业意见。';

const EVIDENCE_RULES = Object.freeze([
  '每项判断按“算出/看到的 -> 依据 -> 结论”展开，不得从符号直接跳到断语。',
  '结论写成可由用户核验的倾向与假设，并给出现实核验点和可执行行动。',
  '证据不足时写“不足以判断”，不得补造观察或推测缺失资料。',
]);

const REDLINES = deepFreeze({
  奇门: [
    '局盘与符号只能形成待核验假设，不作为人物动机、健康、收益、合同风险或未来事件的事实证明。',
    '不提供伤害、操纵、欺骗或胁迫方案；行动只限合法、安全、低风险且可撤销的现实核验。',
  ],
  健康: [
    '健康相关观察只作体质倾向与精力状态提示，不点名具体疾病、不推断寿命或灾祸。',
    '不替代任何检查与诊断；有持续不适或疑虑应及时就医。',
  ],
  婚恋: [
    '不断言必婚、必离、出轨或第三者等他人事实，也不给无证据的成功概率。',
    '不输出用于操纵、胁迫或欺骗他人感情与财物的方案；只为当事人自身的选择提供参考。',
  ],
  财经: [
    '不承诺收入、收益率、职位或投资结果，不提供个股、标的与买卖时点建议。',
    '事业财运结论只作方向参考，不保证任何具体结果；决策应结合现实资料与专业意见。',
  ],
});

const FORBIDDEN_CLAIMS = deepFreeze([
  {
    类别: '疾病',
    禁止: '点名具体疾病或给出诊断结论。',
    替代写法: '描述体质倾向与精力状态，并提示就医核验。',
  },
  {
    类别: '寿命灾祸',
    禁止: '推断寿数、死亡时间或必然发生的灾祸。',
    替代写法: '指出需要留意的风险场景与可执行的风险控制动作。',
  },
  {
    类别: '婚姻结果',
    禁止: '断言必婚、必离或婚姻必然破裂。',
    替代写法: '说明互动模式与可核验的相处问题，交由当事人判断。',
  },
  {
    类别: '他人事实',
    禁止: '把配偶、对象或第三方的行为当作已发生的事实陈述。',
    替代写法: '只描述当事人自身的关系结构倾向，并标明这不是对他人行为的判定。',
  },
  {
    类别: '收益承诺',
    禁止: '给出确定收益率、收入数字或投资标的建议。',
    替代写法: '给方向性参考与风险边界，并声明不构成投资建议。',
  },
]);

function disclaimerFor(...domains) {
  const extra = domains.flatMap(domain => {
    if (!Object.prototype.hasOwnProperty.call(REDLINES, domain)) {
      throw new Error(`未定义的红线领域：${domain}`);
    }
    return REDLINES[domain];
  });
  return [...new Set([...DISCLAIMER_BASE, ...extra])];
}

module.exports = {
  DISCLAIMER_BASE,
  EVIDENCE_RULES,
  FORBIDDEN_CLAIMS,
  PALM_REQUIRED_DISCLAIMER,
  PALM_SAFE_HEALTH_TEXT,
  REDLINES,
  disclaimerFor,
};
