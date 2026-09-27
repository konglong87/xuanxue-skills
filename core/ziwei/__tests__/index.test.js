const ziwei = require('../index');

describe('紫微斗数命名空间', () => {
  test('导出排盘、格式化和固定常量', () => {
    expect(typeof ziwei.ziweiChart).toBe('function');
    expect(typeof ziwei.format).toBe('function');
    expect(ziwei.PALACE_NAMES).toHaveLength(12);
    expect(ziwei.MAIN_STARS).toHaveLength(14);
    expect(Object.isFrozen(ziwei.PALACE_NAMES)).toBe(true);
  });
});
