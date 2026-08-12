const { fourPillars } = require('../pillars');
const { parseCivilDateTime } = require('../civil-time');
const { jieqiTable } = require('../jieqi');

const SHANGHAI_LONGITUDE = 121.47;

describe('四柱排盘', () => {
  test('固定样本四柱正确并返回规则说明', () => {
    const result = fourPillars({
      datetime: new Date(1990, 7, 15, 10, 30),
      longitude: SHANGHAI_LONGITUDE,
    });
    expect({ 年: result.年, 月: result.月, 日: result.日, 时: result.时 })
      .toEqual({ 年: '庚午', 月: '甲申', 日: '壬子', 时: '乙巳' });
    expect(result.采用规则.dayBoundary).toBe('23:00');
  });

  test('年柱以立春为界而非春节', () => {
    const before = fourPillars({ datetime: new Date(2000, 1, 3, 12), longitude: SHANGHAI_LONGITUDE });
    const after = fourPillars({ datetime: new Date(2000, 1, 5, 12), longitude: SHANGHAI_LONGITUDE });
    expect(before.年).not.toBe(after.年);
    expect(after.年).toBe('庚辰');
  });

  test('月柱以节为界', () => {
    const before = fourPillars({ datetime: new Date(2026, 2, 4, 12), longitude: SHANGHAI_LONGITUDE });
    const after = fourPillars({ datetime: new Date(2026, 2, 8, 12), longitude: SHANGHAI_LONGITUDE });
    expect(before.月).not.toBe(after.月);
  });

  // 节气当天的分界必须落在精确时刻，不能落在当天 00:00。
  // 历法库的 getMonthInGanZhi / getYearInGanZhiByLiChun 是日粒度切换，
  // 直接采用会让节气当天、精确时刻之前出生的人拿到错误月柱（立春当天还会错年柱）。
  const noCorrection = { useTrueSolar: false };

  test('月柱在节的精确时刻切换，而非节所在日的零点', () => {
    // 1984 小寒：北京时间 1984-01-06 11:40:51
    const before = fourPillars({
      datetime: parseCivilDateTime({ date: '1984-01-06', time: '11:39' }),
      options: noCorrection,
    });
    const after = fourPillars({
      datetime: parseCivilDateTime({ date: '1984-01-06', time: '11:42' }),
      options: noCorrection,
    });
    expect(before.月).toBe('甲子');
    expect(after.月).toBe('乙丑');
  });

  test('立春当天精确时刻之前，年柱与月柱都仍属上一年', () => {
    // 2024 立春：北京时间 2024-02-04 16:27:07
    const before = fourPillars({
      datetime: parseCivilDateTime({ date: '2024-02-04', time: '16:26' }),
      options: noCorrection,
    });
    const after = fourPillars({
      datetime: parseCivilDateTime({ date: '2024-02-04', time: '16:28' }),
      options: noCorrection,
    });
    expect({ 年: before.年, 月: before.月 }).toEqual({ 年: '癸卯', 月: '乙丑' });
    expect({ 年: after.年, 月: after.月 }).toEqual({ 年: '甲辰', 月: '丙寅' });
  });

  test('每个节的前后一分钟都各自归属相邻两个月柱', () => {
    const seen = new Set();
    for (const year of [1984, 2024]) {
      for (const jie of jieqiTable(year).filter(item => item.是节)) {
        const before = fourPillars({
          datetime: new Date(jie.时刻.getTime() - 60_000),
          options: noCorrection,
        });
        const after = fourPillars({
          datetime: new Date(jie.时刻.getTime() + 60_000),
          options: noCorrection,
        });
        expect(before.月).not.toBe(after.月);
        seen.add(`${year}:${jie.名}`);
      }
    }
    expect(seen.size).toBe(24);
  });

  test('默认 23:00 换日且 23:30 两派日柱不同', () => {
    const datetime = new Date(2026, 5, 15, 23, 30);
    const ziHour = fourPillars({ datetime, longitude: SHANGHAI_LONGITUDE });
    const midnight = fourPillars({
      datetime,
      longitude: SHANGHAI_LONGITUDE,
      options: { dayBoundary: '00:00' },
    });
    expect(ziHour.采用规则.dayBoundary).toBe('23:00');
    expect(ziHour.时.slice(1)).toBe('子');
    expect(ziHour.日).not.toBe(midnight.日);
    expect(ziHour.另一派).toMatchObject({ dayBoundary: '00:00', 日: midnight.日 });
  });

  test('关闭真太阳时后 22:59 两派日柱相同', () => {
    const input = { datetime: new Date(2026, 5, 15, 22, 59), longitude: SHANGHAI_LONGITUDE };
    const ziHour = fourPillars({ ...input, options: { dayBoundary: '23:00', useTrueSolar: false } });
    const midnight = fourPillars({ ...input, options: { dayBoundary: '00:00', useTrueSolar: false } });
    expect(ziHour.日).toBe(midnight.日);
  });

  test('换日边界以真太阳时为准', () => {
    const datetime = new Date(2026, 5, 15, 22, 59);
    const corrected = fourPillars({ datetime, longitude: SHANGHAI_LONGITUDE });
    const uncorrected = fourPillars({ datetime, options: { useTrueSolar: false } });
    expect(corrected.真太阳时信息.真太阳时.getHours()).toBe(23);
    expect(corrected.日).not.toBe(uncorrected.日);
  });

  test('真太阳时可改变时柱，也可显式关闭', () => {
    const datetime = new Date(2026, 5, 15, 13, 10);
    const shanghai = fourPillars({ datetime, longitude: SHANGHAI_LONGITUDE });
    const urumqi = fourPillars({ datetime, longitude: 87.6 });
    expect(shanghai.时).not.toBe(urumqi.时);

    const uncorrected = fourPillars({ datetime, options: { useTrueSolar: false } });
    expect(uncorrected.采用规则.useTrueSolar).toBe(false);
    expect(uncorrected.真太阳时信息).toBeNull();
  });

  test('子时天干遵循五鼠遁', () => {
    const result = fourPillars({
      datetime: new Date(2026, 5, 15, 0, 30),
      options: { useTrueSolar: false },
    });
    const 子时干 = { 甲: '甲', 己: '甲', 乙: '丙', 庚: '丙', 丙: '戊', 辛: '戊', 丁: '庚', 壬: '庚', 戊: '壬', 癸: '壬' };
    expect(result.时).toBe(子时干[result.日[0]] + '子');
  });

  test('非法或缺失入参抛错', () => {
    expect(() => fourPillars({ longitude: 120 })).toThrow(/datetime/);
    expect(() => fourPillars({ datetime: new Date() })).toThrow(/经度/);
    expect(() => fourPillars({ datetime: new Date(), longitude: 120, options: { dayBoundary: '01:00' } }))
      .toThrow(/23:00|00:00/);
  });
});
