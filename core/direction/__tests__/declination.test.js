const path = require('path');
const D = require('../declination');

const TEST_TABLE = {
  _历元: 2025,
  _来源: '固定逻辑测试表',
  cities: {
    甲城: { lat: 40, lng: 116, declination: -6.5, secularChange: 0.1 },
    乙城: { lat: 44, lng: 88, declination: 3.2, secularChange: -0.05 },
  },
};

describe('磁偏角逻辑', () => {
  test('按城市取值并按年变化率修正', () => {
    expect(D.declination('甲城', 2025, { table: TEST_TABLE })).toMatchObject({
      磁偏角: -6.5, 历元: 2025, 已做长期修正: false, 来源: '固定逻辑测试表',
    });
    expect(D.declination('甲城', 2035, { table: TEST_TABLE })).toMatchObject({
      磁偏角: -5.5, 已做长期修正: true, 目标年: 2035,
      模型有效期: [2025, 2029], 超出模型有效期: true,
    });
    expect(D.declination('甲城', undefined, { table: TEST_TABLE }).磁偏角).toBe(-6.5);
  });

  test('未收录与未填数据拒绝估算', () => {
    expect(() => D.declination('火星城', 2025, { table: TEST_TABLE })).toThrow(/未收录|nearestCity/);
    const empty = { _历元: 2025, cities: { 丙城: { lat: 0, lng: 0, declination: null, secularChange: null } } };
    expect(() => D.declination('丙城', 2025, { table: empty })).toThrow(/未填|权威源/);
  });

  test('磁北转真北并归一到 0~360', () => {
    expect(D.magneticToTrue(180, '甲城', 2025, { table: TEST_TABLE }).真北度数).toBeCloseTo(173.5, 6);
    expect(D.magneticToTrue(3, '甲城', 2025, { table: TEST_TABLE }).真北度数).toBeCloseTo(356.5, 6);
    expect(D.magneticToTrue(358, '乙城', 2025, { table: TEST_TABLE }).真北度数).toBeCloseTo(1.2, 6);
  });

  test('最近邻回退与误差警示', () => {
    expect(D.nearestCity(40.5, 116.5, { table: TEST_TABLE })).toBe('甲城');
    expect(D.nearestCity(43, 89, { table: TEST_TABLE })).toBe('乙城');
    expect(D.declination('甲城', 2025, { table: TEST_TABLE }).警示).toMatch(/干扰|误差|卫星地图/);
    expect(D.declination('甲城', 2035, { table: TEST_TABLE }).警示).toMatch(/超出.*有效期|重新查询/);
  });
});

describe('NOAA 真实数据门禁', () => {
  const table = require(path.join(__dirname, '..', 'data', 'declination-cn.json'));

  test('至少 12 城且结构和历元完整', () => {
    expect(Object.keys(table.cities).length).toBeGreaterThanOrEqual(12);
    expect(typeof table._历元).toBe('number');
    Object.values(table.cities).forEach(city => {
      expect(typeof city.lat).toBe('number');
      expect(typeof city.lng).toBe('number');
      expect(Number.isFinite(city.declination)).toBe(true);
      expect(Number.isFinite(city.secularChange)).toBe(true);
      expect(Math.abs(city.declination)).toBeLessThan(30);
    });
    const values = Object.values(table.cities).map(city => city.declination);
    expect(values.some(value => value > 0)).toBe(true);
    expect(values.some(value => value < 0)).toBe(true);
  });

  test('权威值与来源已填入', () => {
    expect(Object.entries(table.cities).filter(([, city]) => city.declination === null).map(([name]) => name)).toEqual([]);
    expect(table._来源).toMatch(/NOAA.*WMM2025/);
  });
});
