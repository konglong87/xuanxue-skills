const {
  PALM_REQUIRED_DISCLAIMER: REQUIRED_DISCLAIMER,
  PALM_SAFE_HEALTH_TEXT: SAFE_HEALTH_TEXT,
} = require('../../_shared/safety');

const HANDS = Object.freeze(['left', 'right']);
const OBSERVATION_STAGES = Object.freeze(['fullness', 'lines', 'complexion']);
const FEATURE_TYPES = Object.freeze([
  'overall',
  'hand-shape',
  'mount',
  'major-line',
  'auxiliary-line',
  'special-mark',
]);
const FIVE_ELEMENT_HAND_SHAPES = Object.freeze(['木', '火', '金', '水', '土']);
const PALM_MOUNTS = Object.freeze([
  '金星丘',
  '木星丘',
  '土星丘',
  '太阳丘',
  '水星丘',
  '第一火星丘',
  '第二火星丘',
  '月丘',
  '火星平原',
]);
const MAJOR_LINES = Object.freeze(['生命线', '感情线', '智慧线', '事业线', '婚姻线']);
const AUXILIARY_LINES = Object.freeze(['成功线', '健康线']);
const SPECIAL_MARKS = Object.freeze(['十字纹', '星纹', '岛纹', '三角纹', '格子纹']);
const DOCUMENTED_SPECIAL_MARKS = SPECIAL_MARKS;
const VISIBILITY_LEVELS = Object.freeze(['clear', 'partial', 'not-visible']);
const CONFIDENCE_LEVELS = Object.freeze(['high', 'medium', 'low']);
const REPORT_DOMAINS = Object.freeze(['career', 'relationships', 'health', 'wealth-social']);
const COVERAGE_STATUSES = Object.freeze(['inspected', 'absent', 'not-visible']);
const HAND_SHAPE_TRAITS = deepFreeze({
  木: ['slender-palm', 'long-fingers', 'prominent-knuckles'],
  火: ['pointed-fingertips', 'spread-fingers', 'reddish-hand'],
  金: ['angular-palm', 'square-palm', 'firm-palm'],
  水: ['rounded-palm', 'fleshy-palm', 'very-soft-palm'],
  土: ['thick-palm', 'broad-heavy-palm'],
});
const VISUAL_TRAITS_BY_FEATURE = deepFreeze({
  'hand-shape': [...new Set(Object.values(HAND_SHAPE_TRAITS).flat())],
  mount: ['full', 'flat', 'sunken'],
  'major-line': [
    'clear', 'faint', 'continuous', 'broken', 'forked', 'long', 'short',
    'thick', 'thin', 'deep', 'shallow',
  ],
  'auxiliary-line': [
    'clear', 'faint', 'continuous', 'broken', 'forked', 'long', 'short',
    'thick', 'thin', 'deep', 'shallow',
  ],
  'special-mark': ['distinct-mark', 'faint-mark'],
  overall: ['uniform-color', 'uneven-color', 'rosy-color', 'pale-color'],
});
const VISUAL_TRAITS = Object.freeze([
  ...new Set(Object.values(VISUAL_TRAITS_BY_FEATURE).flat()),
]);
const SPECIAL_MARK_LOCATION_TYPES = Object.freeze([
  'mount', 'major-line', 'auxiliary-line', 'palm-center',
]);
const SPECIAL_MARK_LOCATION_SUBJECTS = deepFreeze({
  mount: PALM_MOUNTS,
  'major-line': MAJOR_LINES,
  'auxiliary-line': AUXILIARY_LINES,
  'palm-center': ['掌心'],
});
const MUTUALLY_EXCLUSIVE_TRAITS = deepFreeze({
  mount: [['full', 'flat', 'sunken']],
  'major-line': [
    ['clear', 'faint'],
    ['continuous', 'broken'],
    ['long', 'short'],
    ['thick', 'thin'],
    ['deep', 'shallow'],
  ],
  'auxiliary-line': [
    ['clear', 'faint'],
    ['continuous', 'broken'],
    ['long', 'short'],
    ['thick', 'thin'],
    ['deep', 'shallow'],
  ],
  overall: [
    ['uniform-color', 'uneven-color'],
    ['rosy-color', 'pale-color'],
  ],
  'special-mark': [['distinct-mark', 'faint-mark']],
});
const INTERPRETATION_RULES = deepFreeze({
  'career-structure-stable': {
    domain: 'career',
    polarity: 'strengths',
    supports: { featureType: 'major-line', subject: '事业线', allTraits: ['continuous'] },
    basis: '该可见结构在传统手相观察中用于提示做事结构与持续性。',
    conclusion: '这项特征可作为事业结构相对稳定的象征线索，仍需结合真实经历核验。',
  },
  'career-flexibility-needed': {
    domain: 'career',
    polarity: 'risks',
    supports: { featureType: 'major-line', subject: '事业线', anyTraits: ['faint', 'broken'] },
    basis: '该可见结构在传统手相观察中用于提示路径调整与适应性。',
    conclusion: '这项特征提示事业推进时可留意调整弹性，不应据此作确定职业判断。',
  },
  'relationships-expression-steady': {
    domain: 'relationships',
    polarity: 'strengths',
    supports: { featureType: 'major-line', subject: '感情线', allTraits: ['continuous'] },
    basis: '该可见结构在传统手相观察中用于提示表达与互动节奏。',
    conclusion: '这项特征可作为关系表达相对稳定的象征线索，需由现实互动验证。',
  },
  'relationships-expectations-variable': {
    domain: 'relationships',
    polarity: 'risks',
    supports: { featureType: 'major-line', subject: '感情线', anyTraits: ['faint', 'broken'] },
    basis: '该可见结构在传统手相观察中用于提示期待与互动节奏的变化。',
    conclusion: '这项特征提示关系中可留意期待变化，不代表具体关系结果。',
  },
  'energy-stable': {
    domain: 'health',
    polarity: 'strengths',
    supports: { featureType: 'overall', subject: '整体气色', allTraits: ['uniform-color'] },
    basis: '该可见结构仅用于传统文化中的当前精力状态观察。',
    conclusion: '这项特征可作为当前精力状态相对平稳的非医疗线索。',
  },
  'energy-variable': {
    domain: 'health',
    polarity: 'risks',
    supports: { featureType: 'overall', subject: '整体气色', allTraits: ['uneven-color'] },
    basis: '该可见结构仅用于传统文化中的当前精力状态观察。',
    conclusion: '这项特征提示当前精力状态可能有波动，仅供日常自我观察。',
  },
  'wealth-social-boundaries-clear': {
    domain: 'wealth-social',
    polarity: 'strengths',
    supports: { featureType: 'hand-shape', subject: '土', allTraits: HAND_SHAPE_TRAITS.土 },
    basis: 'R2/R3 将厚实、宽重的土型手作为务实与资源统筹的传统形态线索。',
    conclusion: '这项特征可作为资源管理倾向的象征线索，仍需结合真实收支与协作记录核验。',
  },
  'wealth-social-boundaries-variable': {
    domain: 'wealth-social',
    polarity: 'risks',
    supports: { featureType: 'major-line', subject: '事业线', anyTraits: ['faint', 'broken'] },
    basis: '该可见结构在传统手相观察中用于提示资源路径的连续性变化。',
    conclusion: '这项特征提示可复核资源安排与现实反馈，不代表收益结果。',
  },
});
const NO_EVIDENCE_RULES = deepFreeze(Object.fromEntries(REPORT_DOMAINS.map(domain => [domain, {
  strengths: {
    code: 'no-confirmed-evidence',
    basis: '当前通过质量与覆盖校验的客观观察中，没有满足该切面优势规则的证据。',
    conclusion: '当前未见可确认的优势线索，不为完成报告而补造判断。',
    action: '保留观察并结合后续清晰图片与现实变化复核。',
  },
  risks: {
    code: 'no-confirmed-evidence',
    basis: '当前通过质量与覆盖校验的客观观察中，没有满足该切面风险规则的证据。',
    conclusion: '当前未见可确认的风险线索，不为保持形式对称而补造判断。',
    action: '保留观察并结合后续清晰图片与现实变化复核。',
  },
}])));
const SINGLE_EVIDENCE_NOTICE = '本切面结论只落在一条观察上，属于单点判断；'
  + '单一特征最容易被读过头，请结合其余切面与现实情况一并核验。';
