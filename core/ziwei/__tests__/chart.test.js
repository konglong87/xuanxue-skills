'use strict';

const { format, fiveElementsClass, ziweiChart } = require('../index');

const INPUT = {
  lunarMonth: 1,
  lunarDay: 13,
  timeBranch: '子',
  yearStem: '甲',
  yearBranch: '子',
  gender: 'male',
};

describe('紫微斗数基础排盘内核', () => {
  test('按命身、五行局、主星和十二宫输出稳定结构', () => {
    const chart = ziweiChart(INPUT);

    expect(chart.命身).toEqual(expect.objectContaining({ 命宫: '辰', 身宫: '子', 命宫天干: '戊' }));
    expect(chart.五行局).toEqual(expect.objectContaining({ name: '木三局', value: 3 }));
    expect(chart.宫位).toHaveLength(12);
    expect(chart.宫位.filter(palace => palace.命宫)).toHaveLength(1);
    expect(chart.宫位.filter(palace => palace.身宫)).toHaveLength(1);
    expect(chart.三方四正['命宫'].四正).toHaveLength(4);
    expect(chart.宫位[0].关系.对宫).toEqual(expect.any(String));

    const stars = chart.宫位.flatMap(palace => palace.星曜.map(star => star.name));
    expect(stars).toEqual(expect.arrayContaining([
      '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
      '贪狼', '巨门', '天相', '天梁', '七杀', '破军', '禄存', '擎羊', '陀罗', '天马',
    ]));
    expect(new Set(stars).size).toBe(18);
  });

  test('四化随生年天干挂到对应星曜，并保留流派提示', () => {
    const chart = ziweiChart(INPUT);
    expect(chart.安星.四化).toEqual([
      { 星曜: '廉贞', 四化: '禄' },
      { 星曜: '破军', 四化: '权' },
      { 星曜: '武曲', 四化: '科' },
      { 星曜: '太阳', 四化: '忌' },
    ]);
    expect(chart.宫位.flatMap(palace => palace.星曜)
      .filter(star => star.四化)
      .map(star => `${star.name}${star.四化}`))
      .toEqual(expect.arrayContaining(['廉贞禄', '破军权', '武曲科', '太阳忌']));
    expect(chart.规则说明.join('')).toMatch(/流派/);
  });

  test('五行局取数和格式化输出可独立复用', () => {
    expect(fiveElementsClass('丙', '子')).toEqual(expect.objectContaining({ name: '水二局' }));
    expect(fiveElementsClass('庚', '申')).toEqual(expect.objectContaining({ name: '木三局' }));
    expect(format(ziweiChart(INPUT))).toMatch(/命宫：戊辰[\s\S]*十二宫：/);
  });

  test('结果深冻结，避免宿主修改计算证据', () => {
    const chart = ziweiChart(INPUT);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.宫位[0])).toBe(true);
    expect(Object.isFrozen(chart.宫位[0].星曜)).toBe(true);
    expect(Object.isFrozen(chart.宫位[0].星曜[0])).toBe(true);
  });

  test.each([
    [{ ...INPUT, lunarDay: 0 }, /lunarDay/],
    [{ ...INPUT, timeBranch: '未知' }, /timeBranch/],
    [{ ...INPUT, gender: 'other' }, /gender/],
  ])('拒绝越界输入 %#', (input, message) => {
    expect(() => ziweiChart(input)).toThrow(message);
  });
});
