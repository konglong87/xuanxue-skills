const Z = require('../zones');

const QI_DIRECTIONS = ['西北', '正西', '东北', '正南'];
const SHUI_DIRECTIONS = ['正北', '西南', '正东', '东南'];

describe('气位水位与家具合规', () => {
  test('八方位按洛书数分区，中宫单列', () => {
    QI_DIRECTIONS.forEach(direction => expect(Z.zoneOf(direction)).toMatchObject({ 区: '气位' }));
    SHUI_DIRECTIONS.forEach(direction => expect(Z.zoneOf(direction)).toMatchObject({ 区: '水位' }));
    expect(Z.zoneOf('中宫')).toEqual({
      区: '中宫', 洛书数: 5, 宜设: [], 适用性: expect.objectContaining({ 窗口: '1964–2043' }),
    });
  });

  test('穷举登记物品与八方位', () => {
    Z.QI_ITEMS.forEach(item => {
      QI_DIRECTIONS.forEach(direction => expect(Z.checkPlacement(item, direction).合规).toBe(true));
      SHUI_DIRECTIONS.forEach(direction => expect(Z.checkPlacement(item, direction).合规).toBe(false));
    });
    Z.SHUI_ITEMS.forEach(item => {
      SHUI_DIRECTIONS.forEach(direction => expect(Z.checkPlacement(item, direction).合规).toBe(true));
      QI_DIRECTIONS.forEach(direction => expect(Z.checkPlacement(item, direction).合规).toBe(false));
    });
  });

  test('床在水位被压制，马桶在气位破气', () => {
    expect(Z.checkPlacement('床', '正北')).toMatchObject({ 合规: false, 判定: '被压制' });
    expect(Z.checkPlacement('马桶', '正南')).toMatchObject({ 合规: false, 判定: '破气' });
  });

  test('未知物品不臆断，整宅审计分类聚合', () => {
    expect(Z.checkPlacement('鱼缸', '正南').合规).toBeNull();
    const result = Z.auditHouse({ 床: '正北', 马桶: '正南', 灶: '正西', 鱼缸: '东北' });
    expect(result.破格项).toHaveLength(2);
    expect(result.合规项).toHaveLength(1);
    expect(result.未判定).toHaveLength(1);
    expect(result.摘要).toMatch(/2 项破格/);
  });
});

describe('适用窗口越界防护', () => {
  test('窗口常量为资料所述的 1964–2043 并冻结', () => {
    expect(Z.APPLICABLE_WINDOW).toEqual({ 起: 1964, 止: 2043 });
    expect(Object.isFrozen(Z.APPLICABLE_WINDOW)).toBe(true);
  });

  test.each([1964, 2000, 2043])('窗口内的 %s 年标为适用', year => {
    expect(Z.zoneOf('正南', { year }).适用性).toMatchObject({ 适用: true, 窗口: '1964–2043' });
  });

  test.each([1963, 2044, 2100])('窗口外的 %s 年标为不适用并给出警示', year => {
    const { 适用性 } = Z.zoneOf('正南', { year });
    expect(适用性.适用).toBe(false);
    expect(适用性.警示).toMatch(/1964|2043|超出|适用窗口/);
    expect(适用性.警示).toMatch(/C2|机制未裁决|未裁决/);
  });

  test('不给年份时不擅自取当前年，标为未核对并保持可复现', () => {
    const { 适用性 } = Z.zoneOf('正南');
    expect(适用性.适用).toBeNull();
    expect(适用性.警示).toMatch(/未提供年份|未核对/);
    expect(Z.zoneOf('正南')).toEqual(Z.zoneOf('正南'));
  });

  test('越界不改变分区结果，只附警示 —— 不擅自反转气水', () => {
    const inside = Z.zoneOf('正南', { year: 2000 });
    const outside = Z.zoneOf('正南', { year: 2100 });
    expect(outside.区).toBe(inside.区);
    expect(outside.洛书数).toBe(inside.洛书数);
  });

  test('Z.checkPlacement 与 Z.auditHouse 逐项透传适用性，整宅另给一次窗口结论', () => {
    const placement = Z.checkPlacement('床', '正南', { year: 2100 });
    expect(placement.适用性.适用).toBe(false);

    const audit = Z.auditHouse({ 床: '正南', 马桶: '正北' }, { year: 2100 });
    expect(audit.适用性.适用).toBe(false);
    expect(audit.摘要).toMatch(/适用窗口|超出/);
    [...audit.合规项, ...audit.破格项].forEach(item => {
      expect(item.适用性.适用).toBe(false);
    });
  });

  test('年份非整数即报错，不静默降级', () => {
    expect(() => Z.zoneOf('正南', { year: '2000' })).toThrow(/年份/);
    expect(() => Z.zoneOf('正南', { year: 2000.5 })).toThrow(/年份/);
  });
});
