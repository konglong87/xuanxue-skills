const { luoshuOf } = require('../direction/jiugong');

const QI_ITEMS = ['门', '窗', '灶', '床', '书桌'];
const SHUI_ITEMS = ['厕所', '马桶', '水槽', '洗衣机'];
const QI_DIRECTIONS = '西北、正西、东北、正南';
const SHUI_DIRECTIONS = '正北、西南、正东、东南';

function zoneOf(direction) {
  const number = luoshuOf(direction);
  if (number === 5) return { 区: '中宫', 洛书数: number, 宜设: [] };
  const isQi = number >= 6;
  return { 区: isQi ? '气位' : '水位', 洛书数: number, 宜设: [...(isQi ? QI_ITEMS : SHUI_ITEMS)] };
}

function checkPlacement(item, direction) {
  const zone = zoneOf(direction);
  const isQiItem = QI_ITEMS.includes(item);
  const isShuiItem = SHUI_ITEMS.includes(item);
  if (!isQiItem && !isShuiItem) {
    return {
      家具: item, 方位: direction, 区: zone.区, 合规: null,
      判定: '未登记物品，参考资料未给出判据',
      建议: '不臆断；补充资料依据后再纳入判定',
    };
  }
  if (zone.区 === '中宫') {
    return {
      家具: item, 方位: direction, 区: zone.区, 合规: null,
      判定: '中宫不参与气水判定', 建议: '中宫宜空，避免堆放重物',
    };
  }

  const compliant = (isQiItem && zone.区 === '气位') || (isShuiItem && zone.区 === '水位');
  if (compliant) {
    return { 家具: item, 方位: direction, 区: zone.区, 合规: true, 判定: '合规', 建议: '保持现状' };
  }
  return {
    家具: item,
    方位: direction,
    区: zone.区,
    合规: false,
    判定: isShuiItem ? '破气' : '被压制',
    建议: `${item}应移至${isShuiItem ? `水位（${SHUI_DIRECTIONS}）` : `气位（${QI_DIRECTIONS}）`}`,
  };
}

function auditHouse(layout) {
  const 合规项 = [];
  const 破格项 = [];
  const 未判定 = [];
  Object.entries(layout).forEach(([item, direction]) => {
    const result = checkPlacement(item, direction);
    if (result.合规 === true) 合规项.push(result);
    else if (result.合规 === false) 破格项.push(result);
    else 未判定.push(result);
  });
  return {
    合规项,
    破格项,
    未判定,
    摘要: `共 ${Object.keys(layout).length} 项，${合规项.length} 项合规，${破格项.length} 项破格，${未判定.length} 项无判据`,
  };
}

module.exports = { zoneOf, checkPlacement, auditHouse, QI_ITEMS, SHUI_ITEMS };
