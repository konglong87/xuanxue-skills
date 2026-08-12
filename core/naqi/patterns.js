const PUNISHMENT_TOLERANCE = 5;
const COLLINEAR_TOLERANCE = 10;
const OPPOSITE_TOLERANCE = 20;
const STOVE_REFERENCE = '背对灶台站立，以此时左右手方向为准（左为青龙，右为白虎）';

function longhu({ 左墙连贯 = false, 右墙连贯 = false, 左侧逼压 = false, 右侧逼压 = false } = {}) {
  let 格局 = null;
  let 含义 = '两侧墙体均不连贯，无法判定龙虎绕；需重新观察床头两侧墙体中断位置';
  let 适配 = '';
  if (左墙连贯 && !右墙连贯) {
    格局 = '龙绕';
    含义 = '左墙连贯绕过床头：传统、稳定、大家长说了算；对应正财';
    适配 = '适合守业者，宜依附名牌老字号，借平台惯性稳健发展';
  } else if (右墙连贯 && !左墙连贯) {
    格局 = '虎绕';
    含义 = '右墙连贯绕过床头：创新、冒险，女性或花钱方更有话语权；对应偏财';
    适配 = '适合创业者与变革者，宜靠个人特质破局';
  } else if (左墙连贯 && 右墙连贯) {
    含义 = '两侧墙体均连贯，无法判定哪一侧为绕；需确认墙体中断位置';
  }

  const warnings = [];
  if (左侧逼压) warnings.push('龙逼压：性格压抑，有抑郁倾向。化解：换头睡');
  if (右侧逼压) warnings.push('虎逼压：容易叛逆。化解：换头睡');
  return { 格局, 含义, 适配, 警示: warnings.join('；') };
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function zaoCao({ 夹角, 背对灶台时水槽在 } = {}) {
  if (typeof 夹角 !== 'number' || Number.isNaN(夹角)) throw new Error(`夹角须为数字：${夹角}`);
  const angle = normalizeAngle(夹角);
  const distanceToRightAngle = Math.min(Math.abs(angle - 90), Math.abs(angle - 270));
  if (distanceToRightAngle <= PUNISHMENT_TOLERANCE) {
    return {
      格局: '水火相刑', 判定: '大忌',
      后果: '本钱流失、家人争执、决策焦虑、现金流无端流失',
      建议: '必须错开摆放，避免水火直冲', 参照系: STOVE_REFERENCE,
    };
  }

  const collinear = Math.min(angle, Math.abs(angle - 180), 360 - angle) <= COLLINEAR_TOLERANCE;
  if (collinear && 背对灶台时水槽在 === '右') {
    return {
      格局: '收虎水', 判定: '顶级配置',
      后果: '最利于捕捉风险中的偏财机会，适合投机与创新型业务',
      建议: '保持现状', 参照系: STOVE_REFERENCE,
    };
  }
  if (collinear) {
    return {
      格局: '同线', 判定: '中性', 后果: '水槽不在右侧虎位，不构成收虎水',
      建议: '若追求偏财，可考虑将水槽调至灶台右侧同线', 参照系: STOVE_REFERENCE,
    };
  }
  return {
    格局: '其他', 判定: '中性', 后果: `水灶夹角 ${angle} 度，既非 90 度相刑，也非同线`,
    建议: '无需调整，但避免向 90 度靠近', 参照系: STOVE_REFERENCE,
  };
}

function versailles({ 楼门朝向, 阳台朝向 } = {}) {
  [['楼门朝向', 楼门朝向], ['阳台朝向', 阳台朝向]].forEach(([name, value]) => {
    if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`${name} 须为数字：${value}`);
  });
  const rawDifference = Math.abs(normalizeAngle(楼门朝向 - 阳台朝向));
  const difference = rawDifference > 180 ? 360 - rawDifference : rawDifference;
  const 陷阱 = Math.abs(difference - 180) <= OPPOSITE_TOLERANCE;
  return 陷阱 ? {
    陷阱: true,
    判定: `阳台与楼门朝向相差 ${difference.toFixed(1)} 度，接近相反：明堂后置、背后无靠`,
    后果: '人丁稀落；虚无享乐，沉溺消费享乐而在事业传承与家庭凝聚力上无力',
  } : {
    陷阱: false,
    判定: `楼门与阳台朝向相差 ${difference.toFixed(1)} 度，未构成明堂后置`,
    后果: '',
  };
}

module.exports = { longhu, zaoCao, versailles };
