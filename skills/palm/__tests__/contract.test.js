const contract = require('../lib/contract');
const sharedSafety = require('../../_shared/safety');

const {
  ACTION_CODES,
  AUXILIARY_LINES,
  COMPARISON_CODES,
  COVERAGE_STATUSES,
  DOCUMENTED_SPECIAL_MARKS,
  FEATURE_TYPES,
  FIVE_ELEMENT_HAND_SHAPES,
  HAND_SHAPE_TRAITS,
  INTERPRETATION_CODES,
  MAJOR_LINES,
  OBSERVATION_STAGES,
  PALM_MOUNTS,
  REPORT_DOMAINS,
  REQUIRED_DISCLAIMER,
  SAFE_HEALTH_TEXT,
  SPECIAL_MARK_LOCATION_TYPES,
  SPECIAL_MARKS,
  VISUAL_TRAITS,
  VISUAL_TRAITS_BY_FEATURE,
  validatePalmContract,
} = contract;

const clearImage = hand => ({
  id: `${hand}-palm`,
  hand,
  palmVisible: true,
  focus: 'clear',
  exposure: 'balanced',
  linesVisible: true,
  framing: 'complete',
  occlusion: 'none',
  lightingArtifact: 'none',
});

function observation(hand, id, stage, featureType, subject, overrides = {}) {
  const defaultTraits = {
    'hand-shape': HAND_SHAPE_TRAITS[subject] ? [...HAND_SHAPE_TRAITS[subject]] : undefined,
    mount: ['full'],
    'major-line': ['clear', 'continuous'],
    'auxiliary-line': ['clear', 'continuous'],
    'special-mark': ['distinct-mark'],
    overall: ['uniform-color'],
  };
  return {
    id: `${hand}-${id}`,
    hand,
    stage,
    featureType,
    subject,
    visualTraits: defaultTraits[featureType],
    visibility: 'clear',
    confidence: 'high',
    ...overrides,
  };
}

function completeObservations(hand) {
  return [
    observation(hand, 'shape', 'fullness', 'hand-shape', '土'),
    ...PALM_MOUNTS.map((subject, index) => observation(
      hand, `mount-${index}`, 'fullness', 'mount', subject, { visualTraits: ['full'] },
    )),
    ...MAJOR_LINES.map((subject, index) => observation(
      hand, `major-${index}`, 'lines', 'major-line', subject,
    )),
    ...AUXILIARY_LINES.map((subject, index) => observation(
      hand, `aux-${index}`, 'lines', 'auxiliary-line', subject,
    )),
    observation(hand, 'complexion', 'complexion', 'overall', '整体气色'),
  ];
}

function handCoverage(overrides = {}) {
  return {
    handShape: 'inspected',
    mounts: Object.fromEntries(PALM_MOUNTS.map(item => [item, 'inspected'])),
    majorLines: Object.fromEntries(MAJOR_LINES.map(item => [item, 'inspected'])),
    auxiliaryLines: Object.fromEntries(AUXILIARY_LINES.map(item => [item, 'inspected'])),
    specialMarks: 'absent',
    complexion: 'inspected',
    ...overrides,
  };
}

const DOMAIN_CODES = Object.freeze({
  career: {
    strengths: ['career-structure-stable', 'career-build-on-strength'],
    risks: ['career-flexibility-needed', 'career-review-rhythm'],
  },
  relationships: {
    strengths: ['relationships-expression-steady', 'relationships-communicate-clearly'],
    risks: ['relationships-expectations-variable', 'relationships-check-expectations'],
  },
  health: {
    strengths: ['energy-stable', 'health-monitor-energy'],
    risks: ['energy-variable', 'health-record-changes'],
  },
  'wealth-social': {
    strengths: ['wealth-social-boundaries-clear', 'wealth-social-use-boundaries'],
    risks: ['wealth-social-boundaries-variable', 'wealth-social-review-boundaries'],
  },
});

function reportItem(item, domain, polarity) {
  const [interpretationCode, actionCode] = DOMAIN_CODES[domain][polarity];
  return { observationId: item.id, interpretationCode, actionCode };
}

