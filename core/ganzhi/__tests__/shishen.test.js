const { shiShen } = require('../shishen');
const { TIANGAN, DIZHI } = require('../constants');

describe('十神', () => {
  test('甲日主对十天干', () => {
    expect(TIANGAN.map(target => shiShen('甲', target)))
      .toEqual(['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']);
  });

  test('阴日主视角正确', () => {
    expect(shiShen('癸', '癸')).toBe('比肩');
    expect(shiShen('癸', '壬')).toBe('劫财');
    expect(shiShen('癸', '乙')).toBe('食神');
    expect(shiShen('癸', '甲')).toBe('伤官');
  });

  test('10×10 每个日主十神各出现一次', () => {
    const expected = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'].sort();
    TIANGAN.forEach(dayStem => {
      expect(TIANGAN.map(target => shiShen(dayStem, target)).sort()).toEqual(expected);
    });
  });

  test('支持地支目标并拒绝地支日主', () => {
    TIANGAN.forEach(dayStem => DIZHI.forEach(branch => expect(typeof shiShen(dayStem, branch)).toBe('string')));
    expect(() => shiShen('子', '甲')).toThrow(/日主必须是天干/);
  });
});
