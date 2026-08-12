const { TIANGAN, DIZHI } = require('../../../core/ganzhi');
const { fangweiOf, luoshuOf } = require('../../../core/direction');
const { EVIDENCE_RULES, REDLINES, disclaimerFor } = require('../../_shared/safety');

const 天干 = Object.freeze([...TIANGAN]);
const 地支 = Object.freeze([...DIZHI]);
const 九宫方位 = Object.freeze(Array.from({ length: 9 }, (_, index) => fangweiOf(index + 1)));
const 八门 = Object.freeze(['开', '休', '生', '伤', '杜', '景', '死', '惊']);
const 九星 = Object.freeze([
  '天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽',
]);
const 八神 = Object.freeze(['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']);
const 标记 = Object.freeze(['击刑', '入墓', '庚', '虎', '门破', '门迫', '空亡']);
const 来源类型 = Object.freeze(['外部APP', '手工转录']);
const FIELD_STATUSES = Object.freeze(['confirmed', 'missing', 'unreadable', 'uncertain', 'unknown']);
const PROVENANCE_TRUST = 'untrusted-audit-only';
const PROVENANCE_LIMITS = Object.freeze({
  来源名称: 128,
  字段原词: 512,
  标记原词: 512,
  标记来源: 128,
  标记流派: 128,
});
const ERROR_LIMITS = Object.freeze({
  MAX_PUBLIC_ERRORS: 64,
  MAX_UNKNOWN_FIELDS_PER_CONTAINER: 8,
});
const INPUT_LIMITS = Object.freeze({
  MAX_PALACES: 9,
  MAX_MARKERS_PER_PALACE: 16,
});
const PUBLIC_ERRORS_TRUNCATED = Object.freeze({
  path: '$errors[truncated]',
  code: 'errors_truncated',
  message: '公开错误已达到上限；其余问题仅保留在调用方审计输入中。',
});
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const REPORT_CONTRACT = deepFreeze({
  disclaimer: [...disclaimerFor('奇门')],
  evidenceRules: [...EVIDENCE_RULES],
  redlines: [...REDLINES.奇门],
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function createErrorCollector() {
  const values = [];
  let truncated = false;
  return {
    add(error) {
      if (truncated) return;
      if (values.length < ERROR_LIMITS.MAX_PUBLIC_ERRORS) {
        values.push(error);
        return;
      }
      values[ERROR_LIMITS.MAX_PUBLIC_ERRORS - 1] = { ...PUBLIC_ERRORS_TRUNCATED };
      truncated = true;
    },
    values,
  };
}

function addError(errors, path, code, message) {
  errors.add({ path, code, message });
}

function addUnexpectedFieldErrors(source, allowed, errors, pathPrefix, label) {
  const allowedFields = new Set(allowed);
  let unexpectedCount = 0;
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key) || allowedFields.has(key)) continue;
    if (unexpectedCount === ERROR_LIMITS.MAX_UNKNOWN_FIELDS_PER_CONTAINER) {
      const reference = '$unexpected[truncated]';
      const path = pathPrefix ? `${pathPrefix}.${reference}` : reference;
      addError(
        errors,
        path,
        'unexpected_fields_truncated',
        `${label}含更多未声明字段；其余字段仅保留在调用方审计输入中。`,
      );
      break;
    }
    const reference = `$unexpected[${unexpectedCount}]`;
    const path = pathPrefix ? `${pathPrefix}.${reference}` : reference;
    addError(
      errors,
      path,
      'unexpected_field',
      `${label}含未声明字段；字段名仅属不可信审计输入，安全引用 ${path}。`,
    );
    unexpectedCount += 1;
  }
}

function validateProvenanceText(value, errors, path, limit) {
  if (typeof value !== 'string') return;
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    addError(errors, path, 'control_character', `${path} 含不允许的控制字符。`);
  }
  if (value.length > limit) {
    addError(errors, path, 'text_too_long', `${path} 超过 ${limit} 字符限制。`);
  }
}

function validateCellProvenance(cell, errors, path) {
  if (path === '来源.名称') {
    const values = [...new Set([cell.value, cell.raw].filter(value => typeof value === 'string'))];
    values.forEach((value, index) => validateProvenanceText(
      value,
      errors,
      index === 0 ? path : `${path}.raw`,
      PROVENANCE_LIMITS.来源名称,
    ));
    return cell;
  }
  validateProvenanceText(cell.raw, errors, `${path}.raw`, PROVENANCE_LIMITS.字段原词);
  return cell;
}

