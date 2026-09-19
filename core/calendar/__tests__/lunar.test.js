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

  test.each([
    [{ year: 2024, month: 2, day: 30 }, '2024-02-30'],
    [{ year: 2023, month: 2, day: 29 }, '2023-02-29'],
    [{ year: 1900, month: 2, day: 29 }, '1900-02-29'],
  ])('拒绝不存在的公历日期 %j', (input, date) => {
    expect(() => solarToLunar(input)).toThrow(new RegExp(`合法公历日期.*${date}`));
  });

  test.each(['true', 1, 0, null, {}])('闰月标志必须是布尔值：%j', isLeap => {
    expect(() => lunarToSolar({
      year: 2025, month: 6, day: 1, isLeap,
    })).toThrow(/isLeap.*boolean|布尔/);
  });

  test('农历转公历返回稳定的民用日期值，不受宿主时区影响', () => {
    const result = lunarToSolar({ year: 2026, month: 6, day: 29 });

    expect(result.date.toJSON()).toBe('2026-08-11T00:00:00');
    expect(result.date).not.toBeInstanceOf(Date);
    expect([
      result.date.getFullYear(),
      result.date.getMonth() + 1,
      result.date.getDate(),
    ]).toEqual([2026, 8, 11]);
  });
});
