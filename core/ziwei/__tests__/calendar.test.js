'use strict';
const { birthChart, ziweiChart, verifyChart } = require('../index');
const { jieList } = require('../../calendar');
const BIRTH = { birthDate: '2024-02-09', birthTime: '12:00', longitude: 120, utcOffsetMinutes: 480, gender: 'male' };

test('新年与立春口径明确分盘，四种组合均返回完整计算', () => {
  const result = birthChart(BIRTH, { useTrueSolar: false });
  expect(result.calculation.输入).toMatchObject({ 生年干: '癸', 生年支: '卯' });
  const other = result.alternatives.find(a => a.policies.yearBoundary === 'lichun');
  expect(other.calculation.输入).toMatchObject({ 生年干: '甲', 生年支: '辰' });
  expect(other.differs).toBe(true);
  expect(result.alternatives).toHaveLength(3);
  result.alternatives.forEach(a => expect(a.calculation.verification.status).toBe('passed'));
});
test('晚子真正移动日期，在普通月和闰月的开始/结束均完整转换', () => {
  const expected = [
    ['2024-02-09', 1, 1, false], ['2023-03-21', 2, 1, true], ['2023-04-19', 3, 1, false],
  ];
  expected.forEach(([birthDate, month, day, isLeap]) => {
    const result = birthChart({ ...BIRTH, birthDate, birthTime: '23:30' }, { useTrueSolar: false });
    expect(result.calendar.lunar).toMatchObject({ month, day, isLeap });
  });
});
test('真太阳时跨日必须改变农历日期，同时披露校正', () => {
  const input = { ...BIRTH, birthDate: '2024-02-10', birthTime: '00:05', longitude: 75 };
  const solar = birthChart(input, { dayBoundary: '00:00' });
  const civil = birthChart(input, { dayBoundary: '00:00', useTrueSolar: false });
  expect(solar.calendar.lunar).toMatchObject({ year: 2023, month: 12, day: 30 });
  expect(civil.calendar.lunar).toMatchObject({ year: 2024, month: 1, day: 1 });
  expect(solar.calendar.trueSolar.offsetMinutes).toBeLessThan(-180);
  expect(civil.calendar.trueSolar).toBeNull();
});
test('立春是实际瞬间，海外墙钟必须先换到节气表时区', () => {
  const term = jieList(2024).find(t => t.名 === '立春').时刻;
  const instant = Date.UTC(term.getFullYear(), term.getMonth(), term.getDate(), term.getHours(), term.getMinutes(), term.getSeconds());
  for (const offset of [480, 0, -480]) {
    for (const delta of [-60, 60]) {
      const local = new Date(instant + (offset - 480) * 60_000 + delta * 1000);
      const result = birthChart({ ...BIRTH, birthDate: local.toISOString().slice(0,10),
        birthTime: local.toISOString().slice(11,19), utcOffsetMinutes: offset }, { useTrueSolar: false, yearBoundary: 'lichun' });
      expect(result.calculation.输入.生年干).toBe(delta < 0 ? '癸' : '甲');
    }
  }
});
test('报告结构校验能发现天干缺失和四化缺失，而不是总返回passed', () => {
  const chart = JSON.parse(JSON.stringify(birthChart(BIRTH).calculation));
  chart.宫位[0].天干 = undefined;
  expect(verifyChart(chart)).toMatchObject({ status: 'failed', checks: { stems: false } });
  const second = JSON.parse(JSON.stringify(birthChart(BIRTH).calculation));
  second.宫位.flatMap(p => p.星曜).find(s => s.四化).四化 = null;
  expect(verifyChart(second).status).toBe('failed');
});
test('十二个月×十二时辰×十天干，命身定位与宫干/四化一致', () => {
  const hours = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  for (let month=1;month<=12;month++) for (const timeBranch of hours) for (let s=0;s<stems.length;s++) {
    const chart = ziweiChart({ lunarMonth: month, lunarDay: 13, timeBranch, yearStem: stems[s], yearBranch: s%2 ? '丑':'子', gender:'male' });
    expect(chart.verification.status).toBe('passed');
    expect(chart.宫位.find(p=>p.命宫).天干).toBe(chart.命身.命宫天干);
  }
});
test('残缺辅星、非法大限与残缺DTO不能被验证器放行',()=>{
  const chart=JSON.parse(JSON.stringify(birthChart(BIRTH).calculation));
  chart.宫位.forEach(p=>{p.星曜=p.星曜.filter(s=>s.name!=='天马');});
  expect(verifyChart(chart).status).toBe('failed');
  const decades=JSON.parse(JSON.stringify(birthChart(BIRTH).calculation));
  decades.大限.forEach((d,i)=>{d.宫位索引=100+i;d.起始虚岁=-5;d.结束虚岁=-6;});
  expect(verifyChart(decades).status).toBe('failed');
  expect(verifyChart({}).status).toBe('failed');
});