function missingCell(errors, path) {
  addError(errors, path, 'missing_value', `${path} 缺失，请按外部局盘原文补录。`);
  return { status: 'missing', value: null, raw: null };
}

function unresolvedCell(status, raw, errors, path) {
  const codes = {
    missing: 'missing_value',
    unreadable: 'unreadable_value',
    uncertain: 'uncertain_value',
    unknown: 'unknown_value',
  };
  const labels = {
    missing: '缺失', unreadable: '不可读', uncertain: '不确定', unknown: '未知',
  };
  const preservedRaw = typeof raw === 'string' && raw.trim() !== '' ? raw : null;
  addError(errors, path, codes[status], `${path} ${labels[status]}，已保留原词且不会猜测。`);
  return { status, value: null, raw: preservedRaw };
}

function normalizedString(value) {
  return typeof value === 'string' ? value.trim() : null;
}

function normalizeCell(input, allowed, errors, path) {
  if (input === undefined || input === null || normalizedString(input) === '') {
    return validateCellProvenance(missingCell(errors, path), errors, path);
  }

  if (isPlainObject(input)) {
    addUnexpectedFieldErrors(input, ['status', 'value', 'raw'], errors, path, `${path} `);
    if (!FIELD_STATUSES.includes(input.status)) {
      return validateCellProvenance(
        unresolvedCell('unknown', input.raw ?? String(input.status), errors, path),
        errors,
        path,
      );
    }
    if (input.status !== 'confirmed') {
      return validateCellProvenance(
        unresolvedCell(input.status, input.raw, errors, path),
        errors,
        path,
      );
    }
    const candidate = normalizedString(input.value);
    const hasRaw = Object.prototype.hasOwnProperty.call(input, 'raw');
    let raw = input.value;
    if (hasRaw && input.raw === null) {
      raw = null;
    } else if (hasRaw && typeof input.raw === 'string') {
      raw = input.raw;
    } else if (hasRaw) {
      raw = null;
      addError(errors, `${path}.raw`, 'invalid_raw', `${path}.raw 显式提供时必须是字符串或 null。`);
    }
    if (!candidate) return validateCellProvenance(missingCell(errors, path), errors, path);
    if (allowed && !allowed.includes(candidate)) {
      return validateCellProvenance(
        unresolvedCell('unknown', raw, errors, path),
        errors,
        path,
      );
    }
    return validateCellProvenance({ status: 'confirmed', value: candidate, raw }, errors, path);
  }

  const candidate = normalizedString(input);
  if (!candidate) {
    return validateCellProvenance(
      unresolvedCell('unknown', String(input), errors, path),
      errors,
      path,
    );
  }
  if (allowed && !allowed.includes(candidate)) {
    return validateCellProvenance(unresolvedCell('unknown', input, errors, path), errors, path);
  }
  return validateCellProvenance(
    { status: 'confirmed', value: candidate, raw: input },
    errors,
    path,
  );
}

function normalizeMarker(marker, errors, path) {
  let source = marker;
  if (!isPlainObject(source)) {
    source = { 名称: marker, raw: typeof marker === 'string' ? marker : null };
    addError(errors, path, 'invalid_marker', `${path} 必须包含名称、raw、source 和 school。`);
  }

  addUnexpectedFieldErrors(
    source,
    ['名称', 'raw', 'source', 'school'],
    errors,
    path,
    `${path} `,
  );

  const raw = typeof source.raw === 'string' && source.raw.trim() !== '' ? source.raw : null;
  const markerSource = typeof source.source === 'string' && source.source.trim() !== ''
    ? source.source : null;
  const school = typeof source.school === 'string' && source.school.trim() !== ''
    ? source.school : null;

  validateProvenanceText(raw, errors, `${path}.raw`, PROVENANCE_LIMITS.标记原词);
  validateProvenanceText(
    markerSource,
    errors,
    `${path}.source`,
    PROVENANCE_LIMITS.标记来源,
  );
  validateProvenanceText(school, errors, `${path}.school`, PROVENANCE_LIMITS.标记流派);

  if (!raw) addError(errors, `${path}.raw`, 'missing_marker_raw', `${path}.raw 缺失。`);
  if (!markerSource) {
    addError(errors, `${path}.source`, 'missing_marker_source', `${path}.source 缺失。`);
  }
  if (!school) {
    addError(errors, `${path}.school`, 'missing_marker_school', `${path}.school 缺失。`);
  }

  return {
    名称: normalizeCell(source.名称, 标记, errors, `${path}.名称`),
    raw,
    source: markerSource,
    school,
  };
}

