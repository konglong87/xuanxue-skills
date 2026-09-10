'use strict';

const { houseCenter } = require('./center');
const { auditHouse } = require('./zones');

const ENTRANCE_POLICIES = Object.freeze(['unit-door', 'home-door', 'explicit']);

function validateBearing(value, label) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || value >= 360) {
    throw new Error(`${label} 须为 0~360 的数字：${value}`);
  }
}

function resolveEntranceBearing({
  unitDoorBearing,
  homeDoorBearing,
  authoritative = null,
} = {}) {
  validateBearing(unitDoorBearing, 'unitDoorBearing');
  validateBearing(homeDoorBearing, 'homeDoorBearing');
  if (authoritative !== null && !ENTRANCE_POLICIES.includes(authoritative)) {
    throw new Error(`authoritative 必须是 ${ENTRANCE_POLICIES.join('、')} 之一`);
  }
  const available = { 'unit-door': unitDoorBearing, 'home-door': homeDoorBearing };
  if (authoritative && authoritative !== 'explicit' && available[authoritative] !== undefined) {
    return {
      status: 'resolved',
      bearing: available[authoritative],
      source: authoritative,
      notice: '采用用户明确指定的权威门朝向，未合成两个门的度数。',
    };
  }
  const values = Object.values(available).filter(value => value !== undefined);
  if (authoritative === 'explicit' && values.length === 1) {
    return { status: 'resolved', bearing: values[0], source: 'explicit', notice: '采用唯一已提供门朝向。' };
  }
  if (values.length === 0) {
    return { status: 'needs_input', bearing: null, source: null, notice: '请提供单元门或入户门朝向。' };
  }
  if (values.length > 1) {
    return {
      status: 'needs_decision',
      bearing: null,
      source: null,
      candidates: { unitDoorBearing, homeDoorBearing },
      notice: '单元门与入户门同时存在时，资料未给出合成算法；请明确本次定盘采用哪一个。',
    };
  }
  return { status: 'resolved', bearing: values[0], source: 'explicit', notice: '采用唯一已提供门朝向。' };
}

function auditResidence(input = {}) {
  const entrance = resolveEntranceBearing(input);
  if (entrance.status !== 'resolved') {
    return { status: entrance.status, entrance, next: '补充权威门朝向后再定盘。' };
  }
  if (!Array.isArray(input.polygon)) throw new Error('polygon 必须是户型多边形顶点数组');
  const center = houseCenter(input.polygon);
  const placement = input.layout ? auditHouse(input.layout, { year: input.year }) : null;
  return {
    status: 'ready',
    entrance,
    center,
    placement,
    boundary: '门朝向裁决只处理输入口径；不由本模块推断风水吉凶或补造未提供的户型事实。',
  };
}

module.exports = { ENTRANCE_POLICIES, resolveEntranceBearing, auditResidence };
