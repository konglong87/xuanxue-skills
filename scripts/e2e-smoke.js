#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGET_YEAR = 2026;
const checks = {
  core: 0,
  baziCli: 0,
  domains: 0,
  qimen: 0,
  palm: 0,
  safety: 0,
};

function check(category, assertion) {
  assertion();
  checks[category] += 1;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Object.values(value).every(item => isDeepFrozen(item, seen));
}

function runBaziCli(input) {
  return spawnSync(process.execPath, [path.join(ROOT, 'skills/bazi/scripts/calculate.js')], {
    input,
    encoding: 'utf8',
    cwd: ROOT,
  });
}

function qimenInput() {
  const directions = ['正北', '西南', '正东', '东南', '中宫', '西北', '正西', '东北', '正南'];
  const heavenStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬'];
  const earthStems = ['癸', '壬', '辛', '庚', '己', '戊', '丁', '丙', '乙'];
  const doors = ['开', '休', '生', '伤', '杜', '景', '死', '惊', '休'];
  const stars = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽'];
  const deities = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天', '腾蛇'];
  const chart = {
    来源: { 类型: '外部APP', 名称: '离线验收盘' },
    月令: '寅',
    值符: '天蓬',
    值使: '开',
    九宫: directions.map((方向, index) => ({
      方向,
      天盘干: heavenStems[index],
      地盘干: earthStems[index],
      八门: doors[index],
      九星: stars[index],
      八神: deities[index],
      标记: [],
    })),
  };
  chart.九宫[6].标记.push({
    名称: '虎',
    raw: '原盘虎标记',
    source: '离线验收盘',
    school: '外部盘原始口径',
  });
  return chart;
}

function palmInput() {
  const palmMounts = ['金星丘', '木星丘', '土星丘', '太阳丘', '水星丘', '第一火星丘', '第二火星丘', '月丘', '火星平原'];
  const majorLines = ['生命线', '感情线', '智慧线', '事业线', '婚姻线'];
  const auxiliaryLines = ['成功线', '健康线'];
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
  const observation = (hand, id, stage, featureType, subject, visualTraits) => ({
    id: `${hand}-${id}`,
    hand,
    stage,
    featureType,
    subject,
    visualTraits,
    visibility: 'clear',
    confidence: 'high',
  });
  const observationsFor = hand => [
    observation(hand, 'shape', 'fullness', 'hand-shape', '土', ['thick-palm', 'broad-heavy-palm']),
    ...palmMounts.map((subject, index) => observation(
      hand, `mount-${index}`, 'fullness', 'mount', subject, ['full'],
    )),
    ...majorLines.map((subject, index) => observation(
      hand, `major-${index}`, 'lines', 'major-line', subject, ['clear', 'continuous'],
    )),
    ...auxiliaryLines.map((subject, index) => observation(
      hand, `aux-${index}`, 'lines', 'auxiliary-line', subject, ['clear', 'continuous'],
    )),
    observation(hand, 'complexion', 'complexion', 'overall', '整体气色', ['uniform-color']),
  ];
  const coverageFor = () => ({
    handShape: 'inspected',
    mounts: Object.fromEntries(palmMounts.map(item => [item, 'inspected'])),
    majorLines: Object.fromEntries(majorLines.map(item => [item, 'inspected'])),
    auxiliaryLines: Object.fromEntries(auxiliaryLines.map(item => [item, 'inspected'])),
    specialMarks: 'absent',
    complexion: 'inspected',
  });
  const observations = ['left', 'right'].flatMap(observationsFor);
  const find = subject => observations.find(item => item.subject === subject);
  const reportItem = (subject, interpretationCode, actionCode) => ({
    observationId: find(subject).id,
    interpretationCode,
    actionCode,
  });
  return {
    images: ['left', 'right'].map(clearImage),
    observations,
    coverageManifest: { left: coverageFor(), right: coverageFor() },
    report: {
      domains: {
        career: {
          strengths: [reportItem('事业线', 'career-structure-stable', 'career-build-on-strength')],
          risks: [{ interpretationCode: 'no-confirmed-evidence' }],
        },
        relationships: {
          strengths: [reportItem('感情线', 'relationships-expression-steady', 'relationships-communicate-clearly')],
          risks: [{ interpretationCode: 'no-confirmed-evidence' }],
        },
        health: {
          strengths: [reportItem('整体气色', 'energy-stable', 'health-monitor-energy')],
          risks: [{ interpretationCode: 'no-confirmed-evidence' }],
        },
        'wealth-social': {
          strengths: [reportItem('土', 'wealth-social-boundaries-clear', 'wealth-social-use-boundaries')],
          risks: [{ interpretationCode: 'no-confirmed-evidence' }],
        },
      },
      healthText: '健康内容只作体质倾向与精力状态提示，不构成医疗诊断；如有身体不适或疑虑，请及时就医。',
      disclaimer: '本报告属于中国传统文化中的手相娱乐性观察，不把象征关系当作确定事实，不保证医疗、寿命、职业、关系或收益结果。现实决定应结合真实经历与相应专业意见。',
      handComparison: {
        pairs: [{
          leftObservationId: 'left-shape',
          rightObservationId: 'right-shape',
          comparisonCode: 'role-balance',
        }],
      },
    },
  };
}

