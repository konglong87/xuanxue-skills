const { luoshuOf } = require('../direction/jiugong');

const QI_ITEMS = ['门', '窗', '灶', '床', '书桌'];
const SHUI_ITEMS = ['厕所', '马桶', '水槽', '洗衣机'];
const QI_DIRECTIONS = '西北、正西、东北、正南';
const SHUI_DIRECTIONS = '正北、西南、正东、东南';

// 资料明写这张气位/水位表「自 1964 年以来相对稳定」且「2044 年前适用」。
// 窗口之外用什么盘，资料没说 —— C2 尚未裁决（判据文档里记了一个「运数即宫位」的
// 推断读法，但未采纳）。所以越界时只附警示、不擅自反转气水：
// 猜错方向会把吉位判成凶位，比不给结论更糟。
const APPLICABLE_WINDOW = Object.freeze({ 起: 1964, 止: 2043 });
const WINDOW_LABEL = `${APPLICABLE_WINDOW.起}–${APPLICABLE_WINDOW.止}`;

function applicability({ year } = {}) {
  if (year === undefined) {
    return Object.freeze({
      适用: null,
      窗口: WINDOW_LABEL,
      警示: `未提供年份，未核对适用窗口（${WINDOW_LABEL}）。判定按该窗口的气位/水位表给出。`,
    });
  }
  if (!Number.isInteger(year)) throw new Error(`年份须为整数：${year}`);
  const inside = year >= APPLICABLE_WINDOW.起 && year <= APPLICABLE_WINDOW.止;
  return Object.freeze({
    适用: inside,
    窗口: WINDOW_LABEL,
    年份: year,
    警示: inside
      ? null
      : `${year} 年超出资料所述适用窗口 ${WINDOW_LABEL}。窗口外的换盘机制未裁决（见判据文档 C2），`
        + '本结果仍按窗口内的气位/水位表给出，不得直接采用；须先确认机制再判。',
  });
}

function zoneOf(direction, options) {
  const 适用性 = applicability(options);
  const number = luoshuOf(direction);
  if (number === 5) return { 区: '中宫', 洛书数: number, 宜设: [], 适用性 };
  const isQi = number >= 6;
  return {
    区: isQi ? '气位' : '水位',
    洛书数: number,
    宜设: [...(isQi ? QI_ITEMS : SHUI_ITEMS)],
    适用性,
  };
}

function checkPlacement(item, direction, options) {
  const zone = zoneOf(direction, options);
  const isQiItem = QI_ITEMS.includes(item);
  const isShuiItem = SHUI_ITEMS.includes(item);
  if (!isQiItem && !isShuiItem) {
    return {
      家具: item, 方位: direction, 区: zone.区, 合规: null,
      判定: '未登记物品，参考资料未给出判据',
      建议: '不臆断；补充资料依据后再纳入判定',
      适用性: zone.适用性,
    };
  }
  if (zone.区 === '中宫') {
    return {
      家具: item, 方位: direction, 区: zone.区, 合规: null,
      判定: '中宫不参与气水判定', 建议: '中宫宜空，避免堆放重物',
      适用性: zone.适用性,
    };
  }

  const compliant = (isQiItem && zone.区 === '气位') || (isShuiItem && zone.区 === '水位');
  if (compliant) {
    return {
      家具: item, 方位: direction, 区: zone.区, 合规: true,
      判定: '合规', 建议: '保持现状', 适用性: zone.适用性,
    };
  }
  return {
    家具: item,
    方位: direction,
    区: zone.区,
    合规: false,
    判定: isShuiItem ? '破气' : '被压制',
    建议: `${item}应移至${isShuiItem ? `水位（${SHUI_DIRECTIONS}）` : `气位（${QI_DIRECTIONS}）`}`,
    适用性: zone.适用性,
  };
}

function auditHouse(layout, options) {
  const 适用性 = applicability(options);
  const 合规项 = [];
  const 破格项 = [];
  const 未判定 = [];
  Object.entries(layout).forEach(([item, direction]) => {
    const result = checkPlacement(item, direction, options);
    if (result.合规 === true) 合规项.push(result);
    else if (result.合规 === false) 破格项.push(result);
    else 未判定.push(result);
  });
  const 窗口提示 = 适用性.适用 === false
    ? `；⚠️ ${适用性.年份} 年超出适用窗口 ${适用性.窗口}，结论须先确认换盘机制`
    : '';
  return {
    合规项,
    破格项,
    未判定,
    适用性,
    摘要: `共 ${Object.keys(layout).length} 项，${合规项.length} 项合规，${破格项.length} 项破格，${未判定.length} 项无判据${窗口提示}`,
  };
}

module.exports = { zoneOf, checkPlacement, auditHouse, QI_ITEMS, SHUI_ITEMS, APPLICABLE_WINDOW };