function normalizeMarkers(input, errors, path) {
  if (!Array.isArray(input)) {
    addError(errors, path, 'missing_markers', `${path} 必须是数组；确认无标记时应明确传入空数组。`);
    return [];
  }
  if (input.length > INPUT_LIMITS.MAX_MARKERS_PER_PALACE) {
    addError(
      errors,
      path,
      'marker_count_exceeded',
      '单宫标记数量超过安全上限；仅审计允许范围内的标记。',
    );
  }
  const markerCount = Math.min(input.length, INPUT_LIMITS.MAX_MARKERS_PER_PALACE);
  return Array.from(
    { length: markerCount },
    (_, index) => normalizeMarker(input[index], errors, `${path}[${index}]`),
  );
}

function normalizePalace(input, index, errors) {
  const path = `九宫[${index}]`;
  let source = input;
  if (!isPlainObject(source)) {
    addError(errors, path, 'invalid_palace', `${path} 必须是普通对象。`);
    source = {};
  }
  addUnexpectedFieldErrors(
    source,
    ['方向', '天盘干', '地盘干', '八门', '九星', '八神', '标记'],
    errors,
    path,
    `${path} `,
  );

  const 方向 = normalizeCell(source.方向, 九宫方位, errors, `${path}.方向`);
  return {
    宫数: 方向.status === 'confirmed' ? luoshuOf(方向.value) : null,
    方向,
    天盘干: normalizeCell(source.天盘干, 天干, errors, `${path}.天盘干`),
    地盘干: normalizeCell(source.地盘干, 天干, errors, `${path}.地盘干`),
    八门: normalizeCell(source.八门, 八门, errors, `${path}.八门`),
    九星: normalizeCell(source.九星, 九星, errors, `${path}.九星`),
    八神: normalizeCell(source.八神, 八神, errors, `${path}.八神`),
    标记: normalizeMarkers(source.标记, errors, `${path}.标记`),
    _inputIndex: index,
  };
}

function normalizeSource(input, errors) {
  let source = input;
  if (!isPlainObject(source)) {
    addError(errors, '来源', 'invalid_source', '来源必须包含类型与名称。');
    source = {};
  }
  addUnexpectedFieldErrors(source, ['类型', '名称'], errors, '来源', '来源');
  return {
    类型: normalizeCell(source.类型, 来源类型, errors, '来源.类型'),
    名称: normalizeCell(source.名称, null, errors, '来源.名称'),
  };
}

function validateDirections(palaces, errors) {
  const firstIndex = new Map();
  palaces.forEach(palace => {
    if (palace.方向.status !== 'confirmed') return;
    const value = palace.方向.value;
    if (firstIndex.has(value)) {
      addError(
        errors,
        `九宫[${palace._inputIndex}].方向`,
        'duplicate_direction',
        `方向 ${value} 重复，首次出现在九宫[${firstIndex.get(value)}]。`,
      );
    } else {
      firstIndex.set(value, palace._inputIndex);
    }
  });
  九宫方位.forEach(value => {
    if (!firstIndex.has(value)) {
      addError(errors, '九宫', 'missing_direction', `九宫缺少方向 ${value}，不会自动补盘。`);
    }
  });
}

function safeCell(cell, path) {
  return {
    status: cell.status,
    value: cell.value,
    provenance: {
      trust: PROVENANCE_TRUST,
      rawPresent: typeof cell.raw === 'string' && cell.raw.length > 0,
      provenanceRef: `qimen:${path}.raw`,
    },
  };
}

function safeMarker(marker, path) {
  return {
    名称: safeCell(marker.名称, `${path}.名称`),
    provenance: {
      trust: PROVENANCE_TRUST,
      rawPresent: typeof marker.raw === 'string' && marker.raw.length > 0,
      sourcePresent: typeof marker.source === 'string' && marker.source.length > 0,
      schoolPresent: typeof marker.school === 'string' && marker.school.length > 0,
      provenanceRef: `qimen:${path}`,
    },
  };
}