function verifyCore() {
  const core = require('../core');
  check('core', () => assert.deepEqual(Object.keys(core), ['ganzhi', 'calendar', 'direction', 'naqi']));
  check('core', () => assert.equal(typeof core.ganzhi.tenGodStructure, 'function'));
  check('core', () => assert.equal(typeof core.ganzhi.marriageSignals, 'function'));
  check('core', () => assert.equal(typeof core.calendar.baziChart, 'function'));
  check('core', () => assert.equal(typeof core.direction.declination, 'function'));
  check('core', () => assert.equal(typeof core.naqi.zoneOf, 'function'));
}

function verifyBaziCli() {
  const fixtures = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/celebrity-bazi.json'), 'utf8'));
  const person = fixtures.find(item => item.name === 'Steve Jobs');
  assert.ok(person, '名人 fixture 缺少 Steve Jobs');
  const input = {
    birthDate: person.birthDate,
    birthTime: person.birthTime,
    longitude: person.longitude,
    utcOffsetMinutes: person.utcOffsetMinutes,
    gender: 'male',
    targetYear: TARGET_YEAR,
  };
  const ready = runBaziCli(JSON.stringify(input));
  check('baziCli', () => assert.equal(ready.status, 0));
  const result = JSON.parse(ready.stdout);
  check('baziCli', () => assert.equal(result.status, 'ready'));
  check('baziCli', () => assert.deepEqual({
    年: result.calculation.四柱结果.年,
    月: result.calculation.四柱结果.月,
    日: result.calculation.四柱结果.日,
    时: result.calculation.四柱结果.时,
  }, person.expectedPillars));

  const needsInput = runBaziCli(JSON.stringify({ birthDate: person.birthDate, targetYear: TARGET_YEAR }));
  check('baziCli', () => assert.equal(needsInput.status, 0));
  check('baziCli', () => assert.equal(JSON.parse(needsInput.stdout).status, 'needs_input'));

  const invalid = runBaziCli('{invalid json');
  check('baziCli', () => assert.notEqual(invalid.status, 0));
  check('baziCli', () => assert.deepEqual(Object.keys(JSON.parse(invalid.stderr)), ['status', 'error']));
}

function verifyDomains() {
  const { analyze: analyzeLove } = require('../skills/love-marriage/lib/analyze');
  const { analyze: analyzeWealth } = require('../skills/wealth-career/lib/analyze');
  const birth = {
    birthDate: '1955-02-24',
    birthTime: '19:15',
    longitude: -122.4194,
    utcOffsetMinutes: -480,
    gender: 'male',
    targetYear: 2026,
  };
  const boundaryBirth = {
    birthDate: '2000-01-01',
    birthTime: '23:30',
    longitude: 120,
    utcOffsetMinutes: 480,
    gender: 'male',
    targetYear: 2026,
    options: { dayBoundary: '23:00', useTrueSolar: true },
  };
  const chart = qimenInput();
  const invalidChart = qimenInput();
  invalidChart.九宫.pop();

  [analyzeLove, analyzeWealth].forEach(analyze => {
    const original = clone(birth);
    const plain = analyze(birth);
    check('domains', () => assert.equal(plain.status, 'ready'));
    check('domains', () => assert.equal(plain.qimenEnhancement.status, 'not_provided'));
    check('domains', () => assert.deepEqual(birth, original));

    const alternate = analyze(boundaryBirth);
    check('domains', () => assert.ok(alternate.bazi.alternateCalculation));

    const enhanced = analyze({ ...birth, qimen: chart });
    check('domains', () => assert.equal(enhanced.qimenEnhancement.status, 'ready'));

    const degraded = analyze({ ...birth, qimen: invalidChart });
    check('domains', () => assert.equal(degraded.qimenEnhancement.status, 'degraded'));
  });
}