const noEvidenceItem = () => ({ interpretationCode: 'no-confirmed-evidence' });

function handComparison(observations) {
  const left = observations.find(item => item.hand === 'left' && item.featureType === 'hand-shape');
  const right = observations.find(item => item.hand === 'right' && item.featureType === 'hand-shape');
  return {
    pairs: [{
      leftObservationId: left.id,
      rightObservationId: right.id,
      comparisonCode: 'role-balance',
    }],
  };
}

function report(observations, includeComparison = false) {
  const find = subject => observations.find(item => item.subject === subject);
  return {
    domains: {
      career: {
        strengths: [reportItem(find('事业线'), 'career', 'strengths')],
        risks: [noEvidenceItem()],
      },
      relationships: {
        strengths: [reportItem(find('感情线'), 'relationships', 'strengths')],
        risks: [noEvidenceItem()],
      },
      health: {
        strengths: [reportItem(find('整体气色'), 'health', 'strengths')],
        risks: [noEvidenceItem()],
      },
      'wealth-social': {
        strengths: [reportItem(find('土'), 'wealth-social', 'strengths')],
        risks: [noEvidenceItem()],
      },
    },
    healthText: SAFE_HEALTH_TEXT,
    disclaimer: REQUIRED_DISCLAIMER,
    ...(includeComparison ? { handComparison: handComparison(observations) } : {}),
  };
}

function validInput(hands = ['left'], includeReport = true) {
  const observations = hands.flatMap(completeObservations);
  return {
    images: hands.map(clearImage),
    observations,
    coverageManifest: Object.fromEntries(hands.map(hand => [hand, handCoverage()])),
    ...(includeReport ? { report: report(observations, hands.length === 2) } : {}),
  };
}

