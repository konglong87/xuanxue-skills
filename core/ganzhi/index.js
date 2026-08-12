function formatValue(value) {
  if (Array.isArray(value)) return value.map(formatValue).join('、');
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${key}：${formatValue(item)}`).join('\n');
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  return value == null ? '无' : String(value);
}

module.exports = {
  ...require('./constants'),
  ...require('./basic'),
  ...require('./relation'),
  ...require('./shishen'),
  ...require('./chart'),
  ...require('./marriage'),
  ...require('./domains'),
  format: formatValue,
};
