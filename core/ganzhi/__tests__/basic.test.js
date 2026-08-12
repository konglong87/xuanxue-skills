const B = require('../basic');
const { TIANGAN, DIZHI, JIAZI, CANGGAN } = require('../constants');

describe('干支基础查询', () => {
  test('五行阴阳覆盖全部天干地支', () => {
    const elements = ['木', '火', '土', '金', '水'];
    [...TIANGAN, ...DIZHI].forEach(symbol => expect(elements).toContain(B.wuxingOf(symbol)));
    TIANGAN.forEach((stem, index) => expect(B.yinyangOf(stem)).toBe(index % 2 ? '阴' : '阳'));
    DIZHI.forEach((branch, index) => expect(B.yinyangOf(branch)).toBe(index % 2 ? '阴' : '阳'));
  });

  test('藏干覆盖 12 支并返回防修改副本', () => {
    expect(DIZHI.reduce((sum, branch) => sum + B.canggan(branch).length, 0)).toBe(28);
    const copy = B.canggan('寅');
    copy[0].gan = '癸';
    expect(CANGGAN.寅[0].gan).toBe('甲');
  });

  test('纳音覆盖六十甲子', () => {
    JIAZI.forEach(ganzhi => expect(typeof B.nayin(ganzhi)).toBe('string'));
    expect(B.nayin('甲子')).toBe('海中金');
  });

  test('五行生克完整环', () => {
    const cycle = ['木', '火', '土', '金', '水'];
    cycle.forEach((element, index) => {
      expect(B.shengke(element, element)).toBe('同');
      expect(B.shengke(element, cycle[(index + 1) % 5])).toBe('生');
      expect(B.shengke(element, cycle[(index + 2) % 5])).toBe('克');
      expect(B.shengke(element, cycle[(index + 3) % 5])).toBe('被克');
      expect(B.shengke(element, cycle[(index + 4) % 5])).toBe('被生');
    });
  });

  test('非法输入抛错', () => {
    expect(() => B.wuxingOf('X')).toThrow(/未知干支/);
    expect(() => B.canggan('甲')).toThrow(/不是地支/);
    expect(() => B.nayin('甲丑')).toThrow(/未知干支组合/);
  });
});
