const { trueSolarTime, equationOfTime } = require('../truesolar');

describe('真太阳时', () => {
  test('东经 120 度经度时差为零', () => {
    const result = trueSolarTime({ datetime: new Date(2026, 5, 15, 12), longitude: 120 });
    expect(result.经度时差).toBeCloseTo(0, 6);
  });

  test('乌鲁木齐和上海经度时差正确', () => {
    const datetime = new Date(2026, 5, 15, 12);
    expect(trueSolarTime({ datetime, longitude: 87.6 }).经度时差).toBeCloseTo(-129.6, 3);
    expect(trueSolarTime({ datetime, longitude: 121.47 }).经度时差).toBeCloseTo(5.88, 2);
  });

  test('均时差全年保持在正负 17 分钟内', () => {
    for (let month = 0; month < 12; month++) {
      expect(Math.abs(equationOfTime(new Date(2026, month, 15)))).toBeLessThan(17);
    }
  });

  test('总偏移等于经度时差加均时差', () => {
    const datetime = new Date(2026, 5, 15, 12);
    const result = trueSolarTime({ datetime, longitude: 87.6 });
    expect(result.总偏移分钟).toBeCloseTo(result.经度时差 + result.均时差, 3);
    expect(result.真太阳时.getTime()).toBeCloseTo(datetime.getTime() + result.总偏移分钟 * 60_000, -2);
    expect(result.真太阳时.getHours()).toBe(9);
  });

  test('非法入参抛错', () => {
    expect(() => trueSolarTime({ datetime: new Date() })).toThrow(/经度/);
    expect(() => trueSolarTime({ datetime: '2026-01-01', longitude: 120 })).toThrow(/Date/);
  });
});