const ACTION_RULES = Object.freeze({
  'career-build-on-strength': Object.freeze({
    domain: 'career', polarity: 'strengths', text: '结合近期项目复盘，确认并持续使用已有优势。',
  }),
  'career-review-rhythm': Object.freeze({
    domain: 'career', polarity: 'risks', text: '为当前目标设置固定复盘节点，按现实反馈调整节奏。',
  }),
  'relationships-communicate-clearly': Object.freeze({
    domain: 'relationships', polarity: 'strengths', text: '在重要互动中继续清楚表达需要与边界。',
  }),
  'relationships-check-expectations': Object.freeze({
    domain: 'relationships', polarity: 'risks', text: '用直接沟通核对双方期待，避免以象征线索代替事实。',
  }),
  'health-monitor-energy': Object.freeze({
    domain: 'health', polarity: 'strengths', text: '保持规律作息，并以实际感受记录精力状态。',
  }),
  'health-record-changes': Object.freeze({
    domain: 'health', polarity: 'risks', text: '记录作息与精力变化；如有身体不适或疑虑，请及时就医。',
  }),
  'wealth-social-use-boundaries': Object.freeze({
    domain: 'wealth-social', polarity: 'strengths', text: '在实际合作与收支安排中继续明确责任边界。',
  }),
  'wealth-social-review-boundaries': Object.freeze({
    domain: 'wealth-social', polarity: 'risks', text: '复核近期合作与收支边界，以真实记录决定调整。',
  }),
});
const COMPARISON_RULES = Object.freeze({
  'role-balance': '左右同一对象均有可见证据，可结合主宰与协作角色观察其平衡。',
  'left-more-defined': '左手同一对象的可见结构更明确，可结合主宰角色核验。',
  'right-more-defined': '右手同一对象的可见结构更明确，可结合协作角色核验。',
});
const INTERPRETATION_CODES = Object.freeze([
  ...Object.keys(INTERPRETATION_RULES),
  'no-confirmed-evidence',
]);
const ACTION_CODES = Object.freeze(Object.keys(ACTION_RULES));
const COMPARISON_CODES = Object.freeze(Object.keys(COMPARISON_RULES));
const FOCUS_LEVELS = Object.freeze(['clear', 'blurred']);
const EXPOSURE_LEVELS = Object.freeze(['balanced', 'too-dark', 'overexposed']);
const FRAMING_LEVELS = Object.freeze(['complete', 'cropped']);
const OCCLUSION_LEVELS = Object.freeze(['none', 'partial', 'blocked']);
const LIGHTING_ARTIFACTS = Object.freeze(['none', 'shadow', 'glare']);
const FEATURE_STAGE = Object.freeze({
  overall: 'complexion',
  'hand-shape': 'fullness',
  mount: 'fullness',
  'major-line': 'lines',
  'auxiliary-line': 'lines',
  'special-mark': 'lines',
});

