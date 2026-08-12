const fs = require('fs');
const path = require('path');
const { fourPillars } = require('../pillars');
const { parseCivilDateTime } = require('../civil-time');

// 与外部 oracle BaziGo 的交叉校验。fixture 由 scripts/gen-bazigo-golden.md 的步骤生成，
// 已入库，因此不再依赖本机是否存在 BaziGo 仓库。
//
// 对照口径：BaziGo 只接受民用年月日时分秒，不做真太阳时校正，日柱直接取公历日
// （等价子夜换日）。因此每条用例都显式带 { useTrueSolar: false, dayBoundary: '00:00' }。
// 这也意味着**经度与真太阳时不在本组的校验范围内** —— 那部分由 truesolar 与 pillars
// 自身的测试锁定，BaziGo 无法充当该维度的基准。
//
// 入参一律用 parseCivilDateTime 构造民用墙钟值，不用 new Date(ISO)：后者会被运行机器
// 的时区与历史夏令时改写（例如 1990 年 6 月中国处于 UTC+9）。
//
// 少数用例带 `差异` 字段，记录已查明原因、不视为缺陷的实现差异。这些用例仍然断言
// 本仓库的取值等于 `差异.本仓库`，使已知差异被钉死，不会悄悄漂移。

const FIXTURE = path.join(__dirname, 'fixtures', 'bazigo-golden.json');
const cases = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

const pillarsOf = testCase => fourPillars({
  datetime: parseCivilDateTime({ date: testCase.date, time: testCase.time }),
  longitude: testCase.longitude,
  options: testCase.options,
});

describe('与 BaziGo 交叉校验', () => {
  test('基准用例不少于 20 条', () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  test('覆盖立春、12 个节前后与换日区间', () => {
    const comments = cases.map(item => item.comment).join('\n');
    expect(comments).toMatch(/立春/);
    expect(comments).toMatch(/换日区间/);
    expect(comments).toMatch(/闰/);
    const jieCovered = new Set(
      cases.map(item => /(小寒|立春|惊蛰|清明|立夏|芒种|小暑|立秋|白露|寒露|立冬|大雪)/.exec(item.comment))
        .filter(Boolean)
        .map(match => match[1]),
    );
    expect(jieCovered.size).toBe(12);
  });

  test.each(cases)('$date $time 年月日一致 · $comment', testCase => {
    const result = pillarsOf(testCase);
    expect({ 年: result.年, 月: result.月, 日: result.日 })
      .toEqual({ 年: testCase.年, 月: testCase.月, 日: testCase.日 });
  });

  const 同口径 = cases.filter(item => !item.差异);
  test.each(同口径)('$date $time 时柱一致 · $comment', testCase => {
    expect(pillarsOf(testCase).时).toBe(testCase.时);
  });

  const 有差异 = cases.filter(item => item.差异);
  test('已记录的差异只出现在时柱，且都在 23:00 之后', () => {
    expect(有差异.length).toBeGreaterThan(0);
    有差异.forEach(testCase => {
      expect(testCase.差异.字段).toBe('时');
      expect(testCase.差异.原因).toMatch(/\S/);
      expect(Number(testCase.time.slice(0, 2))).toBeGreaterThanOrEqual(23);
    });
  });

  test.each(有差异)('$date $time 已知时柱差异保持不变 · $comment', testCase => {
    const result = pillarsOf(testCase);
    expect(result.时).toBe(testCase.差异.本仓库);
    expect(result.时).not.toBe(testCase.时);
  });
});
