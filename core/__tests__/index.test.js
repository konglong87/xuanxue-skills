const core = require('../index');

describe('core 汇总导出', () => {
  test('四层命名空间和 format 全部可达', () => {
    ['ganzhi', 'calendar', 'direction', 'naqi'].forEach(namespace => {
      expect(core[namespace]).toBeDefined();
      expect(typeof core[namespace].format).toBe('function');
    });
  });

  test('各任务关键函数从对应层可达', () => {
    ['shiShen', 'relation', 'hehun', 'chartDetails', 'tenGodStructure', 'marriageSignals']
      .forEach(name => expect(typeof core.ganzhi[name]).toBe('function'));
    ['fourPillars', 'solarToLunar', 'lunarToSolar', 'luckCycles', 'annualCycle', 'baziChart']
      .forEach(name => expect(typeof core.calendar[name]).toBe('function'));
    ['shanFromDegree', 'flyStars', 'declination'].forEach(name => expect(typeof core.direction[name]).toBe('function'));
    ['auditHouse', 'longhu', 'houseCenter'].forEach(name => expect(typeof core.naqi[name]).toBe('function'));
  });

  test('四柱 format 包含规则与流派分歧', () => {
    const result = core.calendar.fourPillars({
      datetime: new Date(2026, 5, 15, 23, 30),
      longitude: 121.47,
    });
    const text = core.calendar.format(result);
    expect(text).toContain(`年柱 ${result.年}`);
    expect(text).toContain('子时换日');
    expect(text).toMatch(/流派分歧|另一派/);
    expect(text).toContain(result.另一派.日);
  });

  test('方向和纳气 format 输出中文可读文本', () => {
    expect(core.direction.format(core.direction.shanFromDegree(180))).toMatch(/午山.*离卦/);
    expect(core.direction.format(core.direction.declination('北京', 2025))).toMatch(/磁偏角.*NOAA/s);
    const audit = core.naqi.auditHouse({ 床: '正北', 马桶: '正南' });
    expect(core.naqi.format(audit)).toMatch(/破格.*被压制.*破气/s);
  });

  test('干支 format 不泄漏对象默认字符串', () => {
    expect(core.ganzhi.format(core.ganzhi.ganHe('甲', '己'))).toMatch(/成立.*化.*土/s);
    expect(core.ganzhi.format(core.ganzhi.relation('寅', '亥'))).toContain('六合');
  });
});