const HAND_ROLES = Object.freeze({
  left: '军道/主宰',
  right: '臣道/协作',
});

const QUALITY_GUIDANCE = Object.freeze([
  '请分别提供左手和右手照片。',
  '掌心朝向镜头，完整露出掌根、掌丘和手指根部。',
  '使用均匀自然光，避免过暗、过曝、反光和阴影。',
  '相机对焦掌纹，确保主线和细纹可辨。',
]);

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach(item => deepFreeze(item, seen));
  return Object.freeze(value);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

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

function imageIssues(image, index) {
  const id = image.id ?? `image-${index + 1}`;
  const issues = [];
  if (!image.palmVisible) {
    issues.push({ code: 'palm_not_visible', imageId: id, message: '图片未清晰呈现掌心。' });
  }
  if (image.focus === 'blurred') {
    issues.push({ code: 'image_blurred', imageId: id, message: '图片模糊或失焦。' });
  }
  if (image.exposure === 'too-dark') {
    issues.push({ code: 'image_too_dark', imageId: id, message: '图片过暗。' });
  }
  if (image.exposure === 'overexposed') {
    issues.push({ code: 'image_overexposed', imageId: id, message: '图片过曝。' });
  }
  if (!image.linesVisible) {
    issues.push({ code: 'lines_not_visible', imageId: id, message: '掌纹不可辨。' });
  }
  if (image.framing === 'cropped') {
    issues.push({ code: 'image_cropped', imageId: id, message: '掌心或手指根部被裁切。' });
  }
  if (image.occlusion !== 'none') {
    issues.push({ code: 'palm_occluded', imageId: id, message: '掌心存在遮挡。' });
  }
  if (image.lightingArtifact === 'shadow') {
    issues.push({ code: 'lighting_shadow', imageId: id, message: '阴影影响纹路或气色观察。' });
  }
  if (image.lightingArtifact === 'glare') {
    issues.push({ code: 'lighting_glare', imageId: id, message: '反光影响纹路或气色观察。' });
  }
  return issues;
}

function assessImageQuality(images) {
  if (!Array.isArray(images)) throw new TypeError('images 必须是数组');
  if (images.length === 0) {
    return {
      status: 'needs_input',
      coverage: 'none',
      coverageRatio: 0,
      usableHands: [],
      missingHands: [...HANDS],
      roles: { ...HAND_ROLES },
      issues: [{ code: 'images_required', message: '需要左手和右手的掌心照片。' }],
      notice: '尚无可判读掌图，请补充双手照片。',
      guidance: [...QUALITY_GUIDANCE],
    };
  }

  const issues = [];
  const usableHands = new Set();
  const imageIds = new Set();
  images.forEach((image, index) => {
    assertPlainObject(image, `images[${index}]`);
    assertAllowedKeys(image, [
      'id',
      'hand',
      'palmVisible',
      'focus',
      'exposure',
      'linesVisible',
      'framing',
      'occlusion',
      'lightingArtifact',
    ], `images[${index}]`);
    assertSafeId(image.id, `images[${index}].id`);
    if (imageIds.has(image.id)) throw new Error(`images[${index}].id 重复：${image.id}`);
    imageIds.add(image.id);
    assertEnum(image.hand, HANDS, `images[${index}].hand`);
    assertBoolean(image.palmVisible, `images[${index}].palmVisible`);
    assertEnum(image.focus, FOCUS_LEVELS, `images[${index}].focus`);
    assertEnum(
      image.exposure,
      EXPOSURE_LEVELS,
      `images[${index}].exposure`,
    );
    assertBoolean(image.linesVisible, `images[${index}].linesVisible`);
    assertEnum(image.framing, FRAMING_LEVELS, `images[${index}].framing`);
    assertEnum(image.occlusion, OCCLUSION_LEVELS, `images[${index}].occlusion`);
    assertEnum(
      image.lightingArtifact,
      LIGHTING_ARTIFACTS,
      `images[${index}].lightingArtifact`,
    );

    const currentIssues = imageIssues(image, index);
    issues.push(...currentIssues);
    if (currentIssues.length === 0) usableHands.add(image.hand);
  });

  const orderedHands = HANDS.filter(hand => usableHands.has(hand));
  const missingHands = HANDS.filter(hand => !usableHands.has(hand));
  const coverageRatio = orderedHands.length / HANDS.length;
  const status = coverageRatio === 1 ? 'complete' : coverageRatio === 0 ? 'needs_input' : 'partial';
  const coverage = coverageRatio === 1 ? 'full' : coverageRatio === 0 ? 'none' : 'half';
  let notice = '双手图片均通过质量门禁，可以进行完整对照。';
  if (status === 'partial') {
    const missing = missingHands[0];
    const handLabel = missing === 'left' ? '左手' : '右手';
    notice = `当前只覆盖一半（50%）；缺少${handLabel}（${HAND_ROLES[missing]}），不能完成双手对照。`;
  } else if (status === 'needs_input') {
    notice = '没有通过质量门禁的掌图，暂不进入判读。';
  }

  return {
    status,
    coverage,
    coverageRatio,
    usableHands: orderedHands,
    missingHands,
    roles: { ...HAND_ROLES },
    issues,
    notice,
    guidance: [...QUALITY_GUIDANCE],
  };
}

