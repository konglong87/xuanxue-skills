'use strict';

const { isPlainObject } = require('../../_shared/lib/objects');

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} 必须是普通对象`);
}

function assertEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new RangeError(`${label} 必须是 ${allowed.join(' 或 ')}`);
  }
}

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') throw new TypeError(`${label} 必须是 boolean`);
}

function assertText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} 必须是非空字符串`);
  }
}

function assertAllowedKeys(value, allowed, label) {
  const unknown = Object.keys(value).find(key => !allowed.includes(key));
  if (unknown) throw new TypeError(`${label} 包含未知字段 ${unknown}，该字段不允许`);
}

function assertSafeId(value, label) {
  assertText(value, label);
  if (!/^[a-z0-9](?:[a-z0-9_-]{0,63})$/.test(value)) {
    throw new TypeError(`${label} 格式不合法，只允许小写字母、数字、连字符和下划线`);
  }
}

module.exports = {
  assertAllowedKeys,
  assertBoolean,
  assertEnum,
  assertPlainObject,
  assertSafeId,
  assertText,
};
