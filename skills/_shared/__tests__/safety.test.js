const safety = require('../safety');

describe('共用安全措辞', () => {
  test('手相固定健康文本和免责声明来自共享安全模块', () => {
    expect(safety.PALM_SAFE_HEALTH_TEXT).toBe(
      '健康内容只作体质倾向与精力状态提示，不构成医疗诊断；如有身体不适或疑虑，请及时就医。',
    );
    expect(safety.PALM_REQUIRED_DISCLAIMER).toBe(
      '本报告属于中国传统文化中的手相娱乐性观察，不把象征关系当作确定事实，不保证医疗、寿命、职业、关系或收益结果。现实决定应结合真实经历与相应专业意见。',
    );
  });
  test('通用免责声明含文化娱乐定位、医疗边界与投资职业边界', () => {
    expect(safety.DISCLAIMER_BASE).toHaveLength(3);
    expect(safety.DISCLAIMER_BASE[0]).toMatch(/文化研究与娱乐/);
    expect(safety.DISCLAIMER_BASE[1]).toMatch(/不构成医疗诊断/);
    expect(safety.DISCLAIMER_BASE[1]).toMatch(/咨询合格医疗专业人员/);
    expect(safety.DISCLAIMER_BASE[2]).toMatch(/不构成投资、职业、法律或收益保证/);
  });

  test('三段式表达规则要求算出到依据再到可核验结论', () => {
    expect(safety.EVIDENCE_RULES.join('\n')).toMatch(/算出[\s\S]*依据[\s\S]*结论/);
    expect(safety.EVIDENCE_RULES.join('\n')).toMatch(/核验/);
    expect(safety.EVIDENCE_RULES.join('\n')).toMatch(/不足以判断/);
  });

  test('健康红线禁止点名疾病并要求就医提示', () => {
    const text = safety.REDLINES.健康.join('\n');
    expect(text).toMatch(/不点名具体疾病/);
    expect(text).toMatch(/体质倾向|精力状态/);
    expect(text).toMatch(/就医/);
  });

  test('婚恋红线禁止操纵他人与断言他人事实', () => {
    const text = safety.REDLINES.婚恋.join('\n');
    expect(text).toMatch(/必婚|必离/);
    expect(text).toMatch(/操纵/);
    expect(text).toMatch(/他人/);
  });

  test('财经红线禁止收益承诺与确定收益率', () => {
    const text = safety.REDLINES.财经.join('\n');
    expect(text).toMatch(/收益率|收益保证/);
    expect(text).toMatch(/不承诺|不保证/);
  });

  test('奇门红线禁止把局盘当事实或用于伤害与操纵', () => {
    const text = safety.REDLINES.奇门.join('\n');
    expect(text).toMatch(/局盘|符号/);
    expect(text).toMatch(/事实/);
    expect(text).toMatch(/伤害/);
    expect(text).toMatch(/操纵/);
    expect(text).toMatch(/低风险|可撤销/);
  });

  test('禁止断语清单可被各技能门禁复用', () => {
    expect(Array.isArray(safety.FORBIDDEN_CLAIMS)).toBe(true);
    expect(safety.FORBIDDEN_CLAIMS.length).toBeGreaterThanOrEqual(5);
    safety.FORBIDDEN_CLAIMS.forEach(item => {
      expect(typeof item.类别).toBe('string');
      expect(item.禁止).toMatch(/\S/);
      expect(item.替代写法).toMatch(/\S/);
    });
    expect(safety.FORBIDDEN_CLAIMS.map(item => item.类别)).toEqual(
      expect.arrayContaining(['疾病', '寿命灾祸', '婚姻结果', '他人事实', '收益承诺']),
    );
  });

  test('disclaimerFor 在通用三条之后追加领域红线且不改动来源', () => {
    const result = safety.disclaimerFor('健康');
    expect(result.slice(0, 3)).toEqual(safety.DISCLAIMER_BASE);
    expect(result.slice(3)).toEqual(safety.REDLINES.健康);
    expect(() => {
      result.push('注入');
    }).not.toThrow();
    expect(safety.DISCLAIMER_BASE).toHaveLength(3);
  });

  test('disclaimerFor 支持多领域叠加且去重', () => {
    const result = safety.disclaimerFor('婚恋', '财经', '婚恋');
    expect(new Set(result).size).toBe(result.length);
    expect(result).toEqual(expect.arrayContaining(safety.REDLINES.婚恋));
    expect(result).toEqual(expect.arrayContaining(safety.REDLINES.财经));
  });

  test('disclaimerFor 为奇门返回唯一来源的执行红线', () => {
    const result = safety.disclaimerFor('奇门');
    expect(result.slice(0, safety.DISCLAIMER_BASE.length)).toEqual(safety.DISCLAIMER_BASE);
    expect(result.slice(safety.DISCLAIMER_BASE.length)).toEqual(safety.REDLINES.奇门);
  });

  test('disclaimerFor 拒绝未定义领域，不静默降级', () => {
    expect(() => safety.disclaimerFor('玄学')).toThrow(/未定义的红线领域/);
  });

  test('常量对外只读，防止技能之间互相污染措辞', () => {
    expect(Object.isFrozen(safety.DISCLAIMER_BASE)).toBe(true);
    expect(Object.isFrozen(safety.REDLINES)).toBe(true);
    expect(Object.isFrozen(safety.REDLINES.健康)).toBe(true);
    expect(Object.isFrozen(safety.FORBIDDEN_CLAIMS[0])).toBe(true);
  });
});
