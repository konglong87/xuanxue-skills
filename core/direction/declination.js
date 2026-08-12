const DEFAULT_TABLE = require('./data/declination-cn.json');

const WARNING =
  '磁偏角校正只能消除磁北与真北的系统偏差，不能消除现场干扰与测量误差；' +
  '钢筋和家电可造成 10° 以上误差。首选卫星地图对齐楼宇轮廓直接取真北。';

function resolveTable(options) {
  return options.table || DEFAULT_TABLE;
}

function declination(city, year, options = {}) {
  const table = resolveTable(options);
  const data = table.cities && table.cities[city];
  if (!data) throw new Error(`城市「${city}」未收录；可先用 nearestCity(lat, lng) 找最近城市`);
  if (data.declination == null || data.secularChange == null) {
    throw new Error(`城市「${city}」数据未填；必须从 NOAA WMM2025 等权威源查询，禁止估算`);
  }
  const epoch = table._历元;
  const targetYear = year == null ? epoch : year;
  if (!Number.isFinite(epoch) || !Number.isFinite(targetYear)) throw new Error('历元和目标年份必须是数字');
  const yearDifference = targetYear - epoch;
  const modelValidity = table._模型有效期 || [epoch, epoch + 4];
  const outsideValidity = targetYear < modelValidity[0] || targetYear > modelValidity[1];
  const validityWarning = outsideValidity
    ? ` 目标年 ${targetYear} 已超出 WMM 模型有效期 ${modelValidity[0]}-${modelValidity[1]}，线性外推仅供提示，必须重新查询届时有效模型。`
    : '';
  return {
    磁偏角: data.declination + data.secularChange * yearDifference,
    历元: epoch,
    目标年: targetYear,
    模型有效期: [...modelValidity],
    超出模型有效期: outsideValidity,
    已做长期修正: yearDifference !== 0,
    来源: table._来源 || 'NOAA WMM2025（见 declination-cn.json）',
    警示: WARNING + validityWarning,
  };
}

function magneticToTrue(magneticBearing, city, year, options = {}) {
  if (typeof magneticBearing !== 'number' || Number.isNaN(magneticBearing)
    || magneticBearing < 0 || magneticBearing > 360) {
    throw new Error(`磁北读数须在 0~360 之间：${magneticBearing}`);
  }
  const correction = declination(city, year, options);
  return {
    真北度数: ((magneticBearing + correction.磁偏角) % 360 + 360) % 360,
    磁偏角: correction.磁偏角,
    警示: correction.警示,
  };
}

function nearestCity(lat, lng, options = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('lat 和 lng 必须是数字');
  const table = resolveTable(options);
  let closest = null;
  let closestDistance = Infinity;
  Object.entries(table.cities || {}).forEach(([name, city]) => {
    const distance = Math.hypot(city.lat - lat, city.lng - lng);
    if (distance < closestDistance) {
      closest = name;
      closestDistance = distance;
    }
  });
  if (!closest) throw new Error('磁偏角表为空');
  return closest;
}

module.exports = { declination, magneticToTrue, nearestCity };