function projectSafeChart(chart) {
  return {
    来源: {
      类型: safeCell(chart.来源.类型, '来源.类型'),
      名称: {
        status: chart.来源.名称.status,
        present: typeof chart.来源.名称.value === 'string' && chart.来源.名称.value.length > 0,
        trust: PROVENANCE_TRUST,
        provenanceRef: 'qimen:来源.名称',
      },
    },
    月令: safeCell(chart.月令, '月令'),
    值符: safeCell(chart.值符, '值符'),
    值使: safeCell(chart.值使, '值使'),
    九宫: chart.九宫.map((palace, palaceIndex) => {
      const path = `九宫[${palaceIndex}]`;
      return {
        宫数: palace.宫数,
        方向: safeCell(palace.方向, `${path}.方向`),
        天盘干: safeCell(palace.天盘干, `${path}.天盘干`),
        地盘干: safeCell(palace.地盘干, `${path}.地盘干`),
        八门: safeCell(palace.八门, `${path}.八门`),
        九星: safeCell(palace.九星, `${path}.九星`),
        八神: safeCell(palace.八神, `${path}.八神`),
        标记: palace.标记.map((marker, markerIndex) => (
          safeMarker(marker, `${path}.标记[${markerIndex}]`)
        )),
      };
    }),
  };
}

function normalizeChart(transcribed) {
  const errorCollector = createErrorCollector();
  const { values: errors } = errorCollector;
  if (!isPlainObject(transcribed)) {
    addError(errorCollector, '$', 'invalid_chart', '局盘转录必须是普通对象。');
    return { chart: null, safeChart: null, errors };
  }
  addUnexpectedFieldErrors(
    transcribed,
    ['来源', '月令', '值符', '值使', '九宫'],
    errorCollector,
    '',
    '局盘',
  );
  const normalizedHeader = {
    来源: normalizeSource(transcribed.来源, errorCollector),
    月令: normalizeCell(transcribed.月令, 地支, errorCollector, '月令'),
    值符: normalizeCell(transcribed.值符, 九星, errorCollector, '值符'),
    值使: normalizeCell(transcribed.值使, 八门, errorCollector, '值使'),
  };
  if (!Array.isArray(transcribed.九宫)) {
    addError(errorCollector, '九宫', 'invalid_palaces', '九宫必须是外部局盘逐宫转录数组。');
    return { chart: null, safeChart: null, errors };
  }
  if (transcribed.九宫.length > INPUT_LIMITS.MAX_PALACES) {
    addError(
      errorCollector,
      '九宫',
      'palace_count_exceeded',
      '九宫数量超过安全上限；仅审计允许范围内的宫位。',
    );
  } else if (transcribed.九宫.length !== 九宫方位.length) {
    addError(
      errorCollector,
      '九宫',
      'palace_count',
      `九宫必须完整转录 9 宫，当前为 ${transcribed.九宫.length} 宫。`,
    );
  }

  const palaceCount = Math.min(transcribed.九宫.length, INPUT_LIMITS.MAX_PALACES);
  const normalizedPalaces = Array.from(
    { length: palaceCount },
    (_, index) => normalizePalace(transcribed.九宫[index], index, errorCollector),
  );
  validateDirections(normalizedPalaces, errorCollector);
  normalizedPalaces.sort((left, right) => {
    const leftNumber = left.宫数 ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = right.宫数 ?? Number.MAX_SAFE_INTEGER;
    return leftNumber - rightNumber || left._inputIndex - right._inputIndex;
  });
  const 九宫 = normalizedPalaces.map(({ _inputIndex, ...palace }) => palace);

  const chart = { ...normalizedHeader, 九宫 };
  return { chart, safeChart: projectSafeChart(chart), errors };
}

module.exports = {
  normalizeChart,
  REPORT_CONTRACT,
  天干,
  地支,
  九宫方位,
  八门,
  九星,
  八神,
  标记,
  来源类型,
  FIELD_STATUSES,
  ERROR_LIMITS,
  INPUT_LIMITS,
  MAX_MARKERS_PER_PALACE: INPUT_LIMITS.MAX_MARKERS_PER_PALACE,
  PROVENANCE_LIMITS,
  PROVENANCE_TRUST,
};
