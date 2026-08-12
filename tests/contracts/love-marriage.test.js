const fs = require('fs');
const path = require('path');
const { EVIDENCE_RULES, REDLINES, disclaimerFor } = require('../../skills/_shared/safety');

const ROOT = path.join(__dirname, '..', '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

describe('love-marriage 技能文档契约', () => {
  const skill = read('skills/love-marriage/SKILL.md');
  const methodology = read('skills/love-marriage/methodology.md');
  const report = read('skills/love-marriage/templates/report.md');

  test('frontmatter 锁定出生资料加婚恋问题、口语触发和反向排除', () => {
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const description = frontmatter.match(/^description:\s*(.+)$/m)[1];

    expect(frontmatter).toMatch(/^name:\s*love-marriage$/m);
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(/出生资料|出生日期/);
    ['姻缘', '什么时候结婚', '正缘', '感情', '复合', '配偶', '桃花'].forEach(word => {
      expect(description).toContain(word);
    });
    expect(description).toMatch(/奇门.*可选|optional.*奇门/i);
    expect(description).toMatch(/not for|不用于/i);
    expect(description).toMatch(/综合命理|事业财运|手相/);
  });

  test('正文完整锁定五条共享路由歧义消解规则', () => {
    expect(skill).toMatch(/只给出生资料.*没有.*领域问题[\s\S]*bazi/);
    expect(skill).toMatch(/出生资料.*明确.*领域[\s\S]*对应领域技能/);
    expect(skill).toMatch(/同时.*事业.*婚恋[\s\S]*bazi[\s\S]*概览/);
    expect(skill).toMatch(/显式点名[\s\S]*覆盖.*自动/);
    expect(skill).toMatch(/信息不足[\s\S]*一次性追问全部[\s\S]*停止/);
  });

  test('方法论要求调用 bazi 与 domains，两派独立且奇门错误时降级', () => {
    expect(skill).toMatch(/bazi\/lib\/analyze|bazi.*analyze/);
    expect(skill).toMatch(/domains\.js|marriageSignals/);
    expect(methodology).toMatch(/alternateCalculation/);
    expect(methodology).toMatch(/两派|换日/);
    expect(methodology).toMatch(/errors.*非空[\s\S]*降级|降级[\s\S]*errors.*非空/);
    expect(methodology).toMatch(/不猜.*寄宫|寄宫.*不猜/);
  });

  test('传统神煞披露开源交叉验证和仓内无一手页码边界', () => {
    const docs = [skill, methodology, report].join('\n');
    expect(docs).toMatch(/cantian-ai\/bazi-mcp/);
    expect(docs).toMatch(/d5af26b0/);
    expect(docs).toMatch(/传统.*口径/);
    expect(docs).toMatch(/无一手古籍页码/);
    expect(docs).toMatch(/不.*R3.*R5.*裁决|不.*裁决/);
  });

  test('报告章节与代码冻结章节逐字一致', () => {
    const { REPORT_SECTIONS } = require('../../skills/love-marriage/lib/analyze');
    const headings = [...report.matchAll(/^##\s+(.+)$/gm)].map(match => match[1]);
    expect(headings).toEqual(REPORT_SECTIONS);
  });

  test('三份文档仅引用共享安全契约，不维护同义副本或危险处方', () => {
    const docs = [skill, methodology, report].join('\n');
    expect(docs).toMatch(/REPORT_CONTRACT\.evidenceRules/);
    expect(docs).toMatch(/REPORT_CONTRACT\.redlines/);
    expect(docs).toMatch(/disclaimerFor\(['"]婚恋['"]\)/);
    disclaimerFor('婚恋').forEach(line => expect(docs).not.toContain(line));
    EVIDENCE_RULES.forEach(line => expect(docs).not.toContain(line));
    REDLINES.婚恋.forEach(line => expect(docs).not.toContain(line));
    expect(docs).not.toMatch(/(?:10|60|90)\s*%/);
    expect(docs).not.toMatch(/镇压协议|强制合并|搬迁至.*宫/);
    expect(skill).not.toMatch(/安全文本只从[^。\n]*REPORT_CONTRACT[^。\n]*读取/);
  });

  test('报告保留八字、奇门、流派、现实核验和免责声明位置', () => {
    expect(report).toMatch(/输入与口径/);
    expect(report).toMatch(/八字婚恋信号/);
    expect(report).toMatch(/奇门可选增强/);
    expect(report).toMatch(/现实核验与行动/);
    expect(report).toMatch(/流派与限制/);
    expect(report).toMatch(/免责声明/);
  });

  test.each([
    ['SKILL.md', skill],
    ['methodology.md', methodology],
    ['templates/report.md', report],
  ])('%s 锁定换日两派各自的奇门干合渲染', (name, document) => {
    expect(document).toMatch(/alternateCalculation/);
    expect(document).toMatch(/qimenEnhancement\.status:\s*ready/);
    expect(document).toMatch(/主派/);
    expect(document).toMatch(/另一派/);
    expect(document).toMatch(/dayBoundary/);
    expect(document).toMatch(/日干/);
    expect(document).toMatch(/`干合宫位`/);
    expect(document).toMatch(/`另一派干合宫位`/);
    expect(document).toMatch(/禁止.*跨派.*拼接|不得.*跨派.*拼接/);
    expect(document).toMatch(/不得遗漏|禁止遗漏|不能遗漏/);
  });

  test.each([
    ['SKILL.md', skill],
    ['methodology.md', methodology],
    ['templates/report.md', report],
  ])('%s 在奇门 ready 时原样应用奇门共享安全契约', (name, document) => {
    expect(document).toMatch(/qimenEnhancement\.status:\s*ready/);
    expect(document).toMatch(/qimenEnhancement\.共享安全契约\.evidenceRules/);
    expect(document).toMatch(/qimenEnhancement\.共享安全契约\.redlines/);
    expect(document).toMatch(/原样/);
    expect(document).toMatch(/免责声明.*去重|去重.*免责声明/);
    expect(document).toMatch(/不能只.*REPORT_CONTRACT|不得只.*REPORT_CONTRACT/);
  });
});
