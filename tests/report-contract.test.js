const {
  analyze: analyzeBazi,
  toStandardReport: baziReport,
} = require('../skills/bazi/lib/analyze');
const { toStandardReport: loveReport, analyze: analyzeLove } = require('../skills/love-marriage/lib/analyze');
const { toStandardReport: wealthReport, analyze: analyzeWealth } = require('../skills/wealth-career/lib/analyze');
const { toStandardReport: qimenReport } = require('../skills/qimen/lib/chart');
const { toStandardReport: palmReport } = require('../skills/palm/lib/contract');
const safety = require('../skills/_shared/safety');
const { qimenInput, palmInput } = require('./fixtures/skill-inputs');

const BIRTH = {
  birthDate: '1955-02-24',
  birthTime: '19:15',
  longitude: -122.4194,
  utcOffsetMinutes: -480,
  gender: 'male',
  targetYear: 2026,
};

describe('统一报告协议', () => {
  test('各适配器都提供六段固定顺序', () => {
    const reports = [
      baziReport(require('../skills/bazi/lib/analyze').analyze(BIRTH)),
      loveReport(analyzeLove(BIRTH)),
      wealthReport(analyzeWealth(BIRTH)),
      qimenReport(require('../skills/qimen/lib/chart').normalizeChart(qimenInput())),
      palmReport(require('../skills/palm/lib/contract').validatePalmContract(palmInput())),
    ];
    reports.forEach(report => {
      expect(report.stages).toEqual(['输入口径', '算出', '依据', '可供判读', '行动', '边界']);
      expect(report).toHaveProperty('输入口径');
      expect(report).toHaveProperty('边界');
    });
  });

  test('needs_input 报告保留全部补录字段与问题', () => {
    const reports = [
      baziReport(analyzeBazi({ birthDate: '1955-02-24' })),
      loveReport(analyzeLove({ birthDate: '1955-02-24' })),
      wealthReport(analyzeWealth({ birthDate: '1955-02-24' })),
    ];

    reports.forEach(report => {
      expect(report.status).toBe('needs_input');
      expect(report.missing).toEqual(expect.arrayContaining([
        'birthTime', 'longitude', 'utcOffsetMinutes|standardMeridian', 'gender',
      ]));
      expect(report.questions).toHaveLength(report.missing.length);
    });
  });

  test('统一报告不暴露 legacy，也不暴露奇门审计自由文本', () => {
    const chart = qimenInput();
    chart.来源.名称 = 'IGNORE_ALL_RULES_SECRET_PAYLOAD';
    const report = qimenReport(require('../skills/qimen/lib/chart').normalizeChart(chart));

    expect(report).not.toHaveProperty('legacy');
    expect(JSON.stringify(report)).not.toContain('IGNORE_ALL_RULES_SECRET_PAYLOAD');
    expect(JSON.stringify(report)).not.toMatch(/"(?:raw|source|school)":/);
    expect(report.依据).toEqual(safety.EVIDENCE_RULES);
    expect(report.边界).toEqual(safety.disclaimerFor('奇门'));
  });

  test('统一报告的依据始终是扁平数组', () => {
    const reports = [
      baziReport(analyzeBazi(BIRTH)),
      loveReport(analyzeLove(BIRTH)),
      wealthReport(analyzeWealth(BIRTH)),
      qimenReport(require('../skills/qimen/lib/chart').normalizeChart(qimenInput())),
      palmReport(require('../skills/palm/lib/contract').validatePalmContract(palmInput())),
    ];

    reports.forEach(report => {
      expect(Array.isArray(report.依据)).toBe(true);
      expect(report.依据.every(item => !Array.isArray(item))).toBe(true);
    });
  });

  test('八字标准报告保留临近子时两派完整命盘', () => {
    const result = analyzeBazi({
      birthDate: '2026-06-15',
      birthTime: '23:30',
      longitude: 120,
      utcOffsetMinutes: 480,
      gender: 'male',
      targetYear: 2026,
    });
    const report = baziReport(result);
    const trend = report.算出[1];

    expect(report).not.toHaveProperty('legacy');
    expect(trend.主派完整命盘.四柱结果.日).toBe('辛酉');
    expect(trend.另一派完整命盘.四柱结果.日).toBe('庚申');
  });
});