describe('受控公开契约', () => {
  test('健康文本与免责声明只别名共享安全常量', () => {
    expect(SAFE_HEALTH_TEXT).toBe(sharedSafety.PALM_SAFE_HEALTH_TEXT);
    expect(REQUIRED_DISCLAIMER).toBe(sharedSafety.PALM_REQUIRED_DISCLAIMER);
  });
  test('唯一公开函数是 validatePalmContract，其余公开项都是构造输入所需常量', () => {
    expect(Object.entries(contract)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)).toEqual(['validatePalmContract']);
    expect(SAFE_HEALTH_TEXT).toMatch(/体质倾向.*不构成医疗诊断.*就医/);
    expect(REQUIRED_DISCLAIMER).toMatch(/传统文化.*娱乐.*不保证/);
  });

  test('观察、报告和左右对照的代码清单由常量约束', () => {
    expect(OBSERVATION_STAGES).toEqual(['fullness', 'lines', 'complexion']);
    expect(FEATURE_TYPES).toContain('auxiliary-line');
    expect(VISUAL_TRAITS).toEqual(expect.arrayContaining([
      'full', 'flat', 'clear', 'continuous', 'broken', 'uniform-color',
    ]));
    expect(VISUAL_TRAITS_BY_FEATURE).toMatchObject({
      mount: expect.arrayContaining(['full', 'flat', 'sunken']),
      'major-line': expect.arrayContaining([
        'clear', 'continuous', 'broken', 'thick', 'thin', 'deep', 'shallow',
      ]),
      overall: expect.arrayContaining(['uniform-color', 'uneven-color']),
      'special-mark': expect.arrayContaining(['distinct-mark']),
    });
    expect(HAND_SHAPE_TRAITS).toEqual({
      木: ['slender-palm', 'long-fingers', 'prominent-knuckles'],
      火: ['pointed-fingertips', 'spread-fingers', 'reddish-hand'],
      金: ['angular-palm', 'square-palm', 'firm-palm'],
      水: ['rounded-palm', 'fleshy-palm', 'very-soft-palm'],
      土: ['thick-palm', 'broad-heavy-palm'],
    });
    expect(INTERPRETATION_CODES).toEqual(expect.arrayContaining([
      'career-structure-stable', 'energy-stable', 'energy-variable',
    ]));
    expect(ACTION_CODES).toEqual(expect.arrayContaining([
      'career-build-on-strength', 'health-monitor-energy',
    ]));
    expect(COMPARISON_CODES).toEqual(['role-balance', 'left-more-defined', 'right-more-defined']);
    expect(SPECIAL_MARK_LOCATION_TYPES).toEqual([
      'mount', 'major-line', 'auxiliary-line', 'palm-center',
    ]);
    expect(COVERAGE_STATUSES).toEqual(['inspected', 'absent', 'not-visible']);
  });

  test('主线支持笔记中的粗细与深浅客观观察，并拒绝互斥组合', () => {
    const thick = validInput(['left'], false);
    const lifeLine = thick.observations.find(item => item.subject === '生命线');
    lifeLine.visualTraits = ['clear', 'continuous', 'thick', 'deep'];
    expect(validatePalmContract(thick).observations[thick.observations.indexOf(lifeLine)])
      .toMatchObject({ visualTraits: ['clear', 'continuous', 'thick', 'deep'] });

    const conflicting = validInput(['left'], false);
    const conflictingLine = conflicting.observations.find(item => item.subject === '生命线');
    conflictingLine.visualTraits = ['clear', 'continuous', 'thick', 'thin'];
    expect(() => validatePalmContract(conflicting)).toThrow(/互斥.*visualTraits|visualTraits.*互斥/);
  });

  test('基础观察清单保留有来源边界', () => {
    expect(FIVE_ELEMENT_HAND_SHAPES).toEqual(['木', '火', '金', '水', '土']);
    expect(PALM_MOUNTS).toHaveLength(9);
    expect(MAJOR_LINES).toEqual(['生命线', '感情线', '智慧线', '事业线', '婚姻线']);
    expect(AUXILIARY_LINES).toEqual(['成功线', '健康线']);
    expect(SPECIAL_MARKS).toEqual(['十字纹', '星纹', '岛纹', '三角纹', '格子纹']);
    expect(DOCUMENTED_SPECIAL_MARKS).toBe(SPECIAL_MARKS);
  });

  test('所有公开数组和对象递归冻结', () => {
    const assertDeepFrozen = value => {
      if (value === null || typeof value !== 'object') return;
      expect(Object.isFrozen(value)).toBe(true);
      Object.values(value).forEach(assertDeepFrozen);
    };
    Object.values(contract).forEach(assertDeepFrozen);
  });
});

