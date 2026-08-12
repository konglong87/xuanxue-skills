const Z = require('../zones');

const QI_DIRECTIONS = ['西北', '正西', '东北', '正南'];
const SHUI_DIRECTIONS = ['正北', '西南', '正东', '东南'];

describe('气位水位与家具合规', () => {
  test('八方位按洛书数分区，中宫单列', () => {
    QI_DIRECTIONS.forEach(direction => expect(Z.zoneOf(direction)).toMatchObject({ 区: '气位' }));
    SHUI_DIRECTIONS.forEach(direction => expect(Z.zoneOf(direction)).toMatchObject({ 区: '水位' }));
    expect(Z.zoneOf('中宫')).toEqual({ 区: '中宫', 洛书数: 5, 宜设: [] });
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
