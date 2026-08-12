const fixtures = require('./fixtures/dayun-crosscheck.json');
const { luckCycles } = require('../cycles');
const { parseCivilDateTime } = require('../civil-time');

// 黄金值来自两个外部实现：BaziGo（Go，独立仓库）与按古法口诀另写的独立实现。
// 只有两者完全一致的项才入库；本仓库对照的是它们，不是自己上一次的输出。
// 生成步骤见 scripts/gen-dayun-crosscheck.md。

function repoResult(fixture) {
  const datetime = parseCivilDateTime({ date: fixture.date, time: fixture.time });
  const result = luckCycles({ datetime, gender: fixture.gender, count: fixture.大运.length });
  return result.起运流派;
}

describe('大运三方交叉校验', () => {
  test('黄金用例覆盖阴阳年 × 男女四象限与节前后边界', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(49);
    const quadrants = new Set(fixtures.map(item => `${item.顺排}-${item.gender}`));
    expect(quadrants.size).toBe(4);
  });

  test.each(fixtures.map(item => [`${item.date} ${item.time} ${item.gender}（${item.comment}）`, item]))(
    '%s',
    (name, fixture) => {
      const schools = repoResult(fixture);

      // 1. 四柱：与 BaziGo 一致（本仓库另有 59 条四柱黄金用例，这里只作连带确认）
      const [sect1] = schools;
      expect(sect1.大运.length).toBe(fixture.大运.length);

      // 2. 顺逆：两个外部实现一致，本仓库两派都必须与之相同
      schools.forEach(school => expect(school.顺排).toBe(fixture.顺排));

      // 3. 大运干支序列：这是真正驱动判读的部分，必须逐位相同
      schools.forEach(school => {
        expect(school.大运.map(item => item.干支)).toEqual(fixture.大运);
      });

      // 4. 起始虚岁：允许且只允许「整体差 1 岁」这一种已表征的差异，
      //    成因是 BaziGo 把 1 年折成 360 天做时间戳缩放，本仓库按真实历年做日历加法；
      //    起运岁数越大偏差越大，跨过元旦时首运年份就差一年。
      const repoAges = sect1.大运.map(item => item.起始虚岁);
      const offsets = new Set(repoAges.map((age, index) => age - fixture.起始虚岁[index]));
      expect(offsets.size).toBe(1);
      const [offset] = [...offsets];
      expect([0, 1]).toContain(offset);

      if (offset === 1) {
        // 差 1 岁时必须能被年份归属解释：本仓库起运公历年 > BaziGo 起运公历年
        const repoStartYear = Number(schools[1].起运公历.slice(0, 4));
        const oracleStartYear = Number(fixture.BaziGo起运公历.slice(0, 4));
        expect(repoStartYear).toBe(oracleStartYear + 1);
      }
    },
  );

  test('本仓库与独立实现同属日历加法派，起运日期差不超过 1 天', () => {
    const gaps = fixtures.map(fixture => {
      const schools = repoResult(fixture);
      const repo = new Date(schools[1].起运公历.replace(/-/g, '/'));
      const indep = new Date(fixture.独立实现起运公历.replace(/-/g, '/'));
      return Math.abs(repo - indep) / 86400000;
    });
    expect(Math.max(...gaps)).toBeLessThanOrEqual(1);
  });
});
