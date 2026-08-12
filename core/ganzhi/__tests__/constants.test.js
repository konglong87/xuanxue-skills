const C = require('../constants');

describe('干支常量', () => {
  test('天干10个、地支12个、六十甲子60个', () => {
    expect(C.TIANGAN).toHaveLength(10);
    expect(C.DIZHI).toHaveLength(12);
    expect(C.JIAZI).toHaveLength(60);
  });

  test('六十甲子首尾、规律及唯一性正确', () => {
    expect(C.JIAZI[0]).toBe('甲子');
    expect(C.JIAZI[59]).toBe('癸亥');
    expect(new Set(C.JIAZI).size).toBe(60);
    C.JIAZI.forEach((ganzhi, index) => {
      expect(ganzhi).toBe(C.TIANGAN[index % 10] + C.DIZHI[index % 12]);
    });
  });

  test('藏干表覆盖12地支且本气唯一', () => {
    expect(Object.keys(C.CANGGAN)).toHaveLength(12);
    for (const zhi of C.DIZHI) {
      const list = C.CANGGAN[zhi];
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.filter(item => item.type === '本气')).toHaveLength(1);
      expect(list[0].type).toBe('本气');
    }
  });

  test('藏干抽样正确', () => {
    expect(C.CANGGAN.子).toEqual([{ gan: '癸', type: '本气' }]);
    expect(C.CANGGAN.寅).toEqual([
      { gan: '甲', type: '本气' },
      { gan: '丙', type: '中气' },
      { gan: '戊', type: '余气' },
    ]);
    expect(C.CANGGAN.丑).toEqual([
      { gan: '己', type: '本气' },
      { gan: '癸', type: '中气' },
      { gan: '辛', type: '余气' },
    ]);
  });

  test('纳音表60项、两两成对且抽样正确', () => {
    expect(Object.keys(C.NAYIN)).toHaveLength(60);
    expect(C.NAYIN.甲子).toBe('海中金');
    expect(C.NAYIN.乙丑).toBe('海中金');
    expect(C.NAYIN.壬戌).toBe('大海水');
    expect(C.NAYIN.癸亥).toBe('大海水');
    for (let index = 0; index < 60; index += 2) {
      expect(C.NAYIN[C.JIAZI[index]]).toBe(C.NAYIN[C.JIAZI[index + 1]]);
    }
  });

  test('五行与阴阳归属完整', () => {
    expect(C.WUXING_OF_GAN.甲).toBe('木');
    expect(C.WUXING_OF_GAN.癸).toBe('水');
    expect(C.WUXING_OF_ZHI.子).toBe('水');
    expect(C.WUXING_OF_ZHI.未).toBe('土');
    expect(Object.keys(C.YINYANG_OF_GAN)).toHaveLength(10);
    expect(Object.keys(C.YINYANG_OF_ZHI)).toHaveLength(12);
  });
});
