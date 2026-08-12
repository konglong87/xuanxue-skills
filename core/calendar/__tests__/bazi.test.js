const fs = require('fs');
const path = require('path');
const { baziChart } = require('../bazi');

const FIXTURES = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../../../tests/fixtures/celebrity-bazi.json'),
  'utf8',
));

function fixtureInput(item) {
  return {
    birthDate: item.birthDate,
    birthTime: item.birthTime,
    longitude: item.longitude,
    latitude: item.latitude,
    utcOffsetMinutes: item.utcOffsetMinutes,
    standardMeridian: item.standardMeridian,
    gender: 'male',
    targetYear: 2026,
  };
}

describe('完整八字确定性命盘', () => {
  test.each(FIXTURES)('$name 四柱逐项匹配高可靠度 fixture', item => {
    const result = baziChart(fixtureInput(item));
    expect({
      年: result.四柱结果.年,
      月: result.四柱结果.月,
      日: result.四柱结果.日,
      时: result.四柱结果.时,
    }).toEqual(item.expectedPillars);
    expect(result.四柱结果.另一派).toBeDefined();
    expect(result.命盘详情.日主.天干).toBe(item.expectedPillars.日[0]);
    expect(result.起运大运.起运流派).toHaveLength(2);
    expect(result.目标流年.干支).toBe('丙午');
  });

  test('Steve Jobs 真太阳时按精确秒差计算两派起运', () => {
    const jobs = FIXTURES.find(item => item.name === 'Steve Jobs');
    const result = baziChart(fixtureInput(jobs));
    const [sect1, sect2] = result.起运大运.起运流派;

    expect(result.四柱结果.真太阳时信息.真太阳时.toString()).toBe('1955-02-24T18:51:28');
    expect(sect1).toMatchObject({
      sect: 1, 顺排: false, 起运年: 6, 起运月: 7, 起运日: 10, 起运时: 0,
    });
    expect(sect2).toMatchObject({
      sect: 2, 顺排: false, 起运年: 6, 起运月: 7, 起运日: 12, 起运时: 20,
    });
    expect(sect1.大运[0]).toMatchObject({
      干支: '丁丑', 起始年份: 1961, 结束年份: 1970, 起始虚岁: 7, 结束虚岁: 16,
    });
    expect(result.目标流年).toMatchObject({ 年份: 2026, 干支: '丙午' });
  });

  test('关闭真太阳时后四柱和大运都使用出生民用时间', () => {
    const jobs = FIXTURES.find(item => item.name === 'Steve Jobs');
    const result = baziChart({ ...fixtureInput(jobs), options: { useTrueSolar: false, dayBoundary: '00:00' } });

    expect(result.四柱结果.采用规则).toMatchObject({ useTrueSolar: false, dayBoundary: '00:00' });
    expect(result.四柱结果.真太阳时信息).toBeNull();
    expect(result.起运大运.起运流派[1]).toMatchObject({ 起运年: 6, 起运月: 7, 起运日: 14, 起运时: 18 });
  });

  test('input 记录实际采用的时区、经线、坐标与选项', () => {
    const einstein = FIXTURES.find(item => item.name === 'Albert Einstein');
    const result = baziChart(fixtureInput(einstein));
    expect(result.input).toEqual({
      birthDate: '1879-03-14',
      birthTime: '11:30',
      longitude: 10,
      latitude: 48.4,
      utcOffsetMinutes: null,
      standardMeridian: 10,
      gender: 'male',
      targetYear: 2026,
      options: { dayBoundary: '23:00', useTrueSolar: true },
    });
    expect(result.四柱结果.真太阳时信息.标准经线).toBe(10);
  });

  test.each([
    [{ dayBoundary: '' }, /dayBoundary.*23:00.*00:00/],
    [{ dayBoundary: null }, /dayBoundary.*23:00.*00:00/],
    [{ useTrueSolar: 'false' }, /useTrueSolar.*boolean|布尔/],
    [{ useTrueSolar: null }, /useTrueSolar.*boolean|布尔/],
  ])('拒绝显式非法排盘选项：%p', (options, message) => {
    expect(() => baziChart({
      birthDate: '1955-02-24',
      birthTime: '19:15',
      longitude: -122.4194,
      utcOffsetMinutes: -480,
      gender: 'male',
      targetYear: 2026,
      options,
    })).toThrow(message);
  });

  test('targetYear 必填，不读取运行环境系统年份', () => {
    expect(() => baziChart({
      birthDate: '1955-02-24',
      birthTime: '19:15',
      longitude: -122.4194,
      utcOffsetMinutes: -480,
      gender: 'male',
    })).toThrow(/targetYear.*整数|targetYear.*1800.*2300/);
  });

  test.each([
    [{ birthDate: '1955-02-24', birthTime: '19:15', longitude: -181, gender: 'male' }, /longitude|经度.*-180.*180/],
    [{ birthDate: '1955-02-24', birthTime: '19:15', longitude: 181, gender: 'male' }, /longitude|经度.*-180.*180/],
    [{ birthDate: '1955-02-24', birthTime: '19:15', longitude: 120, latitude: -91, gender: 'male' }, /latitude|纬度.*-90.*90/],
    [{ birthDate: '1955-02-24', birthTime: '19:15', longitude: 120 }, /gender|性别/],
    [{ birthDate: '1955-02-30', birthTime: '19:15', longitude: 120, gender: 'male' }, /日期/],
  ])('拒绝非法排盘输入：%p', input => {
    expect(() => baziChart(input)).toThrow();
  });
});
