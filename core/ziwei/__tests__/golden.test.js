'use strict';
const fixtures = require('./fixtures/golden.json');
const { birthChart } = require('../index');

describe('独立固定版本紫微计算器黄金数值对照（不加载外部代码）', () => {
  test.each(fixtures.cases.map((fixture, index) => [index, fixture]))('黄金盘 %s', (_index, fixture) => {
    const { calculation: chart } = birthChart(fixture.input);
    const actual = { life: chart.命身.命宫, body: chart.命身.身宫, bureau: chart.五行局.name,
      palaces: chart.宫位.map(p => { const d = chart.大限.find(d => d.宫位索引 === p.索引); return {
        branch: p.地支, stem: p.天干, name: p.宫名, body: p.身宫,
        stars: p.星曜.map(s => s.name + (s.四化 || '')).sort(), decade: [d.起始虚岁, d.结束虚岁],
      }; }) };
    expect(actual).toEqual(fixture.expected);
  });
  test('覆盖十年干、五行局、十二时支、男女与闰月', () => {
    const charts = fixtures.cases.map(f => birthChart(f.input));
    expect(new Set(charts.map(c => c.calculation.输入.生年干)).size).toBe(10);
    expect(new Set(charts.map(c => c.calculation.五行局.name)).size).toBe(5);
    expect(new Set(charts.map(c => c.calendar.timeBranch)).size).toBe(12);
    expect(new Set(charts.map(c => c.input.gender)).size).toBe(2);
    expect(charts.some(c => c.calendar.lunar.isLeap)).toBe(true);
  });
});
