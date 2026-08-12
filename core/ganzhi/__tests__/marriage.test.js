const M = require('../marriage');
const { TIANGAN, DIZHI } = require('../constants');

describe('婚恋确定性查表', () => {
  test('干合五对双向且覆盖十干', () => {
    const pairs = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸' };
    Object.entries(pairs).forEach(([left, right]) => {
      expect(M.hehun(left).所合之干).toBe(right);
      expect(M.hehun(right).所合之干).toBe(left);
    });
    TIANGAN.forEach(stem => expect(M.hehun(stem).特质).toBeTruthy());
  });

  test('孤辰寡宿四组各覆盖三支', () => {
    const counts = {};
    DIZHI.forEach(branch => {
      const result = M.guchenGuasu(branch);
      counts[result.生肖组] = (counts[result.生肖组] || 0) + 1;
    });
    expect(Object.values(counts)).toEqual([3, 3, 3, 3]);
    expect(M.guchenGuasu('子')).toMatchObject({
      孤辰: { zhi: '寅', 方位: '东北' },
      寡宿: { zhi: '戌', 方位: '西北' },
      化解: '东北放猪，西北放兔',
    });
    expect(M.guchenGuasu('酉')).toMatchObject({
      孤辰: { zhi: '亥', 方位: '西北' },
      寡宿: { zhi: '未', 方位: '西南' },
    });
  });

  test('沐浴位只返回资料明确的丁壬两条', () => {
    expect(M.muyuWei('丁')).toBe('西南');
    expect(M.muyuWei('壬')).toBe('西北');
    expect(M.muyuWei('甲')).toBeNull();
  });
});
