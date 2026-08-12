const C = require('../center');

const RECTANGLE = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 8 }, { x: 0, y: 8 }];
const L_SHAPE = [
  { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 },
  { x: 6, y: 5 }, { x: 6, y: 8 }, { x: 0, y: 8 },
];

describe('房屋主体中心双算法', () => {
  test('对角线法取外接矩形中心且不受顶点顺序影响', () => {
    expect(C.centerByDiagonal(RECTANGLE)).toMatchObject({ x: 5, y: 4, 算法: '对角线法' });
    expect(C.centerByDiagonal([...RECTANGLE].reverse())).toMatchObject({ x: 5, y: 4 });
    expect(C.centerByDiagonal(L_SHAPE)).toMatchObject({ x: 5, y: 4 });
  });

  test('实墙逼近法在矩形上与对角线一致', () => {
    expect(C.centerBySolidWall(RECTANGLE)).toMatchObject({ x: 5, y: 4, 算法: '实墙逼近法' });
  });

  test('L 形实墙中心避开缺角并返回采用矩形', () => {
    const result = C.centerBySolidWall(L_SHAPE);
    expect(result.采用矩形).toBeDefined();
    expect(result.x).toBeLessThanOrEqual(5);
    expect(result.y).toBeLessThan(4);
  });

  test('规则户型一致，L 形并列提示分歧', () => {
    expect(C.houseCenter(RECTANGLE)).toMatchObject({ 一致: true, 偏差: 0 });
    const result = C.houseCenter(L_SHAPE);
    expect(result.一致).toBe(false);
    expect(result.偏差).toBeGreaterThan(0);
    expect(result.提示).toMatch(/分歧|凹凸|缺角/);
    expect(result.对角线法).toBeDefined();
    expect(result.实墙逼近法).toBeDefined();
  });

  test('非法多边形与步长抛错', () => {
    expect(() => C.centerByDiagonal([{ x: 0, y: 0 }])).toThrow(/至少.*3/);
    expect(() => C.centerBySolidWall(RECTANGLE, { step: 0 })).toThrow(/step/);
  });
});
