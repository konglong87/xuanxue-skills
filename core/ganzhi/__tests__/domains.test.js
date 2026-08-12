const { tenGodStructure, marriageSignals } = require('../domains');

describe('领域确定性信号', () => {
  test('十神结构逐项保留显干与藏干位置，不把日干重复算作比肩', () => {
    const result = tenGodStructure({
      年: '庚子', 月: '辛丑', 日: '丙寅', 时: '壬辰',
    });

    expect(result.日主).toBe('丙');
    expect(result.十神.偏财.显干).toEqual([{ 柱: '年', 干: '庚' }]);
    expect(result.十神.正财.显干).toEqual([{ 柱: '月', 干: '辛' }]);
    expect(result.十神.正财.藏干).toContainEqual({
      柱: '月', 地支: '丑', 干: '辛', 类型: '余气',
    });
    expect(result.十神.正财.位置).toEqual([
      { 柱: '月', 层: '天干', 干: '辛' },
      { 柱: '月', 层: '藏干', 干: '辛', 地支: '丑', 藏干类型: '余气' },
    ]);
    expect(result.十神.七杀.显干).toEqual([{ 柱: '时', 干: '壬' }]);
    expect(result.十神.比肩.显干).toEqual([]);
    Object.values(result.十神).forEach(slot => {
      expect(Array.isArray(slot.位置)).toBe(true);
    });
  });

  test.each([
    ['male', ['正财', '偏财']],
    ['female', ['正官', '七杀']],
  ])('%s 配偶星同时列出两类及其显干藏干位置', (gender, expected) => {
    const result = marriageSignals({
      年: '壬子', 月: '癸丑', 日: '丙寅', 时: '壬辰',
    }, { gender });

    expect(result.配偶宫).toEqual({ 柱: '日', 地支: '寅' });
    expect(result.配偶星.性别).toBe(gender);
    expect(result.配偶星.十神).toEqual(expected);
    expect(result.配偶星.位置).toHaveLength(2);
    result.配偶星.位置.forEach(item => {
      expect(item).toEqual(expect.objectContaining({
        十神: expect.any(String),
        显干: expect.any(Array),
        藏干: expect.any(Array),
      }));
    });
    if (gender === 'female') {
      expect(result.配偶星.位置).toContainEqual(expect.objectContaining({
        十神: '七杀', 显干: [{ 柱: '年', 干: '壬' }, { 柱: '时', 干: '壬' }],
      }));
      expect(result.配偶星.位置).toContainEqual(expect.objectContaining({
        十神: '正官', 显干: [{ 柱: '月', 干: '癸' }],
      }));
    }
  });

  test('桃花保留年支起和日支起两套口径及原局和目标流年命中', () => {
    const result = marriageSignals({
      年: '甲午', 月: '丁卯', 日: '丙子', 时: '乙未',
    }, { gender: 'male', targetGanzhi: '乙酉' });

    expect(result.桃花).toEqual([
      {
        起法: '年支起', 起支: '午', 桃花支: '卯',
        原局命中: [{ 柱: '月', 地支: '卯' }], 目标流年命中: false,
      },
      {
        起法: '日支起', 起支: '子', 桃花支: '酉',
        原局命中: [], 目标流年命中: true,
      },
    ]);
  });

  test('红鸾按年支映射，天喜由红鸾对冲推出并分别保留命中', () => {
    const result = marriageSignals({
      年: '甲午', 月: '丁卯', 日: '丙子', 时: '乙未',
    }, { gender: 'female', targetGanzhi: '乙酉' });

    expect(result.红鸾天喜).toEqual({
      年支: '午',
      红鸾支: '酉',
      天喜支: '卯',
      推导: '天喜取红鸾对冲支',
      原局命中: {
        红鸾: [],
        天喜: [{ 柱: '月', 地支: '卯' }],
      },
      目标流年命中: { 红鸾: true, 天喜: false },
    });
  });

  test('夫妻宫仅列刑冲合害，多重关系完整保留，目标流年独立列出', () => {
    const result = marriageSignals({
      年: '壬申', 月: '丁亥', 日: '戊寅', 时: '丁巳',
    }, { gender: 'male', targetGanzhi: '癸巳' });

    expect(result.夫妻宫关系).toEqual({
      收录关系: ['相刑', '六冲', '六合', '相害'],
      原局: [
        { 柱: '年', 地支: '申', 关系: ['相刑', '六冲'] },
        { 柱: '月', 地支: '亥', 关系: ['六合'] },
        { 柱: '时', 地支: '巳', 关系: ['相刑', '相害'] },
      ],
      目标流年: { 干支: '癸巳', 地支: '巳', 关系: ['相刑', '相害'] },
    });
  });

  test('神煞来源明确标成传统口径和外部开源交叉验证，不冒充仓内一手裁决', () => {
    const result = marriageSignals({
      年: '甲午', 月: '丁卯', 日: '丙子', 时: '乙未',
    }, { gender: 'male' });

    expect(result.来源.桃花红鸾).toEqual(expect.objectContaining({
      口径: '传统神煞查表口径',
      仓内资料边界: expect.stringMatching(/无一手古籍页码|不作为.*裁决/),
      外部交叉验证: expect.objectContaining({
        repository: 'cantian-ai/bazi-mcp',
        commit: 'd5af26b043ac4ca62ef832179f700148285688e3',
        url: expect.stringMatching(/^https:\/\/github\.com\/cantian-ai\/bazi-mcp\/blob\/d5af26b0/),
      }),
    }));
    expect(result.来源.配偶星).toEqual(expect.objectContaining({
      口径: expect.stringMatching(/传统.*配偶星/),
      仓内资料边界: expect.stringMatching(/无一手古籍页码|不作为.*R3\/R5.*裁决/),
    }));
  });

  test.each([
    [null, { gender: 'male' }, /pillars|四柱/],
    [{ 年: '甲子', 月: '乙丑', 日: '丙寅' }, { gender: 'male' }, /时柱/],
    [{ 年: '甲丑', 月: '乙丑', 日: '丙寅', 时: '丁卯' }, { gender: 'male' }, /年柱|合法干支/],
    [{ 年: '甲子', 月: '乙丑', 日: '丙寅', 时: '丁卯' }, {}, /gender/],
    [{ 年: '甲子', 月: '乙丑', 日: '丙寅', 时: '丁卯' }, { gender: 'other' }, /gender/],
    [{ 年: '甲子', 月: '乙丑', 日: '丙寅', 时: '丁卯' }, { gender: 'male', targetGanzhi: '甲丑' }, /targetGanzhi/],
  ])('拒绝非法领域输入：%p / %p', (pillars, options, message) => {
    expect(() => marriageSignals(pillars, options)).toThrow(message);
  });
});
