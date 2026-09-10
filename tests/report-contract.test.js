const { toStandardReport: baziReport } = require('../skills/bazi/lib/analyze');
const { toStandardReport: loveReport, analyze: analyzeLove } = require('../skills/love-marriage/lib/analyze');
const { toStandardReport: wealthReport, analyze: analyzeWealth } = require('../skills/wealth-career/lib/analyze');
const { toStandardReport: qimenReport } = require('../skills/qimen/lib/chart');
const { toStandardReport: palmReport } = require('../skills/palm/lib/contract');
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
});
