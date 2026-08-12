const { chartDetails } = require('../chart');

const JOBS_PILLARS = { 年: '乙未', 月: '戊寅', 日: '丙辰', 时: '丁酉' };
const ELEMENTS = ['木', '火', '土', '金', '水'];

describe('八字命盘详情', () => {
  test('四柱逐项给出可复算的干支、十神、藏干和纳音', () => {
    const result = chartDetails(JOBS_PILLARS);

    expect(result.日主).toEqual({ 天干: '丙', 五行: '火', 阴阳: '阳' });
    expect(Object.keys(result.四柱)).toEqual(['年', '月', '日', '时']);
    expect(result.四柱.日).toMatchObject({
      干支: '丙辰',
      天干: '丙',
      地支: '辰',
      天干五行: '火',
      地支五行: '土',
      天干阴阳: '阳',
      地支阴阳: '阳',
      天干十神: '日主',
      纳音: '沙中土',
    });
    expect(result.四柱.月.藏干).toEqual([
      { 干: '甲', 类型: '本气', 五行: '木', 十神: '偏印' },
      { 干: '丙', 类型: '中气', 五行: '火', 十神: '比肩' },
      { 干: '戊', 类型: '余气', 五行: '土', 十神: '食神' },
    ]);
  });

  test('五行按明八字和无权重藏干分别透明计数', () => {
    const result = chartDetails(JOBS_PILLARS);
    const visible = result.五行统计.明八字;
    const hidden = result.五行统计.藏干;

    expect(Object.keys(visible)).toEqual(ELEMENTS);
    expect(Object.values(visible).reduce((sum, count) => sum + count, 0)).toBe(8);
    expect(hidden).toEqual({ 木: 3, 火: 2, 土: 3, 金: 1, 水: 1 });
    expect(result.五行统计.说明).toMatch(/不加权|不等于旺衰/);
  });

  test('十神统计与地支两两关系只输出结构化信号', () => {
    const result = chartDetails(JOBS_PILLARS);

    expect(result.十神统计.透干).toEqual({ 正印: 1, 食神: 1, 日主: 1, 劫财: 1 });
    expect(Object.values(result.十神统计.藏干).reduce((sum, count) => sum + count, 0)).toBe(10);
    expect(result.地支关系).toHaveLength(6);
    expect(result.地支关系).toContainEqual({
      柱一: '年', 地支一: '未', 柱二: '日', 地支二: '辰', 关系: [],
    });
    expect(result.三合).toMatchObject({ 成立: false });
    expect(result.三会).toMatchObject({ 成立: false });
    expect(result).not.toHaveProperty('旺衰');
    expect(result).not.toHaveProperty('格局');
    expect(result).not.toHaveProperty('喜用神');
  });

  test.each([
    [null, /pillars|四柱/],
    [{ 年: '甲子', 月: '乙丑', 日: '丙寅' }, /时柱/],
    [{ 年: '甲丑', 月: '乙丑', 日: '丙寅', 时: '丁卯' }, /年柱|合法干支/],
  ])('拒绝非法四柱：%p', (pillars, message) => {
    expect(() => chartDetails(pillars)).toThrow(message);
  });
});