const SUBJECTS_BY_TYPE = Object.freeze({
  'hand-shape': FIVE_ELEMENT_HAND_SHAPES,
  mount: PALM_MOUNTS,
  'major-line': MAJOR_LINES,
  'auxiliary-line': AUXILIARY_LINES,
});

function validateObservation(item, index, usableHands) {
  assertPlainObject(item, `observations[${index}]`);
  const baseFields = [
    'id', 'hand', 'stage', 'featureType', 'subject', 'visualTraits', 'visibility', 'confidence',
  ];
  const metadataFields = ['source', 'school'];
  const locationFields = ['locationType', 'locationSubject'];
  assertAllowedKeys(item, [...baseFields, ...metadataFields, ...locationFields], `observations[${index}]`);
  const required = baseFields;
  required.forEach(field => {
    if (!Object.prototype.hasOwnProperty.call(item, field)) {
      throw new TypeError(`observations[${index}].${field} 为必填字段`);
    }
  });

  assertSafeId(item.id, `observations[${index}].id`);
  assertEnum(item.hand, HANDS, `observations[${index}].hand`);
  if (!usableHands.includes(item.hand)) {
    throw new Error(`observations[${index}].hand=${item.hand} 没有对应的可用掌图`);
  }
  assertEnum(item.stage, OBSERVATION_STAGES, `observations[${index}].stage`);
  assertEnum(item.featureType, FEATURE_TYPES, `observations[${index}].featureType`);
  const expectedStage = FEATURE_STAGE[item.featureType];
  if (item.stage !== expectedStage) {
    throw new Error(
      `observations[${index}].featureType=${item.featureType} 必须使用 stage=${expectedStage}`,
    );
  }
  assertText(item.subject, `observations[${index}].subject`);
  if (item.featureType === 'overall' && item.subject !== '整体气色') {
    throw new Error(`observations[${index}].featureType=overall 的 subject 必须是整体气色`);
  }
  const allowedSubjects = SUBJECTS_BY_TYPE[item.featureType];
  if (allowedSubjects && !allowedSubjects.includes(item.subject)) {
    const hint = item.featureType === 'major-line'
      ? '五条主线'
      : item.featureType === 'auxiliary-line' ? '辅助线' : item.featureType;
    throw new RangeError(`observations[${index}].subject 不属于${hint}清单`);
  }
  if (item.featureType === 'special-mark'
    && !DOCUMENTED_SPECIAL_MARKS.includes(item.subject)) {
    if (!Object.prototype.hasOwnProperty.call(item, 'source')
      || !Object.prototype.hasOwnProperty.call(item, 'school')) {
      throw new TypeError(`observations[${index}] 扩展特殊纹路必须同时提供 source（来源）与 school（流派）`);
    }
    assertText(item.source, `observations[${index}].source`);
    let sourceUrl;
    try {
      sourceUrl = new URL(item.source);
    } catch {
      throw new TypeError(`observations[${index}].source 必须是有效的 HTTPS URL`);
    }
    if (sourceUrl.protocol !== 'https:') {
      throw new TypeError(`observations[${index}].source 必须是 HTTPS URL`);
    }
    if (typeof item.school !== 'string'
      || !/^[\p{Script=Han}A-Za-z0-9_-]{1,20}$/u.test(item.school)) {
      throw new TypeError(`observations[${index}].school 必须是 1 到 20 字的流派短标签`);
    }
  } else if (Object.prototype.hasOwnProperty.call(item, 'source')
    || Object.prototype.hasOwnProperty.call(item, 'school')) {
    throw new TypeError(`observations[${index}] 的 source/school 只允许用于扩展特殊纹路`);
  }
  if (item.featureType === 'special-mark') {
    if (!Object.prototype.hasOwnProperty.call(item, 'locationType')
      || !Object.prototype.hasOwnProperty.call(item, 'locationSubject')) {
      throw new TypeError(`observations[${index}] 特殊纹路必须提供 locationType 和 locationSubject`);
    }
    assertEnum(
      item.locationType,
      SPECIAL_MARK_LOCATION_TYPES,
      `observations[${index}].locationType`,
    );
    assertEnum(
      item.locationSubject,
      SPECIAL_MARK_LOCATION_SUBJECTS[item.locationType],
      `observations[${index}].locationSubject（${item.locationType} 对应对象）`,
    );
  } else if (Object.prototype.hasOwnProperty.call(item, 'locationType')
    || Object.prototype.hasOwnProperty.call(item, 'locationSubject')) {
    throw new TypeError(
      `observations[${index}] 的 locationType/locationSubject 只允许用于特殊纹路`,
    );
  }
  if (!Array.isArray(item.visualTraits) || item.visualTraits.length === 0) {
    throw new TypeError(`observations[${index}].visualTraits 必须是非空数组`);
  }
  const visualTraits = item.visualTraits.map((trait, traitIndex) => {
    assertEnum(
      trait,
      VISUAL_TRAITS_BY_FEATURE[item.featureType],
      `observations[${index}] ${item.featureType}/${item.subject} 的 visualTraits[${traitIndex}]`,
    );
    return trait;
  });
  if (new Set(visualTraits).size !== visualTraits.length) {
    throw new Error(`observations[${index}].visualTraits 不得重复`);
  }
  for (const group of MUTUALLY_EXCLUSIVE_TRAITS[item.featureType] || []) {
    const present = group.filter(trait => visualTraits.includes(trait));
    if (present.length > 1) {
      throw new Error(
        `observations[${index}].visualTraits 包含互斥特征：${present.join(', ')}`,
      );
    }
  }
  if (item.featureType === 'hand-shape') {
    const requiredTraits = HAND_SHAPE_TRAITS[item.subject];
    const exactMatch = visualTraits.length === requiredTraits.length
      && requiredTraits.every(trait => visualTraits.includes(trait));
    if (!exactMatch) {
      throw new Error(
        `observations[${index}] hand-shape=${item.subject} 的关键形态必须是 ${requiredTraits.join(', ')}`,
      );
    }
  }
  assertEnum(item.visibility, VISIBILITY_LEVELS, `observations[${index}].visibility`);
  assertEnum(item.confidence, CONFIDENCE_LEVELS, `observations[${index}].confidence`);
  if (item.visibility === 'not-visible' && item.confidence !== 'low') {
    throw new Error(`observations[${index}] visibility=not-visible 时 confidence 必须是 low`);
  }
  const normalized = {
    id: item.id,
    hand: item.hand,
    stage: item.stage,
    featureType: item.featureType,
    subject: item.subject,
    visualTraits,
    visibility: item.visibility,
    confidence: item.confidence,
  };
  if (item.featureType === 'special-mark'
    && !DOCUMENTED_SPECIAL_MARKS.includes(item.subject)) {
    normalized.source = item.source;
    normalized.school = item.school;
  }
  if (item.featureType === 'special-mark') {
    normalized.locationType = item.locationType;
    normalized.locationSubject = item.locationSubject;
  }
  return normalized;
}

