const HEHUN_PAIRS = [
  { pair: ['甲', '己'], 特质: '互信、欣赏，如天作之合' },
  { pair: ['乙', '庚'], 特质: '刚柔并济、互相依赖' },
  { pair: ['丙', '辛'], 特质: '热烈与璀璨的交织' },
  { pair: ['丁', '壬'], 特质: '灵性与深情的契合' },
  { pair: ['戊', '癸'], 特质: '稳重与柔情的融合' },
];
const GUCHEN_GUASU = [
  { 生肖组: '猪鼠牛', zhis: ['亥', '子', '丑'], 孤辰: { zhi: '寅', 方位: '东北' }, 寡宿: { zhi: '戌', 方位: '西北' }, 化解: '东北放猪，西北放兔' },
  { 生肖组: '虎兔龙', zhis: ['寅', '卯', '辰'], 孤辰: { zhi: '巳', 方位: '东南' }, 寡宿: { zhi: '丑', 方位: '东北' }, 化解: '东南放虎，东北放蛇' },
  { 生肖组: '蛇马羊', zhis: ['巳', '午', '未'], 孤辰: { zhi: '申', 方位: '西南' }, 寡宿: { zhi: '辰', 方位: '东南' }, 化解: '西南放蛇，东南放猴' },
  { 生肖组: '猴鸡狗', zhis: ['申', '酉', '戌'], 孤辰: { zhi: '亥', 方位: '西北' }, 寡宿: { zhi: '未', 方位: '西南' }, 化解: '西北放猴，西南放猪' },
];
const MUYU_WEI = { 丁: '西南', 壬: '西北' };

function hehun(dayStem) {
  const match = HEHUN_PAIRS.find(item => item.pair.includes(dayStem));
  if (!match) throw new Error(`未知天干：${dayStem}`);
  return { 所合之干: match.pair.find(stem => stem !== dayStem), 特质: match.特质 };
}

function guchenGuasu(yearBranch) {
  const match = GUCHEN_GUASU.find(item => item.zhis.includes(yearBranch));
  if (!match) throw new Error(`未知地支：${yearBranch}`);
  return {
    生肖组: match.生肖组,
    孤辰: { ...match.孤辰 },
    寡宿: { ...match.寡宿 },
    化解: match.化解,
  };
}

function muyuWei(stem) {
  return MUYU_WEI[stem] || null;
}

module.exports = { hehun, guchenGuasu, muyuWei };
