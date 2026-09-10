const { baziChart } = require('../bazi');

const base = {
  longitude: 120,
  utcOffsetMinutes: 480,
  gender: 'male',
  targetYear: 2026,
  options: { useTrueSolar: false },
};

describe('历法边界回归', () => {
  test.each([
    ['立春前', '2020-02-03', '己亥'],
    ['立春后', '2020-02-05', '庚子'],
  ])('%s 年柱边界', (_label, birthDate, expectedYear) => {
    expect(baziChart({
      ...base,
      birthDate,
      birthTime: '12:00',
    }).四柱结果.年).toBe(expectedYear);
  });

  test.each([
    ['子夜前', '2020-01-01', '23:59', '癸卯'],
    ['子夜后', '2020-01-02', '00:01', '甲辰'],
  ])('%s 日柱边界', (_label, birthDate, birthTime, expectedDay) => {
    expect(baziChart({
      ...base,
      birthDate,
      birthTime,
      options: { useTrueSolar: false, dayBoundary: '00:00' },
    }).四柱结果.日).toBe(expectedDay);
  });
});