function validateCoverageStatus(value, path) {
  assertEnum(value, COVERAGE_STATUSES, path);
  return value;
}

function validateCoverageMap(value, path, requiredSubjects) {
  assertPlainObject(value, path);
  assertAllowedKeys(value, requiredSubjects, path);
  const result = {};
  requiredSubjects.forEach(subject => {
    if (!Object.prototype.hasOwnProperty.call(value, subject)) {
      throw new TypeError(`${path}.${subject} 为必填覆盖项`);
    }
    result[subject] = validateCoverageStatus(value[subject], `${path}.${subject}`);
  });
  return result;
}

function validateCoverageManifest(manifest, { usableHands } = {}) {
  assertPlainObject(manifest, 'coverageManifest');
  if (!Array.isArray(usableHands)) throw new TypeError('usableHands 必须是数组');
  usableHands.forEach((hand, index) => assertEnum(hand, HANDS, `usableHands[${index}]`));
  assertAllowedKeys(manifest, usableHands, 'coverageManifest');

  HANDS.filter(hand => !usableHands.includes(hand)).forEach(hand => {
    if (Object.prototype.hasOwnProperty.call(manifest, hand)) {
      throw new Error(`coverageManifest.${hand} 没有对应的可用掌图`);
    }
  });

  const result = {};
  usableHands.forEach(hand => {
    const path = `coverageManifest.${hand}`;
    const coverage = manifest[hand];
    assertPlainObject(coverage, path);
    assertAllowedKeys(coverage, [
      'handShape',
      'mounts',
      'majorLines',
      'auxiliaryLines',
      'specialMarks',
      'complexion',
    ], path);
    result[hand] = {
      handShape: validateCoverageStatus(coverage.handShape, `${path}.handShape`),
      mounts: validateCoverageMap(coverage.mounts, `${path}.mounts`, PALM_MOUNTS),
      majorLines: validateCoverageMap(coverage.majorLines, `${path}.majorLines`, MAJOR_LINES),
      auxiliaryLines: validateCoverageMap(
        coverage.auxiliaryLines,
        `${path}.auxiliaryLines`,
        AUXILIARY_LINES,
      ),
      specialMarks: validateCoverageStatus(coverage.specialMarks, `${path}.specialMarks`),
      complexion: validateCoverageStatus(coverage.complexion, `${path}.complexion`),
    };
  });
  return result;
}

function observationCoverageEntry(observation, handCoverage) {
  if (observation.featureType === 'hand-shape') {
    return { label: '五行手型', status: handCoverage.handShape };
  }
  if (observation.featureType === 'mount') {
    return { label: observation.subject, status: handCoverage.mounts[observation.subject] };
  }
  if (observation.featureType === 'major-line') {
    return { label: observation.subject, status: handCoverage.majorLines[observation.subject] };
  }
  if (observation.featureType === 'auxiliary-line') {
    return { label: observation.subject, status: handCoverage.auxiliaryLines[observation.subject] };
  }
  if (observation.featureType === 'special-mark') {
    return { label: '特殊纹路', status: handCoverage.specialMarks };
  }
  if (observation.stage === 'complexion') {
    return { label: '气色', status: handCoverage.complexion };
  }
  return null;
}

function assertObservationCoverage(observations, coverageManifest) {
  observations.forEach((observation, index) => {
    const entry = observationCoverageEntry(observation, coverageManifest[observation.hand]);
    if (!entry) return;
    const matches = (entry.status === 'inspected' && observation.visibility !== 'not-visible')
      || (entry.status === 'not-visible' && observation.visibility === 'not-visible');
    if (!matches) {
      throw new Error(
        `observations[${index}] 的${entry.label} visibility=${observation.visibility} 与 coverage manifest 的 ${entry.status} 不一致`,
      );
    }
  });
}

function hasObservation(observations, hand, featureType, subject) {
  return observations.some(item => item.hand === hand
    && item.featureType === featureType
    && (subject === undefined || item.subject === subject));
}

