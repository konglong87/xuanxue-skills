const {
  TIANGAN,
  DIZHI,
  WUXING_OF_GAN,
  WUXING_OF_ZHI,
  YINYANG_OF_GAN,
  YINYANG_OF_ZHI,
  CANGGAN,
  NAYIN,
} = require('./constants');

const GENERATING_CYCLE = ['木', '火', '土', '金', '水'];
const RELATIONS_BY_DISTANCE = ['同', '生', '克', '被克', '被生'];

function wuxingOf(symbol) {
  const element = WUXING_OF_GAN[symbol] || WUXING_OF_ZHI[symbol];
  if (!element) throw new Error(`未知干支：${symbol}`);
  return element;
}

function yinyangOf(symbol) {
  const polarity = YINYANG_OF_GAN[symbol] || YINYANG_OF_ZHI[symbol];
  if (!polarity) throw new Error(`未知干支：${symbol}`);
  return polarity;
}

function canggan(branch) {
  if (!CANGGAN[branch]) throw new Error(`${branch} 不是地支`);
  return CANGGAN[branch].map(item => ({ ...item }));
}

function nayin(ganzhi) {
  if (!NAYIN[ganzhi]) throw new Error(`未知干支组合：${ganzhi}`);
  return NAYIN[ganzhi];
}

function shengke(left, right) {
  const leftIndex = GENERATING_CYCLE.indexOf(left);
  const rightIndex = GENERATING_CYCLE.indexOf(right);
  if (leftIndex < 0 || rightIndex < 0) throw new Error(`未知五行：${left} / ${right}`);
  return RELATIONS_BY_DISTANCE[(rightIndex - leftIndex + 5) % 5];
}

module.exports = { wuxingOf, yinyangOf, canggan, nayin, shengke, TIANGAN, DIZHI };
