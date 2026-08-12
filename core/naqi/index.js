const zones = require('./zones');
const patterns = require('./patterns');
const center = require('./center');

function format(result) {
  if (result && Array.isArray(result.破格项)) {
    const lines = ['【纳气格局体检】', result.摘要];
    if (result.破格项.length) {
      lines.push('破格项：');
      result.破格项.forEach(item => lines.push(`- ${item.家具}在${item.方位}（${item.区}）：${item.判定}。${item.建议}`));
    }
    if (result.合规项.length) {
      lines.push('合规项：');
      result.合规项.forEach(item => lines.push(`- ${item.家具}在${item.方位}（${item.区}）`));
    }
    if (result.未判定.length) {
      lines.push('无判据：');
      result.未判定.forEach(item => lines.push(`- ${item.家具}在${item.方位}：${item.判定}`));
    }
    return lines.join('\n');
  }
  if (result && result.对角线法 && result.实墙逼近法) {
    return `【房屋中心】\n对角线法：(${result.对角线法.x}, ${result.对角线法.y})\n实墙逼近法：(${result.实墙逼近法.x}, ${result.实墙逼近法.y})\n${result.提示}`;
  }
  return JSON.stringify(result, null, 2);
}

module.exports = { ...zones, ...patterns, ...center, format };