function assertInspectedCoverageHasObservations(observations, coverageManifest) {
  Object.entries(coverageManifest).forEach(([hand, coverage]) => {
    const requirements = [
      ['五行手型', coverage.handShape, 'hand-shape'],
      ...PALM_MOUNTS.map(subject => [subject, coverage.mounts[subject], 'mount', subject]),
      ...MAJOR_LINES.map(subject => [subject, coverage.majorLines[subject], 'major-line', subject]),
      ...AUXILIARY_LINES.map(subject => [
        subject, coverage.auxiliaryLines[subject], 'auxiliary-line', subject,
      ]),
      ['特殊纹路', coverage.specialMarks, 'special-mark'],
      ['整体气色', coverage.complexion, 'overall', '整体气色'],
    ];
    requirements.forEach(([label, status, featureType, subject]) => {
      if (status === 'inspected'
        && !observations.some(item => item.hand === hand
          && item.featureType === featureType
          && (subject === undefined || item.subject === subject)
          && item.visibility !== 'not-visible')) {
        throw new Error(
          `coverageManifest.${hand}.${label}=inspected，但缺少对应 observation`,
        );
      }
    });
    if (!observations.some(item => item.hand === hand && item.visibility !== 'not-visible')) {
      throw new Error(`coverageManifest.${hand} 缺少可用于判读的观察证据`);
    }
  });
}

function validateObservations(observations, { usableHands } = {}) {
  if (!Array.isArray(observations)) throw new TypeError('observations 必须是数组');
  if (!Array.isArray(usableHands)) throw new TypeError('usableHands 必须是数组');
  usableHands.forEach((hand, index) => assertEnum(hand, HANDS, `usableHands[${index}]`));

  const previousStageByHand = Object.fromEntries(HANDS.map(hand => [hand, -1]));
  const ids = new Set();
  return observations.map((item, index) => {
    const validated = validateObservation(item, index, usableHands);
    if (ids.has(validated.id)) throw new Error(`观察 id 重复：${validated.id}`);
    ids.add(validated.id);
    const currentStage = OBSERVATION_STAGES.indexOf(validated.stage);
    if (currentStage < previousStageByHand[validated.hand]) {
      throw new Error('观察顺序必须是 fullness（饱满度） -> lines（纹路） -> complexion（气色）');
    }
    previousStageByHand[validated.hand] = currentStage;
    return validated;
  });
}

const HAND_LABELS = Object.freeze({ left: '左手', right: '右手' });
const FEATURE_LABELS = Object.freeze({
  overall: '整体',
  'hand-shape': '五行手型',
  mount: '掌丘',
  'major-line': '主线',
  'auxiliary-line': '辅助线',
  'special-mark': '特殊纹路',
});
const TRAIT_LABELS = Object.freeze({
  'slender-palm': '掌形瘦长',
  'long-fingers': '手指偏长',
  'prominent-knuckles': '骨节明显',
  'pointed-fingertips': '指端偏尖',
  'spread-fingers': '指缝较散',
  'reddish-hand': '手部色泽偏红润',
  'angular-palm': '掌形棱角分明',
  'square-palm': '手掌方正',
  'firm-palm': '掌部质感硬朗',
  'rounded-palm': '掌形圆润',
  'fleshy-palm': '掌部肉感明显',
  'very-soft-palm': '掌部质感柔软',
  'thick-palm': '掌体厚实',
  'broad-heavy-palm': '掌形宽重',
  full: '饱满',
  flat: '平实',
  sunken: '偏低',
  clear: '清晰',
  faint: '偏浅',
  continuous: '连续',
  broken: '有中断',
  forked: '有分叉',
  long: '偏长',
  short: '偏短',
  thick: '线条偏粗',
  thin: '线条偏细',
  deep: '线条偏深',
  shallow: '线条偏浅',
  'uniform-color': '色泽均匀',
  'uneven-color': '色泽不均',
  'rosy-color': '气色红润',
  'pale-color': '气色偏淡',
  'distinct-mark': '纹样清楚',
  'faint-mark': '纹样偏浅',
});

function displaySubject(observation) {
  if (observation.featureType === 'special-mark'
    && !DOCUMENTED_SPECIAL_MARKS.includes(observation.subject)) {
    return '扩展特殊纹路';
  }
  return observation.subject;
}

function toRenderedObservation(observation) {
  const safe = {
    id: observation.id,
    hand: observation.hand,
    stage: observation.stage,
    featureType: observation.featureType,
    subject: displaySubject(observation),
    visualTraits: [...observation.visualTraits],
    visibility: observation.visibility,
    confidence: observation.confidence,
  };
  if (observation.featureType === 'special-mark') {
    safe.locationType = observation.locationType;
    safe.locationSubject = observation.locationSubject;
  }
  return safe;
}

function formatSeen(observation) {
  const traits = observation.visualTraits.map(trait => TRAIT_LABELS[trait]).join('、');
  return [
    HAND_LABELS[observation.hand],
    FEATURE_LABELS[observation.featureType],
    displaySubject(observation),
    traits,
    `visibility=${observation.visibility}`,
    `confidence=${observation.confidence}`,
  ].join('｜');
}

function observationSupportsRule(observation, supports) {
  if (observation.featureType !== supports.featureType || observation.subject !== supports.subject) {
    return false;
  }
  if (supports.allTraits
    && !supports.allTraits.every(trait => observation.visualTraits.includes(trait))) {
    return false;
  }
  if (supports.anyTraits
    && !supports.anyTraits.some(trait => observation.visualTraits.includes(trait))) {
    return false;
  }
  return true;
}

