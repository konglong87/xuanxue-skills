const lunar = require('../../vendor/lunar-javascript');

function assertParts({ year, month, day } = {}) {
  if (![year, month, day].every(Number.isInteger)) {
    throw new Error('日期的 year、month、day 必须是整数');
  }
  if (month < 1 || month > 12) throw new Error(`月份须在 1~12 之间：${month}`);
  if (day < 1 || day > 31) throw new Error(`日期须在 1~31 之间：${day}`);
}

function solarToLunar(parts) {
  assertParts(parts);
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
  assertParts(parts);
  const month = parts.isLeap ? -parts.month : parts.month;
  const value = lunar.Lunar.fromYmd(parts.year, month, parts.day).getSolar();
  return {
    year: value.getYear(),
    month: value.getMonth(),
    day: value.getDay(),
    date: new Date(value.getYear(), value.getMonth() - 1, value.getDay()),
  };
}

module.exports = { solarToLunar, lunarToSolar };
