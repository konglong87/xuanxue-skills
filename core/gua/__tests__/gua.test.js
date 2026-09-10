const {
  GUA64,
  bianGua,
  cuogua,
  guaFromLines,
  hugua,
  najia,
  zonggua,
} = require('../index');

describe('卦象核心', () => {
  test('六十四卦完整且编号唯一', () => {
    expect(GUA64).toHaveLength(64);
    expect(new Set(GUA64.map(item => item.name)).size).toBe(64);
    expect(new Set(GUA64.map(item => item.index)).size).toBe(64);
  });

  test('乾坤与变卦', () => {
    const qian = guaFromLines([1, 1, 1, 1, 1, 1]);
    expect(qian).toMatchObject({ index: 1, name: '乾', upper: '乾', lower: '乾' });
    expect(bianGua(qian, [1])).toMatchObject({ name: '姤', upper: '乾', lower: '巽' });
    expect(cuogua(qian)).toMatchObject({ index: 2, name: '坤' });
  });

  test('互卦、综卦与纳甲', () => {
    const gua = guaFromLines([1, 0, 1, 0, 1, 0]);
    expect(hugua(gua).lines).toHaveLength(6);
    expect(zonggua(gua).lines).toEqual([0, 1, 0, 1, 0, 1]);
    expect(najia(gua)).toEqual(expect.objectContaining({
      初爻: expect.any(String),
      上爻: expect.any(String),
    }));
  });
});
