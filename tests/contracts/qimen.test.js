const fs = require('fs');
const path = require('path');
const { EVIDENCE_RULES, REDLINES, disclaimerFor } = require('../../skills/_shared/safety');

const ROOT = path.join(__dirname, '..', '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

describe('qimen 技能文档契约', () => {
  const skill = read('skills/qimen/SKILL.md');
  const methodology = read('skills/qimen/methodology.md');
  const report = read('skills/qimen/templates/report.md');

  test('frontmatter 由外部奇门局盘触发并排除起局与其他体系', () => {
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const description = frontmatter.match(/^description:\s*(.+)$/m)[1];

    expect(frontmatter).toMatch(/^name:\s*qimen$/m);
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(/奇门.*APP|APP.*奇门/);
    expect(description).toMatch(/截图|转录文本/);
    expect(description).toMatch(/奇门遁甲|局盘|九宫盘|看局/);
    expect(description).toMatch(/not for|不用于/i);
    expect(description).toMatch(/起局/);
    expect(description).toMatch(/只有出生日期|手相|风水/);
  });

  test('正文只接收外部 APP 或手工转录并强制调用标准化器', () => {
    expect(skill).toMatch(/normalizeChart/);
    expect(skill).toMatch(/safeChart/);
    expect(skill).toMatch(/只.*safeChart|仅.*safeChart/);
    expect(skill).toMatch(/外部\s*APP/);
    expect(skill).toMatch(/手工转录/);
    expect(skill).toMatch(/不得.*起局|不.*实现.*起局/);
    expect(skill).toMatch(/不得.*flyStars|禁止.*flyStars/);
    expect(skill).toMatch(/errors.*非空[\s\S]*(?:补录|追问)/);
  });

  test('正文完整锁定共享路由歧义消解规则', () => {
    expect(skill).toMatch(/同时.*事业.*婚恋[\s\S]*bazi[\s\S]*概览/);
    expect(skill).toMatch(/显式点名[\s\S]*覆盖.*自动/);
    expect(skill).toMatch(/信息不足[\s\S]*一次性追问全部[\s\S]*停止/);
  });

  test('方法论锁定九宫清单、原词保真与门破门迫并列', () => {
    expect(methodology).toMatch(/正北[\s\S]*西南[\s\S]*正东[\s\S]*东南[\s\S]*中宫[\s\S]*西北[\s\S]*正西[\s\S]*东北[\s\S]*正南/);
    expect(methodology).toMatch(/天盘干[\s\S]*地盘干[\s\S]*八门[\s\S]*九星[\s\S]*八神/);
    expect(methodology).toMatch(/缺失[\s\S]*不可读[\s\S]*不确定[\s\S]*未知/);
    expect(methodology).toMatch(/原词|raw/);
    expect(methodology).toMatch(/门破[\s\S]*门迫/);
    expect(methodology).toMatch(/不得.*等同|不.*互换|分别保留/);
    expect(methodology).toMatch(/source[\s\S]*school/);
    expect(methodology).toMatch(/audit|审计/);
    expect(methodology).toMatch(/safeChart/);
  });

  test('方法论与报告保留局盘溯源及流派字段', () => {
    expect(methodology).toMatch(/status:\s*confirmed|确认字段/);
    expect(methodology).toMatch(/source[\s\S]*school/);
    expect(methodology).toMatch(/流派/);
    expect(report).toMatch(/输入来源/);
    expect(report).toMatch(/safeChart/);
    expect(report).toMatch(/局盘完整性/);
    expect(report).toMatch(/九宫转录/);
    expect(report).toMatch(/证据与判读/);
    expect(report).toMatch(/流派与原词/);
    expect(report).toMatch(/行动边界/);
    expect(report).toMatch(/免责声明/);
    expect(report).not.toMatch(/展示 `raw \/ source \/ school`|附带.*`source`.*`school`/);
  });

  test('未知字段名只属不可信审计输入，公共错误只展示稳定安全引用', () => {
    const docs = [skill, methodology, report].join('\n');
    expect(docs).toMatch(/未知字段名[\s\S]*untrusted-audit-only/);
    expect(docs).toMatch(/(?:safe errors|安全错误)[\s\S]*(?:稳定.*(?:ref|引用)|\$unexpected)/i);
    expect(report).toMatch(/不得.*未知字段名|不.*显示.*未知字段名/);
  });

  test('三份文档只原样采用共享证据与安全契约而不手写同义版本', () => {
    const docs = [skill, methodology, report].join('\n');
    expect(docs).toMatch(/REPORT_CONTRACT\.evidenceRules/);
    expect(docs).toMatch(/REPORT_CONTRACT\.redlines/);
    expect(docs).toMatch(/disclaimerFor\(['"]奇门['"]\)/);
    disclaimerFor('奇门').forEach(line => expect(docs).not.toContain(line));
    EVIDENCE_RULES.forEach(line => expect(docs).not.toContain(line));
    REDLINES.奇门.forEach(line => expect(docs).not.toContain(line));
    expect(docs).not.toMatch(/算出\/看到的|看到的\/算出|算出\s*(?:->|→)[\s\S]{0,20}依据[\s\S]{0,20}结论/);
    expect(docs).not.toMatch(/证据不足|不足以判断|低风险|可撤销/);
  });
});
