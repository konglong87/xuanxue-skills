const { parseCivilDateTime } = require('../civil-time');
const { luckCycles, annualCycle, ganzhiYearOf } = require('../cycles');
const { fourPillars } = require('../pillars');

describe('起运、大运与流年', () => {
  test('Steve Jobs 真太阳时同时返回两种起运折算法与逆排大运', () => {
    const datetime = parseCivilDateTime({ date: '1955-02-24', time: '18:51:28' });
    const result = luckCycles({ datetime, gender: 'male', count: 2 });

    expect(result.起运流派).toHaveLength(2);
    expect(result.起运流派.map(item => item.sect)).toEqual([1, 2]);
    expect(result.起运流派[0]).toMatchObject({
      sect: 1,
      折算法: '按时辰天数折算',
      起运年: 6,
      起运月: 7,
      起运日: 10,
      起运时: 0,
      顺排: false,
    });
    expect(result.起运流派[1]).toMatchObject({
      sect: 2,
      折算法: '按分钟折算',
      起运年: 6,
      起运月: 7,
      起运日: 12,
      起运时: 20,
      顺排: false,
    });
    expect(result.起运精度).toEqual({
      sect1: '时辰级：沿用 lunar-javascript 按时辰天数折算',
      sect2: '分钟级：顺排取出生时刻至下一节、逆排取上一节至出生时刻的有向秒差，四舍五入到最近整分钟',
    });
    result.起运流派.forEach(school => {
      expect(school.童限).toMatchObject({ 起始年份: 1955, 结束年份: 1960, 起始虚岁: 1, 结束虚岁: 6 });
      expect(school.大运).toHaveLength(2);
      expect(school.大运[0]).toMatchObject({
        干支: '丁丑',
        起始年份: 1961,
        结束年份: 1970,
        起始虚岁: 7,
        结束虚岁: 16,
      });
      expect(school.大运[0].流年).toHaveLength(10);
      expect(school.大运[0].流年[0]).toEqual({ 年份: 1961, 虚岁: 7, 干支: '辛丑' });
    });
  });

  test.each([
    ['阳年男命', '1990-08-15', 'male', true],
    ['阳年女命', '1990-08-15', 'female', false],
    ['阴年男命', '1955-02-24', 'male', false],
    ['阴年女命', '1955-02-24', 'female', true],
  ])('%s按年干阴阳与性别确定顺逆', (name, date, gender, forward) => {
    const result = luckCycles({
      datetime: parseCivilDateTime({ date, time: '10:30' }),
      gender,
      count: 1,
    });
    expect(result.起运流派.every(item => item.顺排 === forward)).toBe(true);
  });

  test.each([
    ['顺排取出生时刻到下一节', '1990-08-15', '10:30:01', 14],
    ['逆排取上一节到出生时刻', '1955-02-24', '18:51:01', 18],
  ])('sect 2 秒级边界：%s', (name, date, time, startHour) => {
    const result = luckCycles({
      datetime: parseCivilDateTime({ date, time }),
      gender: 'male',
      count: 1,
    });
    expect(result.起运流派[1].起运时).toBe(startHour);
  });

  test('sect 2 跨年秒级取整不改变真实出生年、童限和首运虚岁', () => {
    const schools = ['23:59:20', '23:59:45'].map(time => luckCycles({
      datetime: parseCivilDateTime({ date: '1990-12-31', time }),
      gender: 'male',
      count: 1,
    }).起运流派[1]);

    schools.forEach(school => {
      expect(school.出生年份).toBe(1990);
      expect(school.童限).toEqual({
        起始年份: 1990,
        结束年份: 1991,
        起始虚岁: 1,
        结束虚岁: 2,
      });
      expect(school.大运[0]).toMatchObject({
        干支: '己丑',
        起始年份: 1992,
        起始虚岁: 3,
      });
    });
  });

  test('两派零起运均不产生倒置童限', () => {
    const birth = '1955-03-06 16:30:40';
    const schools = luckCycles({
      datetime: parseCivilDateTime({ date: '1955-03-06', time: '16:30:40' }),
      gender: 'female',
      count: 1,
    }).起运流派;

    schools.forEach(school => {
      expect(school).toMatchObject({
        起运年: 0,
        起运月: 0,
        起运日: 0,
        起运时: 0,
        起运公历: birth,
        出生年份: 1955,
        童限: null,
      });
      expect(school.大运[0]).toMatchObject({
        干支: '己卯',
        起始年份: 1955,
        起始虚岁: 1,
      });
    });
    expect(schools[1].起运公历 <= birth).toBe(true);
  });

  test.each([
    ['16:30:28', 0],
    ['16:30:27', 2],
    ['16:30:26', 2],
  ])('sect 2 距节令 29/30/31 秒的半分钟边界：%s', (time, startHour) => {
    const school = luckCycles({
      datetime: parseCivilDateTime({ date: '1955-03-06', time }),
      gender: 'female',
      count: 1,
    }).起运流派[1];
    expect(school.起运时).toBe(startHour);
  });

  test('2026 流年为丙午并给出日主十神和日支关系', () => {
    expect(annualCycle(2026, '丙', '辰')).toEqual({
      年份: 2026,
      干支: '丙午',
      天干: '丙',
      地支: '午',
      天干十神: '比肩',
      与日支关系: [],
      边界说明: '流年以立春为界，不以公历 1 月 1 日为界',
    });
    expect(annualCycle(2026, '甲', '子').与日支关系).toContain('六冲');
  });

  test.each([
    [{ datetime: new Date(), gender: 'unknown' }, /gender|male.*female/],
    [{ datetime: '1955-02-24', gender: 'male' }, /datetime/],
    [{ datetime: new Date(), gender: 'male', count: 0 }, /count/],
  ])('拒绝非法起运输入：%p', input => {
    expect(() => luckCycles(input)).toThrow();
  });

  test('大运段数支持 1~12 且拒绝超出人类寿命场景的请求', () => {
    const input = {
      datetime: parseCivilDateTime({ date: '1990-08-15', time: '10:30' }),
      gender: 'male',
    };
    expect(luckCycles({ ...input, count: 12 }).起运流派[1].大运).toHaveLength(12);
    expect(() => luckCycles({ ...input, count: 13 })).toThrow(/count.*1.*12|1~12/);
  });

  test.each([
    [1799, '甲', '子', /1800.*2300/],
    [2301, '甲', '子', /1800.*2300/],
    [2026.5, '甲', '子', /整数/],
    [2026, '子', '子', /日干/],
    [2026, '甲', '甲', /日支/],
  ])('拒绝非法流年输入', (year, stem, branch, message) => {
    expect(() => annualCycle(year, stem, branch)).toThrow(message);
  });
});

describe('干支年归属（立春为界）', () => {
  test.each([
    ['立春前一天仍属上一干支年', '2026-02-02', '12:00', 2025],
    ['立春当天交节前仍属上一干支年', '2026-02-03', '19:00', 2025],
    ['立春交节后进入本干支年', '2026-02-03', '21:00', 2026],
    ['年中属本干支年', '2026-08-12', '09:00', 2026],
    ['元旦属上一干支年', '2026-01-01', '00:30', 2025],
  ])('%s', (name, date, time, expected) => {
    expect(ganzhiYearOf(parseCivilDateTime({ date, time }))).toBe(expected);
  });

  test('干支年与四柱年柱口径一致', () => {
    const datetime = parseCivilDateTime({ date: '2026-01-20', time: '10:00' });
    const year = ganzhiYearOf(datetime);
    expect(annualCycle(year, '丙', '辰').干支)
      .toBe(fourPillars({ datetime, options: { useTrueSolar: false } }).年);
  });
});
