const R = require('../relation');
const { DIZHI, TIANGAN } = require('../constants');

describe('地支关系', () => {
  test.each([
    ['六冲', [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]],
    ['六合', [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]],
    ['相害', [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']]],
    ['相破', [['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']]],
  ])('%s 六组双向成立', (name, pairs) => {
    pairs.forEach(([left, right]) => {
      expect(R.relation(left, right)).toContain(name);
      expect(R.relation(right, left)).toContain(name);
    });
  });

  test('相刑、自刑及多重关系成立', () => {
    expect(R.relation('子', '卯')).toContain('相刑');
    expect(R.relation('寅', '巳')).toEqual(expect.arrayContaining(['相刑', '相害']));
    expect(R.relation('辰', '辰')).toContain('相刑');
    expect(R.relation('寅', '亥')).toEqual(expect.arrayContaining(['六合', '相破']));
  });

  test('穷举 12×12 返回对称数组', () => {
    DIZHI.forEach(left => DIZHI.forEach(right => {
      const forward = R.relation(left, right);
      const reverse = R.relation(right, left);
      expect(Array.isArray(forward)).toBe(true);
      expect([...forward].sort()).toEqual([...reverse].sort());
    }));
  });
});

describe('三合三会与天干五合', () => {
  test('四组三合、半合与顺序无关', () => {
    expect(R.sanhe(['辰', '申', '子'])).toEqual({ 成立: true, 局: '申子辰水局', 半合: null });
    expect(R.sanhe(['寅', '午', '戌']).局).toBe('寅午戌火局');
    expect(R.sanhe(['亥', '卯', '未']).局).toBe('亥卯未木局');
    expect(R.sanhe(['巳', '酉', '丑']).局).toBe('巳酉丑金局');
    expect(R.sanhe(['申', '子']).半合).toBe('申子半合水');
  });

  test('四组三会', () => {
    expect(R.sanhui(['寅', '卯', '辰']).局).toBe('寅卯辰木局');
    expect(R.sanhui(['巳', '午', '未']).局).toBe('巳午未火局');
    expect(R.sanhui(['申', '酉', '戌']).局).toBe('申酉戌金局');
    expect(R.sanhui(['亥', '子', '丑']).局).toBe('亥子丑水局');
  });

  test('穷举 10×10 仅五组双向天干五合成立', () => {
    let matches = 0;
    TIANGAN.forEach(left => TIANGAN.forEach(right => {
      const result = R.ganHe(left, right);
      if (result.成立) matches++;
    }));
    expect(matches).toBe(10);
    expect(R.ganHe('甲', '己')).toEqual({ 成立: true, 化: '土' });
  });
});
