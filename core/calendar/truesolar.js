const {
  dateTimeValueOf,
  dateFromTimeValue,
  isValidDateTime,
  standardMeridianOf,
} = require('./civil-time');

const DAY_MS = 86_400_000;

function dayOfYear(date) {
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const start = Date.UTC(date.getFullYear(), 0, 1);
  return Math.floor((current - start) / DAY_MS) + 1;
}

function equationOfTime(date) {
  if (!isValidDateTime(date)) {
    throw new Error(`date 须为合法 Date，收到：${date}`);
  }
  const angle = (2 * Math.PI * (dayOfYear(date) - 81)) / 364;
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
}

function longitudeDifference(longitude, standardMeridian) {
  const difference = longitude - standardMeridian;
  return ((difference + 180) % 360 + 360) % 360 - 180;
}

function resolveStandardMeridian({ utcOffsetMinutes, standardMeridian }) {
  const hasStandardMeridian = standardMeridian !== undefined;
  if (hasStandardMeridian && (typeof standardMeridian !== 'number' || !Number.isFinite(standardMeridian))) {
    throw new Error(`standardMeridian 须为有限数字，收到：${standardMeridian}`);
  }

  if (utcOffsetMinutes === null && hasStandardMeridian) return standardMeridian;
  const derived = standardMeridianOf({ utcOffsetMinutes });
  if (!hasStandardMeridian) return derived;
  if (utcOffsetMinutes !== undefined && longitudeDifference(standardMeridian, derived) !== 0) {
    throw new Error(
      `standardMeridian (${standardMeridian}) 与 utcOffsetMinutes (${utcOffsetMinutes}) 不一致`,
    );
  }
  return standardMeridian;
}

function trueSolarTime({ datetime, longitude, utcOffsetMinutes, standardMeridian } = {}) {
  if (!isValidDateTime(datetime)) {
    throw new Error(`datetime 须为合法 Date，收到：${datetime}`);
  }
  if (typeof longitude !== 'number' || Number.isNaN(longitude)) {
    throw new Error(`必须提供经度（longitude），收到：${longitude}`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error(`经度须在 -180~180 之间，收到：${longitude}`);
  }

  const 标准经线 = resolveStandardMeridian({ utcOffsetMinutes, standardMeridian });
  const 经度时差 = longitudeDifference(longitude, 标准经线) * 4;
  const 均时差 = equationOfTime(datetime);
  const 总偏移分钟 = 经度时差 + 均时差;
  return {
    真太阳时: dateFromTimeValue(
      datetime,
      dateTimeValueOf(datetime) + 总偏移分钟 * 60_000,
    ),
    标准经线,
    经度时差: +经度时差.toFixed(4),
    均时差: +均时差.toFixed(4),
    总偏移分钟: +总偏移分钟.toFixed(4),
  };
}

module.exports = { trueSolarTime, equationOfTime };
