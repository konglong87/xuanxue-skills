const D = require('../shan24');

describe('二十四山', () => {
  test('24 山唯一且各中点归属连续', () => {
    expect(D.SHAN24).toHaveLength(24);
    expect(new Set(D.SHAN24.map(item => item.山)).size).toBe(24);
    D.SHAN24.forEach((item, index) => {
      const midpoint = (337.5 + index * 15 + 7.5) % 360;
      expect(D.shanFromDegree(midpoint).山).toBe(item.山);
    });
  });

  test('子山跨零度且午山居正南', () => {
    [0, 360, 5, 355].forEach(degree => expect(D.shanFromDegree(degree).山).toBe('子'));
    [175, 180, 185].forEach(degree => expect(D.shanFromDegree(degree).山).toBe('午'));
    [340, 350, 337.6].forEach(degree => expect(D.shanFromDegree(degree).山).toBe('壬'));
  });

  test('八卦各领三山且三元龙正确', () => {
    const byGua = D.SHAN24.reduce((groups, item) => {
      (groups[item.卦] ||= []).push(item);
      return groups;
    }, {});
    Object.values(byGua).forEach(items => expect(items).toHaveLength(3));
    expect(byGua.坎.map(item => item.山)).toEqual(['壬', '子', '癸']);
    expect(D.shanFromDegree(340).元).toBe('地元');
    expect(D.shanFromDegree(0).元).toBe('天元');
    expect(D.shanFromDegree(15).元).toBe('人元');
  });

  test('大空亡、小空亡与容差', () => {
    expect(D.kongwang(22.5).type).toBe('大空亡');
    expect(D.kongwang(337.5).type).toBe('大空亡');
    expect(D.kongwang(7.5).type).toBe('小空亡');
    expect(D.kongwang(0).type).toBeNull();
    expect(D.kongwang(24, { tolerance: 0.5 }).type).toBeNull();
    expect(D.kongwang(24, { tolerance: 2 }).type).toBe('大空亡');
  });

  test('坐向相差 180 度并拒绝非法度数', () => {
    expect(D.zuoxiang(180)).toMatchObject({ 坐: { 山: '子' }, 向: { 山: '午' } });
    expect(D.zuoxiang(0)).toMatchObject({ 坐: { 山: '午' }, 向: { 山: '子' } });
    expect(() => D.shanFromDegree(-1)).toThrow(/0.*360/);
    expect(() => D.shanFromDegree(400)).toThrow(/0.*360/);
  });
});
