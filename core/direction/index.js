const shan24 = require('./shan24');
const jiugong = require('./jiugong');
const magnetic = require('./declination');

function format(result) {
  if (result && result.山) {
    return `【坐向归山】\n${result.山}山（${result.卦}卦，${result.方位}，${result.元}龙）\n度数区间 ${result.range[0]}° ~ ${result.range[1]}°`;
  }
  if (result && Number.isFinite(result.磁偏角)) {
    return `【磁偏角】\n磁偏角 ${result.磁偏角}°（东偏为正、西偏为负）\n历元 ${result.历元}\n来源：${result.来源}\n警示：${result.警示}`;
  }
  if (result && result.运) {
    return `【三元九运】\n${result.区间[0]}-${result.区间[1]}：${result.运}运，临时口径 ${result.元}，通说 ${result.标准元}\n${result.依据}`;
  }
  return JSON.stringify(result, null, 2);
}

module.exports = { ...shan24, ...jiugong, ...magnetic, format };
