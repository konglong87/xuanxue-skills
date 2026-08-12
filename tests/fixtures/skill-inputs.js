'use strict';

// 五技能验收输入的唯一来源：scripts/e2e-smoke.js 与 tests/interpretation-boundaries.test.js
// 共用同一份，避免两处各写一套后悄悄漂移。

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

module.exports = { qimenInput, palmInput };
