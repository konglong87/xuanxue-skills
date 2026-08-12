const DEFAULT_STANDARD_MERIDIAN = 120;
const MIN_UTC_OFFSET_MINUTES = -720;
const MAX_UTC_OFFSET_MINUTES = 840;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const DAY_MS = 86_400_000;
const TIME_VALUE = Symbol('civilTimeValue');

function utcCarrier(timeValue) {
  return new Date(timeValue);
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

class CivilDateTime {
  constructor(timeValue) {
    this[TIME_VALUE] = timeValue;
    Object.freeze(this);
  }

  getFullYear() { return utcCarrier(this[TIME_VALUE]).getUTCFullYear(); }
  getMonth() { return utcCarrier(this[TIME_VALUE]).getUTCMonth(); }
  getDate() { return utcCarrier(this[TIME_VALUE]).getUTCDate(); }
  getDay() { return utcCarrier(this[TIME_VALUE]).getUTCDay(); }
  getHours() { return utcCarrier(this[TIME_VALUE]).getUTCHours(); }
  getMinutes() { return utcCarrier(this[TIME_VALUE]).getUTCMinutes(); }
  getSeconds() { return utcCarrier(this[TIME_VALUE]).getUTCSeconds(); }
  getMilliseconds() { return utcCarrier(this[TIME_VALUE]).getUTCMilliseconds(); }

  toString() {
    return `${pad(this.getFullYear(), 4)}-${pad(this.getMonth() + 1)}-${pad(this.getDate())}`
      + `T${pad(this.getHours())}:${pad(this.getMinutes())}:${pad(this.getSeconds())}`;
  }

  toJSON() {
    return this.toString();
  }
}

function isCivilDateTime(value) {
  return value instanceof CivilDateTime;
}

function dateTimeValueOf(value) {
  return isCivilDateTime(value) ? value[TIME_VALUE] : value.getTime();
}

function isValidDateTime(value) {
  return (isCivilDateTime(value) || value instanceof Date)
    && Number.isFinite(dateTimeValueOf(value));
}

function dateFromTimeValue(reference, timeValue) {
  return isCivilDateTime(reference)
    ? new CivilDateTime(timeValue)
    : new Date(timeValue);
}

function addDateTimeDays(reference, days) {
  if (isCivilDateTime(reference)) {
    return new CivilDateTime(dateTimeValueOf(reference) + days * DAY_MS);
  }
  const result = new Date(reference);
  result.setDate(result.getDate() + days);
  return result;
}

function parseCivilDateTime({ date, time } = {}) {
  const dateMatch = DATE_PATTERN.exec(date);
  if (!dateMatch) {
    throw new Error(`date 须为 YYYY-MM-DD 格式，收到：${date}`);
  }

  const timeMatch = TIME_PATTERN.exec(time);
  if (!timeMatch) {
    throw new Error(`time 须为 HH:mm[:ss] 格式，收到：${time}`);
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText, secondText = '0'] = timeMatch;
  const fields = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const [year, month, day, hour, minute, second] = fields;

  const carrier = new Date(0);
  carrier.setUTCFullYear(year, month - 1, day);
  carrier.setUTCHours(hour, minute, second, 0);
  if (
    carrier.getUTCFullYear() !== year
    || carrier.getUTCMonth() !== month - 1
    || carrier.getUTCDate() !== day
  ) {
    throw new Error(`date 须为合法公历日期，收到：${date}`);
  }

  return new CivilDateTime(carrier.getTime());
}

function standardMeridianOf({ utcOffsetMinutes } = {}) {
  if (utcOffsetMinutes === undefined) return DEFAULT_STANDARD_MERIDIAN;
  if (
    typeof utcOffsetMinutes !== 'number'
    || !Number.isFinite(utcOffsetMinutes)
    || utcOffsetMinutes < MIN_UTC_OFFSET_MINUTES
    || utcOffsetMinutes > MAX_UTC_OFFSET_MINUTES
  ) {
    throw new Error(
      `utcOffsetMinutes 须为 -720~840 之间的有限数字，收到：${utcOffsetMinutes}`,
    );
  }
  return utcOffsetMinutes / 4;
}

module.exports = {
  addDateTimeDays,
  dateTimeValueOf,
  dateFromTimeValue,
  isValidDateTime,
  parseCivilDateTime,
  standardMeridianOf,
};