describe('图片、观察与覆盖', () => {
  test('无图时返回 needs_input，并明确观察和报告未验证', () => {
    expect(validatePalmContract({ images: [], observations: [{}], report: {} })).toMatchObject({
      status: 'needs_input',
      observationsValidated: false,
      coverageValidated: false,
      reportValidated: false,
      quality: { issues: [expect.objectContaining({ code: 'images_required' })] },
    });
  });

  test.each([
    [{ palmVisible: false }, 'palm_not_visible'],
    [{ focus: 'blurred' }, 'image_blurred'],
    [{ exposure: 'too-dark' }, 'image_too_dark'],
    [{ exposure: 'overexposed' }, 'image_overexposed'],
    [{ linesVisible: false }, 'lines_not_visible'],
    [{ framing: 'cropped' }, 'image_cropped'],
    [{ occlusion: 'partial' }, 'palm_occluded'],
    [{ lightingArtifact: 'shadow' }, 'lighting_shadow'],
    [{ lightingArtifact: 'glare' }, 'lighting_glare'],
  ])('坏图拒绝：%p', (override, code) => {
    const result = validatePalmContract({ images: [{ ...clearImage('left'), ...override }] });
    expect(result.status).toBe('needs_input');
    expect(result.quality.issues).toContainEqual(expect.objectContaining({ code }));
  });

  test('image.id 只接受安全标识且不得重复', () => {
    for (const id of ['', '左手', 'left palm', '../left']) {
      expect(() => validatePalmContract({ images: [{ ...clearImage('left'), id }] }))
        .toThrow(/id.*格式|id.*非空/);
    }
    expect(() => validatePalmContract({ images: [
      clearImage('left'), { ...clearImage('right'), id: 'left-palm' },
    ] })).toThrow(/id.*重复|重复.*id/);
  });

  test('observation 只接受客观视觉字段，不接受旧自由文本字段', () => {
    for (const field of ['location', 'morphology', 'evidence', 'conclusion']) {
      const input = validInput(['left'], false);
      input.observations[0][field] = '乙肝猝死医院享年';
      expect(() => validatePalmContract(input)).toThrow(new RegExp(`未知字段.*${field}|${field}.*不允许`));
    }
  });

  test('visualTraits 只接受枚举，featureType 与 stage 严格对应', () => {
    const injected = validInput(['left'], false);
    injected.observations[0].visualTraits = ['乙肝'];
    expect(() => validatePalmContract(injected)).toThrow(/visualTraits/);

    const wrongStage = validInput(['left'], false);
    wrongStage.observations[0].stage = 'lines';
    expect(() => validatePalmContract(wrongStage)).toThrow(/hand-shape.*fullness|fullness.*hand-shape/);
  });

  test('visualTraits 按 featureType 隔离，五行手型必须满足 R2/R3 关键形态组合', () => {
    const wrongShape = validInput(['left'], false);
    wrongShape.observations[0].subject = '木';
    wrongShape.observations[0].visualTraits = ['rounded-palm', 'very-soft-palm'];
    expect(() => validatePalmContract(wrongShape)).toThrow(/木.*visualTraits|hand-shape.*木/);

    const wrongLine = validInput(['left'], false);
    const lifeLine = wrongLine.observations.find(item => item.subject === '生命线');
    lifeLine.visualTraits = ['angular-palm', 'firm-palm'];
    expect(() => validatePalmContract(wrongLine)).toThrow(/major-line.*visualTraits|生命线.*visualTraits/);

    const incompleteMetal = validInput(['left'], false);
    incompleteMetal.observations[0].subject = '金';
    incompleteMetal.observations[0].visualTraits = ['angular-palm', 'firm-palm'];
    expect(() => validatePalmContract(incompleteMetal)).toThrow(/金.*square-palm|金.*关键形态/);
  });

  test('inspected 对应 clear/partial；not-visible 可对应不可见记录；absent 禁止记录', () => {
    expect(validatePalmContract(validInput(['left'], false))).toMatchObject({
      status: 'partial', observationsValidated: true, coverageValidated: true,
    });

    const hidden = validInput(['left'], false);
    hidden.coverageManifest.left.majorLines.婚姻线 = 'not-visible';
    const marriage = hidden.observations.find(item => item.subject === '婚姻线');
    marriage.visibility = 'not-visible';
    marriage.confidence = 'low';
    expect(validatePalmContract(hidden)).toMatchObject({ coverageValidated: true });

    const absent = validInput(['left'], false);
    absent.coverageManifest.left.majorLines.生命线 = 'absent';
    expect(() => validatePalmContract(absent)).toThrow(/生命线.*absent|absent.*生命线/);
  });

  test('扩展特殊纹路元数据受格式约束且不会成为结论文本', () => {
    const input = validInput(['left'], false);
    input.coverageManifest.left.specialMarks = 'inspected';
    input.observations.splice(-1, 0, observation(
      'left', 'custom', 'lines', 'special-mark', '四方纹', {
        source: 'https://example.com/palm-source',
        school: '示例流派',
        locationType: 'mount',
        locationSubject: '木星丘',
      },
    ));
    const result = validatePalmContract(input);
    expect(result.observations.find(item => item.subject === '四方纹')).toMatchObject({
      source: 'https://example.com/palm-source', school: '示例流派',
    });

    const bad = validInput(['left'], false);
    bad.coverageManifest.left.specialMarks = 'inspected';
    bad.observations.splice(-1, 0, observation(
      'left', 'custom', 'lines', 'special-mark', '四方纹', {
        source: '乙肝', school: '医院猝死',
        locationType: 'mount', locationSubject: '木星丘',
      },
    ));
    expect(() => validatePalmContract(bad)).toThrow(/source|school/);
  });

  test.each([
    '乙肝确诊',
    '甲亢风险',
    '肝癌概率',
    '心梗预警',
    '猝死征兆',
    '享年六十',
    '寿命八十年',
    '还能活十年',
    '无需就医',
    '不要看医生',
    '代替医疗',
    '医院确诊',
  ])('扩展特殊纹路注入“%s”只留内部元数据，不进入整个 renderedReport', injected => {
    const input = validInput(['left']);
    input.coverageManifest.left.specialMarks = 'inspected';
    const custom = observation('left', 'custom', 'lines', 'special-mark', `${injected}纹`, {
      source: `https://example.com/${encodeURIComponent(injected)}`,
      school: injected,
      locationType: 'major-line',
      locationSubject: '感情线',
    });
    input.observations.splice(-1, 0, custom);

    const result = validatePalmContract(input);
    expect(JSON.stringify(result.renderedReport)).not.toContain(injected);
    expect(result.renderedReport.observations).toContainEqual({
      id: custom.id,
      hand: 'left',
      stage: 'lines',
      featureType: 'special-mark',
      subject: '扩展特殊纹路',
      visualTraits: ['distinct-mark'],
      visibility: 'clear',
      confidence: 'high',
      locationType: 'major-line',
      locationSubject: '感情线',
    });
    expect(result.observations).toContainEqual(expect.objectContaining({
      subject: `${injected}纹`,
      school: injected,
    }));
  });

  test.each([
    ['mount', '金星丘', ['full', 'flat']],
    ['mount', '金星丘', ['full', 'sunken']],
    ['major-line', '生命线', ['clear', 'faint']],
    ['major-line', '生命线', ['clear', 'continuous', 'broken']],
    ['major-line', '生命线', ['clear', 'long', 'short']],
    ['overall', '整体气色', ['uniform-color', 'uneven-color']],
    ['overall', '整体气色', ['rosy-color', 'pale-color']],
  ])('%s/%s 拒绝互斥 visualTraits %p', (featureType, subject, visualTraits) => {
    const input = validInput(['left'], false);
    input.observations.find(item => item.featureType === featureType && item.subject === subject)
      .visualTraits = visualTraits;
    expect(() => validatePalmContract(input)).toThrow(/visualTraits.*互斥|互斥.*visualTraits/);
  });

  test('special-mark 拒绝 distinct-mark + faint-mark', () => {
    const input = validInput(['left'], false);
    input.coverageManifest.left.specialMarks = 'inspected';
    input.observations.splice(-1, 0, observation(
      'left', 'mark', 'lines', 'special-mark', '十字纹', {
        visualTraits: ['distinct-mark', 'faint-mark'],
        locationType: 'palm-center',
        locationSubject: '掌心',
      },
    ));
    expect(() => validatePalmContract(input)).toThrow(/visualTraits.*互斥|互斥.*visualTraits/);
  });

  test('特殊纹路必须使用受控位置类型和对应对象', () => {
    const missing = validInput(['left'], false);
    missing.coverageManifest.left.specialMarks = 'inspected';
    missing.observations.splice(-1, 0, observation(
      'left', 'mark', 'lines', 'special-mark', '十字纹',
    ));
    expect(() => validatePalmContract(missing)).toThrow(/locationType|locationSubject/);

    const mismatch = validInput(['left'], false);
    mismatch.coverageManifest.left.specialMarks = 'inspected';
    mismatch.observations.splice(-1, 0, observation(
      'left', 'mark', 'lines', 'special-mark', '十字纹', {
        locationType: 'mount',
        locationSubject: '生命线',
      },
    ));
    expect(() => validatePalmContract(mismatch)).toThrow(/locationSubject.*mount|掌丘/);
  });

  test('顶层与 coverageManifest 每一层拒绝额外字段和循环注入', () => {
    const top = validInput(['left'], false);
    top.extra = true;
    expect(() => validatePalmContract(top)).toThrow(/未知字段.*extra|extra.*不允许/);

    const cases = [
      input => { input.coverageManifest.extra = true; },
      input => { input.coverageManifest.left.extra = true; },
      input => { input.coverageManifest.left.mounts.extra = true; },
      input => { input.coverageManifest.left.majorLines.extra = true; },
      input => { input.coverageManifest.left.auxiliaryLines.extra = true; },
    ];
    cases.forEach(inject => {
      const input = validInput(['left'], false);
      inject(input);
      expect(() => validatePalmContract(input)).toThrow(/未知字段.*extra|extra.*不允许/);
    });

    const cyclic = validInput(['left'], false);
    cyclic.coverageManifest.left.loop = cyclic.coverageManifest;
    expect(() => validatePalmContract(cyclic)).toThrow(/未知字段.*loop|loop.*不允许/);
  });
});

