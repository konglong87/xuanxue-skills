const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const JIAZI = Array.from(
  { length: 60 },
  (_, index) => TIANGAN[index % TIANGAN.length] + DIZHI[index % DIZHI.length],
);

const WUXING_OF_GAN = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const WUXING_OF_ZHI = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
const YINYANG_OF_GAN = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴',
};
const YINYANG_OF_ZHI = {
  子: '阳', 丑: '阴', 寅: '阳', 卯: '阴', 辰: '阳', 巳: '阴',
  午: '阳', 未: '阴', 申: '阳', 酉: '阴', 戌: '阳', 亥: '阴',
};

const canggan = (gan, type) => ({ gan, type });
const CANGGAN = {
  子: [canggan('癸', '本气')],
  丑: [canggan('己', '本气'), canggan('癸', '中气'), canggan('辛', '余气')],
  寅: [canggan('甲', '本气'), canggan('丙', '中气'), canggan('戊', '余气')],
  卯: [canggan('乙', '本气')],
  辰: [canggan('戊', '本气'), canggan('乙', '中气'), canggan('癸', '余气')],
  巳: [canggan('丙', '本气'), canggan('庚', '中气'), canggan('戊', '余气')],
  午: [canggan('丁', '本气'), canggan('己', '中气')],
  未: [canggan('己', '本气'), canggan('丁', '中气'), canggan('乙', '余气')],
  申: [canggan('庚', '本气'), canggan('壬', '中气'), canggan('戊', '余气')],
  酉: [canggan('辛', '本气')],
  戌: [canggan('戊', '本气'), canggan('辛', '中气'), canggan('丁', '余气')],
  亥: [canggan('壬', '本气'), canggan('甲', '中气')],
};

const NAYIN_PAIRS = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];
const NAYIN = Object.fromEntries(
  JIAZI.map((ganzhi, index) => [ganzhi, NAYIN_PAIRS[Math.floor(index / 2)]]),
);

module.exports = {
  TIANGAN,
  DIZHI,
  JIAZI,
  WUXING_OF_GAN,
  WUXING_OF_ZHI,
  YINYANG_OF_GAN,
  YINYANG_OF_ZHI,
  CANGGAN,
  NAYIN,
};
