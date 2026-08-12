const P = require('../patterns');

describe('龙虎、水灶与凡尔赛判据', () => {
  test('龙绕虎绕与逼压警示', () => {
    expect(P.longhu({ 左墙连贯: true })).toMatchObject({ 格局: '龙绕' });
    expect(P.longhu({ 右墙连贯: true })).toMatchObject({ 格局: '虎绕' });
    expect(P.longhu({ 左墙连贯: true, 左侧逼压: true }).警示).toMatch(/压抑|抑郁|换头睡/);
    expect(P.longhu({ 右墙连贯: true, 右侧逼压: true }).警示).toMatch(/叛逆|换头睡/);
    expect(P.longhu({}).格局).toBeNull();
  });

  test('90 度容差内为水火相刑', () => {
    [88, 90, 92, 268, 270, 272].forEach(angle => {
      expect(P.zaoCao({ 夹角: angle })).toMatchObject({ 格局: '水火相刑', 判定: '大忌' });
    });
  });

  test('同线右侧为收虎水并复述参照系', () => {
    const result = P.zaoCao({ 夹角: 0, 背对灶台时水槽在: '右' });
    expect(result).toMatchObject({ 格局: '收虎水', 判定: '顶级配置' });
    expect(result.后果).toMatch(/偏财/);
    expect(result.参照系).toMatch(/背对灶台/);
    expect(P.zaoCao({ 夹角: 0, 背对灶台时水槽在: '左' }).格局).not.toBe('收虎水');
  });

  test('楼门阳台反向容差与跨零度', () => {
    expect(P.versailles({ 楼门朝向: 0, 阳台朝向: 180 }).陷阱).toBe(true);
    expect(P.versailles({ 楼门朝向: 350, 阳台朝向: 170 }).陷阱).toBe(true);
    expect(P.versailles({ 楼门朝向: 0, 阳台朝向: 165 }).陷阱).toBe(true);
    expect(P.versailles({ 楼门朝向: 0, 阳台朝向: 120 }).陷阱).toBe(false);
    expect(P.versailles({ 楼门朝向: 90, 阳台朝向: 90 }).陷阱).toBe(false);
  });
});
