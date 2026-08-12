const { solarToLunar, lunarToSolar } = require('../lunar');

describe('公历农历互转', () => {
  test('公历转农历并可往返', () => {
    const lunar = solarToLunar({ year: 2026, month: 8, day: 11 });
    expect(lunar).toMatchObject({ year: 2026, month: 6, day: 29, isLeap: false });
    expect(lunarToSolar(lunar)).toMatchObject({ year: 2026, month: 8, day: 11 });
  });

  test('闰月用显式 isLeap 表示并可往返', () => {
    const solar = lunarToSolar({ year: 2025, month: 6, day: 1, isLeap: true });
    expect(solar).toMatchObject({ year: 2025, month: 7, day: 25 });
    expect(solarToLunar(solar)).toMatchObject({ year: 2025, month: 6, day: 1, isLeap: true });
  });

  test('非法日期抛错', () => {
    expect(() => solarToLunar({ year: 2026, month: 13, day: 1 })).toThrow(/日期|月份/);
    expect(() => lunarToSolar({ year: 2026, month: 13, day: 1 })).toThrow(/日期|月份/);
  });
});
