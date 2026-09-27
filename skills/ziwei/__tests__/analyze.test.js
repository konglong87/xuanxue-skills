'use strict';

const { analyze, missingFields } = require('../lib/analyze');

describe('紫微斗数技能契约', () => {
  const input = {
    birthDate: '1990-01-01',
    birthTime: '12:00',
    longitude: 121.47,
    utcOffsetMinutes: 480,
    gender: 'male',
  };

  test('资料不足时一次性返回缺失项和问题', () => {
    const result = analyze({ birthDate: input.birthDate });
    expect(result.status).toBe('needs_input');
    expect(result.missing).toEqual([
      'birthTime', 'longitude', 'utcOffsetMinutes|standardMeridian', 'gender',
    ]);
    expect(result.questions).toHaveLength(4);
  });

  test('ready 报告包含可复用计算证据和统一安全边界', () => {
    const result = analyze(input);
    expect(result.status).toBe('ready');
    expect(result.补充 || result.supplement).toBeDefined();
    expect(result.supplement.skill).toBe('ziwei');
    expect(result.supplement.calculation.宫位).toHaveLength(12);
    expect(result.可供判读).toHaveLength(4);
    expect(result.边界.join('')).toMatch(/传统术数|收益|疾病/);
    expect(result.可供判读[0].依据).toMatch(/已排出/);
  });

  test('标准经线可以替代时区偏移', () => {
    expect(missingFields({ ...input, utcOffsetMinutes: undefined, standardMeridian: 120 }))
      .not.toContain('utcOffsetMinutes|standardMeridian');
    expect(analyze({ ...input, utcOffsetMinutes: undefined, standardMeridian: 120 }).status).toBe('ready');
  });
});
