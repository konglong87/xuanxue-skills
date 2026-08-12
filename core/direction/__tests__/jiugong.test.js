const J = require('../jiugong');

describe('洛书与飞星', () => {
  test('标准洛书横竖斜皆为 15', () => {
    expect(J.LUOSHU).toEqual([[4, 9, 2], [3, 5, 7], [8, 1, 6]]);
    const matrix = J.LUOSHU;
    for (let index = 0; index < 3; index++) {
      expect(matrix[index].reduce((sum, value) => sum + value, 0)).toBe(15);
      expect(matrix[0][index] + matrix[1][index] + matrix[2][index]).toBe(15);
    }
    expect(matrix[0][0] + matrix[1][1] + matrix[2][2]).toBe(15);
    expect(matrix[0][2] + matrix[1][1] + matrix[2][0]).toBe(15);
  });

  test('九数方位双向一致', () => {
    const expected = ['正北', '西南', '正东', '东南', '中宫', '西北', '正西', '东北', '正南'];
    expected.forEach((direction, index) => {
      expect(J.luoshuOf(direction)).toBe(index + 1);
      expect(J.fangweiOf(index + 1)).toBe(direction);
    });
  });

  test('顺逆飞完整且五入中顺飞还原元旦盘', () => {
    expect(J.flyStars(5, '顺飞')).toMatchObject({ 正北: 1, 正南: 9, 中宫: 5 });
    expect(J.flyStars(9, '顺飞').西北).toBe(1);
    expect(J.flyStars(1, '逆飞').西北).toBe(9);
    for (let center = 1; center <= 9; center++) {
      ['顺飞', '逆飞'].forEach(direction => {
        expect(Object.values(J.flyStars(center, direction)).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });
    }
  });
});

describe('三元九运', () => {
  test('运与边界年份正确', () => {
    expect(J.yunOf(2023).运).toBe(8);
    expect(J.yunOf(2024)).toMatchObject({ 运: 9, 区间: [2024, 2043] });
    expect(J.yunOf(2044).运).toBe(1);
  });

  test('C2 临时口径与通说并列返回', () => {
    const sixth = J.yunOf(1970);
    expect(sixth).toMatchObject({ 运: 6, 元: '下元', 标准元: '中元', 临时口径: true });
    expect(J.yunOf(2026)).toMatchObject({ 运: 9, 元: '下元', 标准元: '下元' });
    expect(J.yunOf(2044).元).not.toBe('下元');
    expect(sixth.依据).toMatch(/C2|临时|1964/);
  });
});
