const { chartDetails } = require('../ganzhi/chart');
const { parseCivilDateTime } = require('./civil-time');
const { fourPillars } = require('./pillars');
const { luckCycles, annualCycle } = require('./cycles');

const DEFAULT_DAY_BOUNDARY = '23:00';
const DAY_BOUNDARIES = ['23:00', '00:00'];

function validateCoordinate(value, name, chineseName, min, max, required) {
  if (value === undefined && !required) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${chineseName}（${name}）须在 ${min}~${max} 之间，收到：${value}`);
  }
}

function baziChart({
  birthDate,
  birthTime,
  longitude,
  latitude,
  utcOffsetMinutes,
  standardMeridian,
  gender,
  targetYear,
  options = {},
} = {}) {
  validateCoordinate(longitude, 'longitude', '经度', -180, 180, true);
  validateCoordinate(latitude, 'latitude', '纬度', -90, 90, false);
  if (gender !== 'male' && gender !== 'female') {
    throw new Error(`性别（gender）必填且只能是 male 或 female，收到：${gender}`);
  }
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('options 必须是对象');
  }
  if (Object.hasOwn(options, 'dayBoundary') && !DAY_BOUNDARIES.includes(options.dayBoundary)) {
    throw new Error(`options.dayBoundary 只能是 '23:00' 或 '00:00'，收到：${options.dayBoundary}`);
  }
  if (Object.hasOwn(options, 'useTrueSolar') && typeof options.useTrueSolar !== 'boolean') {
    throw new Error(`options.useTrueSolar 必须是 boolean（布尔值），收到：${options.useTrueSolar}`);
  }

  const datetime = parseCivilDateTime({ date: birthDate, time: birthTime });
  const effectiveOptions = {
    dayBoundary: options.dayBoundary === undefined ? DEFAULT_DAY_BOUNDARY : options.dayBoundary,
    useTrueSolar: options.useTrueSolar === undefined ? true : options.useTrueSolar,
  };
  const 四柱结果 = fourPillars({
    datetime,
    longitude,
    options: {
      ...effectiveOptions,
      utcOffsetMinutes,
      standardMeridian,
    },
  });
  const pillars = {
    年: 四柱结果.年,
    月: 四柱结果.月,
    日: 四柱结果.日,
    时: 四柱结果.时,
  };
  const cycleDateTime = 四柱结果.真太阳时信息
    ? 四柱结果.真太阳时信息.真太阳时
    : datetime;
  const 目标流年 = annualCycle(targetYear, pillars.日[0], pillars.日[1]);

  return {
    input: {
      birthDate,
      birthTime,
      longitude,
      latitude,
      utcOffsetMinutes,
      standardMeridian,
      gender,
      targetYear,
      options: effectiveOptions,
    },
    四柱结果,
    命盘详情: chartDetails(pillars),
    起运大运: luckCycles({ datetime: cycleDateTime, gender }),
    目标流年,
  };
}

module.exports = { baziChart };