describe('受控报告渲染', () => {
  test('正常单手四切面由代码渲染，输出无输入自由结论', () => {
    const result = validatePalmContract(validInput(['left']));
    expect(result).toMatchObject({
      status: 'partial',
      reportValidated: true,
      renderedReport: {
        coverageNotice: expect.stringMatching(/一半|50%/),
        healthText: SAFE_HEALTH_TEXT,
        disclaimer: REQUIRED_DISCLAIMER,
      },
    });
    expect(Object.keys(result.renderedReport.domains)).toEqual(REPORT_DOMAINS);
    for (const domain of REPORT_DOMAINS) {
      expect(result.renderedReport.domains[domain].strengths[0]).toEqual(expect.objectContaining({
        seen: expect.stringMatching(/visibility=clear.*confidence=high/),
        basis: expect.any(String),
        conclusion: expect.any(String),
        action: expect.any(String),
      }));
      expect(result.renderedReport.domains[domain].risks[0]).toEqual(expect.objectContaining({
        code: 'no-confirmed-evidence',
        conclusion: expect.stringMatching(/未见|没有.*证据/),
        action: expect.any(String),
      }));
    }
  });

  test('renderedReport 固定包含按三看和左右手排序的完整客观清单与覆盖 manifest', () => {
    const input = validInput(['left', 'right']);
    input.coverageManifest.left.majorLines.婚姻线 = 'not-visible';
    const hidden = input.observations.find(item => item.hand === 'left' && item.subject === '婚姻线');
    hidden.visibility = 'not-visible';
    hidden.confidence = 'low';
    input.coverageManifest.right.specialMarks = 'absent';

    const result = validatePalmContract(input);
    expect(result.renderedReport.observations).toHaveLength(input.observations.length);
    expect(result.renderedReport.coverageManifest).toEqual(result.coverageManifest);
    expect(result.renderedReport.coverageManifest.left.majorLines.婚姻线).toBe('not-visible');
    expect(result.renderedReport.coverageManifest.right.specialMarks).toBe('absent');
    const order = result.renderedReport.observations.map(item => `${item.stage}:${item.hand}`);
    expect(order).toEqual([...order].sort((a, b) => {
      const [stageA, handA] = a.split(':');
      const [stageB, handB] = b.split(':');
      const stageOrder = OBSERVATION_STAGES.indexOf(stageA) - OBSERVATION_STAGES.indexOf(stageB);
      return stageOrder || ['left', 'right'].indexOf(handA) - ['left', 'right'].indexOf(handB);
    }));
    expect(result.renderedReport.observations).toContainEqual(expect.objectContaining({
      id: hidden.id,
      visibility: 'not-visible',
      confidence: 'low',
    }));
  });

  test('报告项只接受 observationId + interpretationCode + actionCode', () => {
    for (const field of ['seen', 'basis', 'conclusion', 'action']) {
      const input = validInput(['left']);
      input.report.domains.health.strengths[0][field] = '乙肝猝死医院享年';
      expect(() => validatePalmContract(input)).toThrow(/未知字段|不允许/);
    }
  });

  test('interpretationCode/actionCode 必须绑定 domain 与 polarity，健康仅允许固定非医疗码', () => {
    const crossDomain = validInput(['left']);
    crossDomain.report.domains.health.strengths[0].interpretationCode = 'career-structure-stable';
    expect(() => validatePalmContract(crossDomain)).toThrow(/interpretationCode.*health.*strengths/i);

    const crossPolarity = validInput(['left']);
    const careerLine = observation(
      'left', 'career-risk', 'lines', 'major-line', '事业线', {
        visualTraits: ['clear', 'broken'],
      },
    );
    crossPolarity.observations.splice(-1, 0, careerLine);
    crossPolarity.report.domains.career.risks = [{
      observationId: careerLine.id,
      interpretationCode: 'career-flexibility-needed',
      actionCode: 'career-build-on-strength',
    }];
    expect(() => validatePalmContract(crossPolarity)).toThrow(/actionCode.*career.*risks/i);

    expect(INTERPRETATION_CODES.filter(code => code.startsWith('energy-')))
      .toEqual(['energy-stable', 'energy-variable']);
  });

  test('解释码必须匹配 featureType、subject 和关键 visualTraits', () => {
    const wrongSubject = validInput(['left']);
    wrongSubject.report.domains.career.strengths[0].observationId = wrongSubject.observations.find(
      item => item.subject === '生命线',
    ).id;
    expect(() => validatePalmContract(wrongSubject)).toThrow(/career-structure-stable.*事业线|解释条件/);

    const wrongTrait = validInput(['left']);
    const careerLine = wrongTrait.observations.find(item => item.subject === '事业线');
    careerLine.visualTraits = ['clear', 'broken'];
    expect(() => validatePalmContract(wrongTrait)).toThrow(/career-structure-stable.*continuous|解释条件/);

    const handShapeEverywhere = validInput(['left']);
    for (const domain of ['career', 'relationships', 'health']) {
      handShapeEverywhere.report.domains[domain].strengths[0].observationId = handShapeEverywhere
        .observations.find(item => item.featureType === 'hand-shape').id;
    }
    expect(() => validatePalmContract(handShapeEverywhere)).toThrow(/解释条件/);
  });

  test('四切面 strengths/risks 都不得为空，no-confirmed-evidence 不引用观察且不能隐藏证据', () => {
    for (const polarity of ['strengths', 'risks']) {
      const empty = validInput(['left']);
      empty.report.domains.career[polarity] = [];
      expect(() => validatePalmContract(empty)).toThrow(/career.*(?:strengths|risks).*至少/);
    }

    const riskWithObservation = validInput(['left']);
    riskWithObservation.report.domains.career.risks[0].observationId = 'left-major-3';
    expect(() => validatePalmContract(riskWithObservation)).toThrow(/未知字段.*observationId|不允许/);

    const concealedRisk = validInput(['left']);
    concealedRisk.observations.splice(-1, 0, observation(
      'left', 'career-risk', 'lines', 'major-line', '事业线', {
        visualTraits: ['clear', 'broken'],
      },
    ));
    expect(() => validatePalmContract(concealedRisk)).toThrow(
      /no-confirmed-evidence.*(?:已有|存在).*风险证据/,
    );

    const duplicatedNoEvidence = validInput(['left']);
    duplicatedNoEvidence.report.domains.career.risks.push(noEvidenceItem());
    expect(() => validatePalmContract(duplicatedNoEvidence)).toThrow(
      /no-confirmed-evidence.*只能单独使用/,
    );
  });

  test('非土型、断线或气色不均时 strengths 可受控声明未见确认优势', () => {
    const input = validInput(['left']);
    const shape = input.observations.find(item => item.featureType === 'hand-shape');
    shape.subject = '木';
    shape.visualTraits = [...HAND_SHAPE_TRAITS.木];
    input.report.domains['wealth-social'].strengths = [noEvidenceItem()];

    const relationshipLine = input.observations.find(item => item.subject === '感情线');
    relationshipLine.visualTraits = ['clear', 'broken'];
    input.report.domains.relationships.strengths = [noEvidenceItem()];
    input.report.domains.relationships.risks = [reportItem(
      relationshipLine, 'relationships', 'risks',
    )];

    const complexion = input.observations.find(item => item.featureType === 'overall');
    complexion.visualTraits = ['uneven-color'];
    input.report.domains.health.strengths = [noEvidenceItem()];
    input.report.domains.health.risks = [reportItem(complexion, 'health', 'risks')];

    const result = validatePalmContract(input);
    for (const domain of ['wealth-social', 'relationships', 'health']) {
      expect(result.renderedReport.domains[domain].strengths).toEqual([
        expect.objectContaining({
          code: 'no-confirmed-evidence',
          conclusion: expect.stringMatching(/未见.*优势/),
        }),
      ]);
    }
  });

  test('固定健康文本和免责声明精确相等，旧自由位置无法注入', () => {
    for (const [field, value] of [
      ['healthText', '乙肝需要留意，考虑去医院。'],
      ['disclaimer', '猝死与享年可以保证。'],
    ]) {
      const input = validInput(['left']);
      input.report[field] = value;
      expect(() => validatePalmContract(input)).toThrow(new RegExp(field));
    }
  });

  test('正常双手报告生成同对象成对 renderedReport', () => {
    const result = validatePalmContract(validInput(['left', 'right']));
    expect(result.status).toBe('complete');
    expect(result.renderedReport.handComparison.pairs[0]).toEqual(expect.objectContaining({
      subject: '土',
      featureType: 'hand-shape',
      leftSeen: expect.stringMatching(/^左手/),
      rightSeen: expect.stringMatching(/^右手/),
      conclusion: expect.any(String),
    }));
  });

  test('handComparison 只接受成对 ID + comparisonCode，同对象校验不可绕过', () => {
    const injected = validInput(['left', 'right']);
    injected.report.handComparison.pairs[0].conclusion = '乙肝猝死医院享年';
    expect(() => validatePalmContract(injected)).toThrow(/未知字段|不允许/);

    const mismatch = validInput(['left', 'right']);
    mismatch.report.handComparison.pairs[0].rightObservationId = mismatch.observations.find(
      item => item.hand === 'right' && item.subject === '生命线',
    ).id;
    expect(() => validatePalmContract(mismatch)).toThrow(/相同 featureType.*subject|成对/);

    const badCode = validInput(['left', 'right']);
    badCode.report.handComparison.pairs[0].comparisonCode = '乙肝';
    expect(() => validatePalmContract(badCode)).toThrow(/comparisonCode/);
  });

  test('校验完成后修改原始输入不会影响返回结果', () => {
    const input = validInput(['left']);
    const result = validatePalmContract(input);
    const snapshot = JSON.stringify(result);

    const lifeLine = input.observations.find(item => item.subject === '生命线');
    expect(Object.isFrozen(lifeLine.visualTraits)).toBe(false);
    input.images[0].hand = 'right';
    lifeLine.visualTraits[0] = 'faint';
    expect(lifeLine.visualTraits[0]).toBe('faint');
    input.coverageManifest.left.mounts.金星丘 = 'absent';
    input.report.domains.career.strengths[0].interpretationCode = 'energy-stable';

    expect(JSON.stringify(result)).toBe(snapshot);
  });
});

describe('单点判断防线', () => {
  test('同一切面内不得把同一条 observation 重复引用为两条结论', () => {
    const input = validInput(['left']);
    const career = input.report.domains.career.strengths[0];
    input.report.domains.career.strengths = [career, { ...career }];
    expect(() => validatePalmContract(input)).toThrow(/同一切面.*重复引用|重复引用.*observation/);
  });

  test('切面只落在一条观察上时渲染出单点判断提示，落在两条上时不提示', () => {
    const single = validatePalmContract(validInput(['left']));
    expect(single.renderedReport.domains.career.evidenceNotice)
      .toMatch(/单点判断|只落在一条/);

    const input = validInput(['left', 'right']);
    const rightCareer = input.observations.find(item => (
      item.hand === 'right' && item.subject === '事业线'
    ));
    input.report.domains.career.strengths.push(reportItem(rightCareer, 'career', 'strengths'));
    const broad = validatePalmContract(input);
    expect(broad.renderedReport.domains.career.evidenceNotice).toBeUndefined();
  });
});