function validateReportItem(item, path, observationById, domain, polarity) {
  assertPlainObject(item, path);
  if (item.interpretationCode === 'no-confirmed-evidence') {
    assertAllowedKeys(item, ['interpretationCode'], path);
    const matchingEvidence = Object.values(INTERPRETATION_RULES)
      .filter(rule => rule.domain === domain && rule.polarity === polarity)
      .some(rule => [...observationById.values()].some(observation => (
        observation.visibility !== 'not-visible'
        && observationSupportsRule(observation, rule.supports)
      )));
    if (matchingEvidence) {
      const polarityLabel = polarity === 'strengths' ? '优势' : '风险';
      throw new Error(`${path}.no-confirmed-evidence 不适用：已有符合规则的${polarityLabel}证据`);
    }
    return { ...NO_EVIDENCE_RULES[domain][polarity] };
  }
  assertAllowedKeys(
    item,
    ['observationId', 'interpretationCode', 'actionCode'],
    path,
  );
  ['observationId', 'interpretationCode', 'actionCode'].forEach(field => {
    assertText(item[field], `${path}.${field}`);
  });
  const observation = observationById.get(item.observationId);
  if (!observation) throw new Error(`${path} 引用了不存在的 observation ${item.observationId}`);
  if (observation.visibility === 'not-visible') {
    throw new Error(`${path} 不得引用 visibility=not-visible 的 observation`);
  }
  const interpretation = INTERPRETATION_RULES[item.interpretationCode];
  if (!interpretation
    || interpretation.domain !== domain
    || interpretation.polarity !== polarity) {
    throw new Error(`${path}.interpretationCode 不适用于 ${domain}.${polarity}`);
  }
  if (!observationSupportsRule(observation, interpretation.supports)) {
    const support = interpretation.supports;
    const traits = support.allTraits || support.anyTraits;
    throw new Error(
      `${path}.${item.interpretationCode} 解释条件要求 ${support.featureType}/${support.subject}`
      + ` 与 visualTraits=${traits.join(', ')}`,
    );
  }
  const action = ACTION_RULES[item.actionCode];
  if (!action || action.domain !== domain || action.polarity !== polarity) {
    throw new Error(`${path}.actionCode 不适用于 ${domain}.${polarity}`);
  }
  return {
    observationId: observation.id,
    seen: formatSeen(observation),
    basis: interpretation.basis,
    conclusion: interpretation.conclusion,
    action: action.text,
  };
}

function validateHandComparison(comparison, observations) {
  assertPlainObject(comparison, 'report.handComparison');
  assertAllowedKeys(comparison, ['pairs'], 'report.handComparison');
  const observationById = new Map(observations.map(item => [item.id, item]));
  if (!Array.isArray(comparison.pairs) || comparison.pairs.length === 0) {
    throw new Error('report.handComparison.pairs 必须至少包含一组左右手成对证据');
  }
  const pairs = comparison.pairs.map((pair, index) => {
    const path = `report.handComparison.pairs[${index}]`;
    assertPlainObject(pair, path);
    assertAllowedKeys(
      pair,
      ['leftObservationId', 'rightObservationId', 'comparisonCode'],
      path,
    );
    ['leftObservationId', 'rightObservationId', 'comparisonCode'].forEach(field => {
      assertText(pair[field], `${path}.${field}`);
    });
    assertEnum(pair.comparisonCode, COMPARISON_CODES, `${path}.comparisonCode`);
    const left = observationById.get(pair.leftObservationId);
    const right = observationById.get(pair.rightObservationId);
    if (!left || left.hand !== 'left' || left.visibility === 'not-visible') {
      throw new Error(`${path}.leftObservationId 必须引用可见的左手 observation`);
    }
    if (!right || right.hand !== 'right' || right.visibility === 'not-visible') {
      throw new Error(`${path}.rightObservationId 必须引用可见的右手 observation`);
    }
    if (left.featureType !== right.featureType || left.subject !== right.subject) {
      throw new Error(`${path} 左右 observation 必须具有相同 featureType 和 subject 才能成对`);
    }
    return {
      leftObservationId: left.id,
      rightObservationId: right.id,
      featureType: left.featureType,
      subject: displaySubject(left),
      leftSeen: formatSeen(left),
      rightSeen: formatSeen(right),
      conclusion: COMPARISON_RULES[pair.comparisonCode],
    };
  });
  return { pairs };
}