function verifyQimen() {
  const { normalizeChart } = require('../skills/qimen/lib/chart');
  const valid = normalizeChart(qimenInput());
  check('qimen', () => assert.equal(valid.errors.length, 0));
  check('qimen', () => assert.equal(valid.chart.九宫.length, 9));

  const incomplete = qimenInput();
  incomplete.月令 = { status: 'uncertain', raw: '寅或卯' };
  incomplete.九宫.pop();
  const rejected = normalizeChart(incomplete);
  check('qimen', () => assert.ok(rejected.errors.some(error => error.code === 'palace_count')));
  check('qimen', () => assert.ok(rejected.errors.some(error => error.code === 'uncertain_value')));

  const selfStarted = qimenInput();
  selfStarted.来源 = { 类型: '自行起局', 名称: '未验证推算' };
  const refused = normalizeChart(selfStarted);
  check('qimen', () => assert.ok(refused.errors.some(error => error.path === '来源.类型')));
}

function verifyPalm() {
  const contract = require('../skills/palm/lib/contract');
  const missing = contract.validatePalmContract({ images: [] });
  check('palm', () => assert.equal(missing.status, 'needs_input'));
  check('palm', () => assert.equal(missing.reportValidated, false));

  const input = palmInput();
  const before = clone(input);
  const result = contract.validatePalmContract(input);
  check('palm', () => assert.equal(result.status, 'complete'));
  check('palm', () => assert.equal(result.reportValidated, true));
  check('palm', () => assert.equal(result.renderedReport.observations.length, input.observations.length));
  check('palm', () => assert.ok(result.renderedReport.handComparison.pairs.length > 0));
  check('palm', () => assert.ok(result.renderedReport.observations.every(item => (
    !Object.prototype.hasOwnProperty.call(item, 'source')
    && !Object.prototype.hasOwnProperty.call(item, 'school')
  ))));
  check('palm', () => assert.equal(
    result.renderedReport.healthText,
    '健康内容只作体质倾向与精力状态提示，不构成医疗诊断；如有身体不适或疑虑，请及时就医。',
  ));
  check('palm', () => assert.equal(
    result.renderedReport.disclaimer,
    '本报告属于中国传统文化中的手相娱乐性观察，不把象征关系当作确定事实，不保证医疗、寿命、职业、关系或收益结果。现实决定应结合真实经历与相应专业意见。',
  ));
  check('palm', () => assert.doesNotMatch(
    JSON.stringify(result.renderedReport),
    /"(?:raw|source|school)":/,
  ));
  check('palm', () => assert.deepEqual(input, before));
  check('palm', () => assert.ok(isDeepFrozen(result)));
}

function verifySafety() {
  const safety = require('../skills/_shared/safety');
  const love = require('../skills/love-marriage/lib/analyze');
  const wealth = require('../skills/wealth-career/lib/analyze');
  const qimen = require('../skills/qimen/lib/chart');

  check('safety', () => assert.ok(isDeepFrozen(safety.EVIDENCE_RULES)));
  check('safety', () => assert.ok(isDeepFrozen(safety.REDLINES)));
  check('safety', () => assert.ok(isDeepFrozen(love.REPORT_CONTRACT)));
  check('safety', () => assert.ok(isDeepFrozen(wealth.REPORT_CONTRACT)));
  check('safety', () => assert.ok(isDeepFrozen(qimen.REPORT_CONTRACT)));
  check('safety', () => assert.notStrictEqual(love.REPORT_CONTRACT.redlines, safety.REDLINES.婚恋));
  check('safety', () => assert.notStrictEqual(wealth.REPORT_CONTRACT.redlines, safety.REDLINES.财经));
}

function main() {
  verifyCore();
  verifyBaziCli();
  verifyDomains();
  verifyQimen();
  verifyPalm();
  verifySafety();
  const total = Object.values(checks).reduce((sum, count) => sum + count, 0);
  process.stdout.write(`${JSON.stringify({ status: 'ok', targetYear: TARGET_YEAR, total, checks })}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    status: 'error',
    error: error instanceof Error ? error.message : String(error),
  })}\n`);
  process.exitCode = 1;
}
