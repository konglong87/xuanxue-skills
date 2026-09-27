'use strict';
const { ziweiChart, soulAndBody } = require('../index');
const { analyze } = require('../../../skills/ziwei/lib/analyze');
const INPUT = { lunarMonth: 1, lunarDay: 1, timeBranch: '子', yearStem: '甲', yearBranch: '辰', gender: 'male' };
const BIRTH = { birthDate: '2024-02-09', birthTime: '23:30', longitude: 120, utcOffsetMinutes: 480, gender: 'male' };

test('正月子时命身同在寅，不以宫位坐标充当时辰偏移', () => {
  expect(soulAndBody(INPUT)).toMatchObject({ soulBranch: '寅', bodyBranch: '寅', soulStem: '丙' });
});
test('甲年十二宫天干正确，命宫元数据与宫内天干一致', () => {
  const chart = ziweiChart(INPUT);
  expect(chart.宫位.map(p => p.天干)).toEqual(['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁']);
  expect(chart.宫位.find(p => p.命宫).天干).toBe(chart.命身.命宫天干);
});
test.each(['丙','戊','己','辛','壬'])('%s年四化必须各自实际落入一颗星', yearStem => {
  const chart = ziweiChart({ ...INPUT, yearStem, yearBranch: ['己','辛'].includes(yearStem) ? '巳' : '辰' });
  expect(chart.宫位.flatMap(p => p.星曜).filter(s => s.四化)).toHaveLength(4);
});
test('晚子跨年：23换日应先进入下一农历年和月，午夜口径保留除夕', () => {
  const next = analyze(BIRTH, { useTrueSolar: false, dayBoundary: '23:00', yearBoundary: 'lunar-new-year' });
  const current = analyze(BIRTH, { useTrueSolar: false, dayBoundary: '00:00', yearBoundary: 'lunar-new-year' });
  expect(next.supplement.calculation.输入).toMatchObject({ 农历月份: 1, 农历日: 1, 生年干: '甲', 生年支: '辰' });
  expect(current.supplement.calculation.输入).toMatchObject({ 农历月份: 12, 农历日: 30, 生年干: '癸', 生年支: '卯' });
});
