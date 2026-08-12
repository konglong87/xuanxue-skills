const { jieqiTable, prevJie, nextJie, JIE12 } = require('../jieqi');

describe('二十四节气', () => {
  test('每年恰好 24 项且时刻递增', () => {
    const table = jieqiTable(2026);
    expect(table).toHaveLength(24);
    for (let index = 1; index < table.length; index++) {
      expect(table[index].时刻.getTime()).toBeGreaterThan(table[index - 1].时刻.getTime());
    }
  });

  test('月柱边界只采用 12 个节', () => {
    expect(JIE12).toHaveLength(12);
    expect(JIE12).toContain('立春');
    expect(JIE12).toContain('惊蛰');
    expect(JIE12).not.toContain('雨水');
    expect(JIE12).not.toContain('春分');
    expect(jieqiTable(2026).filter(item => item.是节)).toHaveLength(12);
  });

  test('立春在 2 月 3 至 5 日', () => {
    const lichun = jieqiTable(2026).find(item => item.名 === '立春');
    expect(lichun.时刻.getMonth()).toBe(1);
    expect(lichun.时刻.getDate()).toBeGreaterThanOrEqual(3);
    expect(lichun.时刻.getDate()).toBeLessThanOrEqual(5);
  });

  test('prevJie 与 nextJie 只返回节且距离为正', () => {
    const date = new Date(2026, 1, 16, 12);
    const prev = prevJie(date);
    const next = nextJie(date);
    expect(JIE12).toContain(prev.名);
    expect(JIE12).toContain(next.名);
    expect(prev.时刻.getTime()).toBeLessThanOrEqual(date.getTime());
    expect(next.时刻.getTime()).toBeGreaterThan(date.getTime());
    expect(prev.相差天数).toBeGreaterThanOrEqual(0);
    expect(next.相差天数).toBeGreaterThan(0);
  });
});