function validateReport(report, observations, {
  requiredHands = [], coverageNotice, coverageManifest,
} = {}) {
  assertPlainObject(report, 'report');
  const allowed = ['domains', 'healthText', 'disclaimer'];
  if (requiredHands.length === 2) allowed.push('handComparison');
  assertAllowedKeys(report, allowed, 'report');
  assertPlainObject(report.domains, 'report.domains');
  assertAllowedKeys(report.domains, REPORT_DOMAINS, 'report.domains');
  if (report.healthText !== SAFE_HEALTH_TEXT) {
    throw new Error('report.healthText 必须精确等于 SAFE_HEALTH_TEXT');
  }
  if (report.disclaimer !== REQUIRED_DISCLAIMER) {
    throw new Error('report.disclaimer 必须精确等于 REQUIRED_DISCLAIMER');
  }
  const observationById = new Map(observations.map(item => [item.id, item]));
  const domains = Object.fromEntries(REPORT_DOMAINS.map(domain => {
    const path = `report.domains.${domain}`;
    const section = report.domains[domain];
    assertPlainObject(section, path);
    assertAllowedKeys(section, ['strengths', 'risks'], path);
    const renderedSection = Object.fromEntries(['strengths', 'risks'].map(polarity => {
      const items = section[polarity];
      if (!Array.isArray(items)) {
        throw new TypeError(`${path}.${polarity} 必须是数组，好坏必须分列`);
      }
      if (items.length === 0) {
        throw new Error(`${path}.${polarity} 至少需要一项`);
      }
      if (items.some(item => item && item.interpretationCode === 'no-confirmed-evidence')
        && items.length !== 1) {
        throw new Error(`${path}.${polarity} 的 no-confirmed-evidence 只能单独使用`);
      }
      return [polarity, items.map((item, index) => validateReportItem(
        item,
        `${path}.${polarity}[${index}]`,
        observationById,
        domain,
        polarity,
      ))];
    }));
    // 单点判断是判读里最常见的误判来源：同一条观察不得在一个切面里被拆成两条结论；
    // 整个切面只落在一条观察上时，必须把这一点显式告诉用户，而不是让它读起来像多重印证。
    const citedIds = ['strengths', 'risks']
      .flatMap(polarity => renderedSection[polarity])
      .map(item => item.observationId)
      .filter(Boolean);
    const distinctIds = new Set(citedIds);
    if (distinctIds.size !== citedIds.length) {
      throw new Error(`${path} 同一切面内不得重复引用同一条 observation 作为多条结论`);
    }
    if (distinctIds.size === 1) renderedSection.evidenceNotice = SINGLE_EVIDENCE_NOTICE;
    return [domain, renderedSection];
  }));
  const renderedReport = {
    coverageNotice,
    observations: observations
      .map(toRenderedObservation)
      .sort((a, b) => {
        const stageOrder = OBSERVATION_STAGES.indexOf(a.stage) - OBSERVATION_STAGES.indexOf(b.stage);
        return stageOrder || HANDS.indexOf(a.hand) - HANDS.indexOf(b.hand);
      }),
    coverageManifest,
    domains,
    healthText: SAFE_HEALTH_TEXT,
    disclaimer: REQUIRED_DISCLAIMER,
  };
  if (requiredHands.length === 2) {
    renderedReport.handComparison = validateHandComparison(report.handComparison, observations);
  }
  return renderedReport;
}

function validatePalmContract(input = {}) {
  assertPlainObject(input, 'input');
  assertAllowedKeys(input, ['images', 'observations', 'coverageManifest', 'report'], 'input');
  const {
    images,
    observations = [],
    coverageManifest,
    report,
  } = input;
  const quality = assessImageQuality(images ?? []);
  if (quality.status === 'needs_input') {
    const observationsProvided = !Array.isArray(observations) || observations.length > 0;
    return deepFreeze({
      status: 'needs_input',
      quality,
      observationsValidated: false,
      coverageValidated: false,
      reportValidated: false,
      unvalidatedInput: {
        observationsProvided,
        coverageManifestProvided: coverageManifest !== undefined,
        reportProvided: report !== undefined,
      },
      notice: observationsProvided || coverageManifest !== undefined || report !== undefined
        ? '图片未通过质量门禁；所附观察、覆盖 manifest 与报告均未验证，不得使用。'
        : '图片未通过质量门禁，尚无观察或报告可验证。',
    });
  }
  const validatedCoverage = validateCoverageManifest(coverageManifest, {
    usableHands: quality.usableHands,
  });
  const validatedObservations = validateObservations(observations, {
    usableHands: quality.usableHands,
  });
  assertObservationCoverage(validatedObservations, validatedCoverage);
  assertInspectedCoverageHasObservations(validatedObservations, validatedCoverage);
  let renderedReport;
  if (report !== undefined) {
    renderedReport = validateReport(report, validatedObservations, {
      requiredHands: quality.usableHands,
      coverageNotice: quality.notice,
      coverageManifest: validatedCoverage,
    });
  }
  return deepFreeze({
    status: quality.status,
    quality,
    coverageManifest: validatedCoverage,
    observations: validatedObservations,
    observationsValidated: true,
    coverageValidated: true,
    reportValidated: report !== undefined,
    ...(renderedReport ? { renderedReport } : {}),
  });
}

module.exports = deepFreeze({
  ACTION_CODES,
  AUXILIARY_LINES,
  COMPARISON_CODES,
  CONFIDENCE_LEVELS,
  COVERAGE_STATUSES,
  DOCUMENTED_SPECIAL_MARKS,
  EXPOSURE_LEVELS,
  FEATURE_TYPES,
  FIVE_ELEMENT_HAND_SHAPES,
  FOCUS_LEVELS,
  FRAMING_LEVELS,
  HANDS,
  HAND_ROLES,
  HAND_SHAPE_TRAITS,
  INTERPRETATION_CODES,
  MAJOR_LINES,
  LIGHTING_ARTIFACTS,
  OBSERVATION_STAGES,
  OCCLUSION_LEVELS,
  PALM_MOUNTS,
  QUALITY_GUIDANCE,
  REPORT_DOMAINS,
  REQUIRED_DISCLAIMER,
  SAFE_HEALTH_TEXT,
  SINGLE_EVIDENCE_NOTICE,
  SPECIAL_MARK_LOCATION_TYPES,
  SPECIAL_MARKS,
  VISUAL_TRAITS,
  VISUAL_TRAITS_BY_FEATURE,
  VISIBILITY_LEVELS,
  validatePalmContract,
});
