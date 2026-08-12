const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const calendar = require('../index');

const {
  parseCivilDateTime,
  standardMeridianOf,
  trueSolarTime,
  fourPillars,
} = calendar;

const CELEBRITY_FIXTURE = path.join(__dirname, '../../../tests/fixtures/celebrity-bazi.json');
const EXPECTED_ORACLE_URLS = {
  'Barack Obama': 'https://bazi-calculator.com/?licz=1&n=Obama%2C+Barack&h=19%3A24&d=4&m=08&y=1961&l=-157.52&src=1&g=-10&ds=&s=&rr=AA',
  'Steve Jobs': 'https://bazi-calculator.com/?licz=1&n=Jobs%2C+Steve&h=19%3A15&d=24&m=02&y=1955&l=-122.25&src=1&g=-8&ds=&s=&rr=AA',
  'Albert Einstein': 'https://www.cantian.ai/cases/detail/en/albert_einstein.html',
};

describe('民用时间输入契约', () => {
  test('按出生地墙钟字段构造民用值对象，不经过 ISO 时区转换', () => {
    expect(typeof parseCivilDateTime).toBe('function');
    if (typeof parseCivilDateTime !== 'function') return;

    const result = parseCivilDateTime({ date: '1955-02-24', time: '19:15' });
    expect([
      result.getFullYear(),
      result.getMonth(),
      result.getDate(),
      result.getHours(),
      result.getMinutes(),
      result.getSeconds(),
    ]).toEqual([1955, 1, 24, 19, 15, 0]);
    expect(result).not.toBeInstanceOf(Date);
    expect(result.toJSON()).toBe('1955-02-24T19:15:00');
    expect(result.toString()).toBe('1955-02-24T19:15:00');
    for (const internalName of [
      'CivilDateTime',
      'addDateTimeDays',
      'dateTimeValueOf',
      'dateFromTimeValue',
      'isValidDateTime',
    ]) {
      expect(calendar).not.toHaveProperty(internalName);
    }
  });

  test('不同宿主时区对 DST gap、真太阳时和平移换日输出一致', () => {
    const script = [
      "const { fourPillars, parseCivilDateTime, trueSolarTime } = require('./core/calendar');",
      'const fields = value => [',
      '  value.getFullYear(), value.getMonth(), value.getDate(),',
      '  value.getHours(), value.getMinutes(),',
      '];',
      "const value = parseCivilDateTime({ date: '2024-03-10', time: '02:30' });",
      'const solar = trueSolarTime({ datetime: value, longitude: -75, standardMeridian: -75 });',
      "const late = parseCivilDateTime({ date: '2024-03-10', time: '23:30' });",
      'const pillars = fourPillars({ datetime: late, longitude: -75, options: { standardMeridian: -75 } });',
      'console.log(JSON.stringify({',
      '  value: fields(value),',
      '  solar: fields(solar.真太阳时),',
      '  preservesType: !(value instanceof Date) && !(solar.真太阳时 instanceof Date),',
      '  json: JSON.stringify(value),',
      '  pillars: [pillars.年, pillars.月, pillars.日, pillars.时],',
      '}));',
    ].join('\n');
    const runInTimezone = TZ => JSON.parse(execFileSync(process.execPath, ['-e', script], {
      cwd: path.join(__dirname, '../../..'),
      env: { ...process.env, TZ },
      encoding: 'utf8',
    }));
    const utc = runInTimezone('UTC');
    const newYork = runInTimezone('America/New_York');

    expect(newYork).toEqual(utc);
    expect(newYork.value).toEqual([2024, 2, 10, 2, 30]);
    expect(newYork.preservesType).toBe(true);
    expect(newYork.json).toBe('"2024-03-10T02:30:00"');
  });

  test('普通 Date 的均时差与四柱不受宿主 DST 影响', () => {
    const script = [
      "const { fourPillars } = require('./core/calendar');",
      'const datetime = new Date(2024, 5, 15, 0, 0);',
      'const result = fourPillars({',
      '  datetime,',
      '  longitude: 120.0875,',
      "  options: { dayBoundary: '00:00' },",
      '});',
      'const solar = result.真太阳时信息.真太阳时;',
      'console.log(JSON.stringify({',
      '  solar: [solar.getFullYear(), solar.getMonth(), solar.getDate(), solar.getHours(), solar.getMinutes()],',
      '  preservesDateType: solar instanceof Date,',
      '  offset: result.真太阳时信息.总偏移分钟,',
      '  pillars: [result.年, result.月, result.日, result.时],',
      '}));',
    ].join('\n');
    const runInTimezone = TZ => JSON.parse(execFileSync(process.execPath, ['-e', script], {
      cwd: path.join(__dirname, '../../..'),
      env: { ...process.env, TZ },
      encoding: 'utf8',
    }));

    const utc = runInTimezone('UTC');
    expect(runInTimezone('America/New_York')).toEqual(utc);
    expect(utc.preservesDateType).toBe(true);
  });

  test.each([
    [{ date: '1955-02-29', time: '19:15' }, /日期/],
    [{ date: '1955-2-24', time: '19:15' }, /YYYY-MM-DD/],
    [{ date: '1955-02-24', time: '24:00' }, /HH:mm/],
    [{ date: '1955-02-24', time: '19:60' }, /HH:mm/],
    [{ date: '1955-02-24', time: '19:15:60' }, /HH:mm/],
  ])('拒绝非法民用日期时间：%j', (input, message) => {
    expect(typeof parseCivilDateTime).toBe('function');
    if (typeof parseCivilDateTime !== 'function') return;
    expect(() => parseCivilDateTime(input)).toThrow(message);
  });

  test('标准经线由 UTC offset 推导，未给时区保留东经 120 度', () => {
    expect(typeof standardMeridianOf).toBe('function');
    if (typeof standardMeridianOf !== 'function') return;
    expect(standardMeridianOf()).toBe(120);
    expect(standardMeridianOf({ utcOffsetMinutes: -480 })).toBe(-120);
    expect(standardMeridianOf({ utcOffsetMinutes: 330 })).toBe(82.5);
  });

  test.each([Infinity, NaN, -721, 841, '480'])('拒绝非法 UTC offset：%p', utcOffsetMinutes => {
    expect(typeof standardMeridianOf).toBe('function');
    if (typeof standardMeridianOf !== 'function') return;
    expect(() => standardMeridianOf({ utcOffsetMinutes })).toThrow(/utcOffsetMinutes|-720.*840/);
  });

  test('真太阳时使用时区参考经线并返回所用标准经线', () => {
    const datetime = new Date(1955, 1, 24, 19, 15);
    const result = trueSolarTime({
      datetime,
      longitude: -122.4194,
      utcOffsetMinutes: -480,
    });
    expect(result.标准经线).toBe(-120);
    expect(result.经度时差).toBeCloseTo((-122.4194 - -120) * 4, 4);
  });

  test('可显式指定标准经线，时区参数冲突时拒绝静默选边', () => {
    const datetime = new Date(1955, 1, 24, 19, 15);
    expect(trueSolarTime({ datetime, longitude: -122.4194, standardMeridian: -120 }).标准经线)
      .toBe(-120);
    expect(() => trueSolarTime({
      datetime,
      longitude: -122.4194,
      utcOffsetMinutes: -480,
      standardMeridian: 120,
    })).toThrow(/不一致/);
  });

  test('UTC+14 公开 offset 入口按日期变更线等价角计算经度差', () => {
    const datetime = new Date(2026, 0, 1, 12);
    const result = trueSolarTime({
      datetime,
      longitude: -157,
      utcOffsetMinutes: 840,
    });
    expect(result.标准经线).toBe(210);
    expect(result.经度时差).toBe(-28);

    const equivalent = trueSolarTime({
      datetime,
      longitude: -157,
      utcOffsetMinutes: 840,
      standardMeridian: -150,
    });
    expect(equivalent.标准经线).toBe(-150);
    expect(equivalent.经度时差).toBe(-28);
  });

  test('四柱排盘透传海外时区参数，旧调用仍使用东经 120 度', () => {
    const datetime = new Date(1955, 1, 24, 19, 15);
    const overseas = fourPillars({
      datetime,
      longitude: -122.4194,
      options: { utcOffsetMinutes: -480 },
    });
    const legacy = fourPillars({ datetime, longitude: -122.4194 });

    expect(overseas.真太阳时信息.标准经线).toBe(-120);
    expect(overseas.时).toBe('丁酉');
    expect(legacy.真太阳时信息.标准经线).toBe(120);
  });

  test('Einstein fixture 可原样透传 null offset 与 LMT 标准经线复算', () => {
    const fixtures = JSON.parse(fs.readFileSync(CELEBRITY_FIXTURE, 'utf8'));
    const item = fixtures.find(({ name }) => name === 'Albert Einstein');
    const result = fourPillars({
      datetime: parseCivilDateTime({ date: item.birthDate, time: item.birthTime }),
      longitude: item.longitude,
      options: {
        utcOffsetMinutes: item.utcOffsetMinutes,
        standardMeridian: item.standardMeridian,
      },
    });
    expect({ 年: result.年, 月: result.月, 日: result.日, 时: result.时 })
      .toEqual(item.expectedPillars);
  });

  test('fixture 使用规格指定的精确 oracle URL', () => {
    const fixtures = JSON.parse(fs.readFileSync(CELEBRITY_FIXTURE, 'utf8'));
    expect(Object.fromEntries(fixtures.map(({ name, oracleUrl }) => [name, oracleUrl])))
      .toEqual(EXPECTED_ORACLE_URLS);
  });
});
