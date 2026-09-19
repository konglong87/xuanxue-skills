const lunar = require('../../vendor/lunar-javascript');
const { parseCivilDateTime } = require('./civil-time');

function assertParts({ year, month, day } = {}) {
  if (![year, month, day].every(Number.isInteger)) {
    throw new Error('日期的 year、month、day 必须是整数');
  }
  if (month < 1 || month > 12) throw new Error(`月份须在 1~12 之间：${month}`);
  if (day < 1 || day > 31) throw new Error(`日期须在 1~31 之间：${day}`);
}

function isGregorianLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function assertGregorianParts(parts) {
  assertParts(parts);
  const daysInMonth = [
    31,
    isGregorianLeapYear(parts.year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][parts.month - 1];
  if (parts.day > daysInMonth) {
    throw new Error(`日期须是合法公历日期：${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`);
  }
}

function assertLunarParts(parts) {
  assertParts(parts);
  if (parts.isLeap !== undefined && typeof parts.isLeap !== 'boolean') {
    throw new Error(`isLeap 必须是 boolean（布尔值），收到：${parts.isLeap}`);
  }
}

function civilDateOf(year, month, day) {
  return parseCivilDateTime({
    date: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    time: '00:00',
  });
}

function solarToLunar(parts) {
  assertGregorianParts(parts);
  const solar = lunar.Solar.fromYmd(parts.year, parts.month, parts.day);
  const value = solar.getLunar();
  return {
    year: value.getYear(),
    month: Math.abs(value.getMonth()),
    day: value.getDay(),
    isLeap: value.getMonth() < 0,
    中文: value.toString(),
  };
}

function lunarToSolar(parts) {
  assertLunarParts(parts);
  const month = parts.isLeap ? -parts.month : parts.month;
  const value = lunar.Lunar.fromYmd(parts.year, month, parts.day).getSolar();
  return {
    year: value.getYear(),
    month: value.getMonth(),
    day: value.getDay(),
    date: civilDateOf(value.getYear(), value.getMonth(), value.getDay()),
  };
}

module.exports = { solarToLunar, lunarToSolar };
