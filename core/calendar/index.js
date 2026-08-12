const jieqi = require('./jieqi');
const lunar = require('./lunar');
const { parseCivilDateTime, standardMeridianOf } = require('./civil-time');
const truesolar = require('./truesolar');
const pillars = require('./pillars');
const cycles = require('./cycles');
const bazi = require('./bazi');

function format(result) {
  if (!result || !result.采用规则) return JSON.stringify(result, null, 2);
  const lines = [
    '【四柱】',
    `年柱 ${result.年}  月柱 ${result.月}  日柱 ${result.日}  时柱 ${result.时}`,
    '',
    '【采用规则】',
    `换日点：${result.采用规则.说明}`,
    `真太阳时校正：${result.采用规则.useTrueSolar ? '已启用' : '未启用'}`,
  ];
  if (result.真太阳时信息) {
    const info = result.真太阳时信息;
    lines.push(`经度时差 ${info.经度时差} 分，均时差 ${info.均时差} 分，合计 ${info.总偏移分钟} 分`);
  }
  if (result.另一派 && result.另一派.是否不同) {
    lines.push(
      '',
      '【流派分歧】',
      `本盘按 ${result.采用规则.dayBoundary} 得日柱 ${result.日}；另一派按 ${result.另一派.dayBoundary} 得日柱 ${result.另一派.日}、时柱 ${result.另一派.时}。`,
      '两派差异源于对一日之始的界定，结果并列呈现。',
    );
  }
  return lines.join('\n');
}

module.exports = {
  ...jieqi,
  ...lunar,
  parseCivilDateTime,
  standardMeridianOf,
  ...truesolar,
  ...pillars,
  ...cycles,
  ...bazi,
  format,
};
