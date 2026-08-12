const fs = require('fs');
const path = require('path');
const { EVIDENCE_RULES, REDLINES, disclaimerFor } = require('../../skills/_shared/safety');

const ROOT = path.join(__dirname, '..', '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

describe('wealth-career 技能文档与架构契约', () => {
  const implementation = read('skills/wealth-career/lib/analyze.js');

  test('实现只能编排 bazi、core/ganzhi 公共入口与 qimen 标准化器', () => {
    expect(implementation).toMatch(/require\(['"]\.\.\/\.\.\/\.\.\/core\/ganzhi['"]\)/);
    expect(implementation).toMatch(/require\(['"]\.\.\/\.\.\/bazi\/lib\/analyze['"]\)/);
    expect(implementation).toMatch(/require\(['"]\.\.\/\.\.\/qimen\/lib\/chart['"]\)/);
    expect(implementation).not.toMatch(/core\/calendar|baziChart|core\/ganzhi\/domains/);
    expect(implementation).not.toMatch(/dependencies|node_modules/);
  });

  test('frontmatter 同时锁定出生输入、口语触发、奇门可选增强和反向排除', () => {
    const skill = read('skills/wealth-career/SKILL.md');
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const description = frontmatter.match(/^description:\s*(.+)$/m)[1];

    expect(frontmatter).toMatch(/^name:\s*wealth-career$/m);
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(/出生日期/);
    expect(description).toMatch(/出生时间/);
    ['事业', '财运', '工作', '赚钱', '跳槽', '创业'].forEach(word => {
      expect(description).toContain(word);
    });
    expect(description).toMatch(/奇门.*可选|optional.*奇门/i);
    expect(description).toMatch(/not for|不用于/i);
    expect(description).toMatch(/综合命理|婚恋|手相|奇门起局/);
  });

  test('正文完整锁定五条共享路由歧义消解规则', () => {
    const skill = read('skills/wealth-career/SKILL.md');

    expect(skill).toMatch(/只给出生资料.*没有.*领域问题[\s\S]*bazi/);
    expect(skill).toMatch(/出生资料.*明确.*领域[\s\S]*对应领域技能/);
    expect(skill).toMatch(/同时.*事业.*婚恋[\s\S]*bazi[\s\S]*概览/);
    expect(skill).toMatch(/显式点名[\s\S]*覆盖.*自动/);
    expect(skill).toMatch(/信息不足[\s\S]*一次性追问全部[\s\S]*停止/);
  });

  test('三份文档锁定 bazi/qimen 复用、双派独立和 errors 降级', () => {
    const docs = [
      read('skills/wealth-career/SKILL.md'),
      read('skills/wealth-career/methodology.md'),
      read('skills/wealth-career/templates/report.md'),
    ].join('\n');

    expect(docs).toMatch(/bazi\/lib\/analyze|bazi.*analyze/);
    expect(docs).toMatch(/core\/ganzhi.*tenGodStructure|tenGodStructure.*core\/ganzhi/);
    expect(docs).toMatch(/qimen\/lib\/chart|normalizeChart/);
    expect(docs).toMatch(/alternateCalculation/);
    expect(docs).toMatch(/两派|换日/);
    expect(docs).toMatch(/禁止.*跨派.*拼接|不得.*跨派.*拼接/);
    expect(docs).toMatch(/errors.*非空[\s\S]*降级|降级[\s\S]*errors.*非空/);
  });

  test('领域与综合路由都锁定脚本计算闸门，禁止模型重算四柱', () => {
    const bazi = read('skills/bazi/SKILL.md');
    const love = read('skills/love-marriage/SKILL.md');
    const wealth = read('skills/wealth-career/SKILL.md');
    const combined = [bazi, love, wealth].join('\n');

    expect(combined).toMatch(/scripts\/calculate\.js/);
    expect(combined).toMatch(/必须.*执行|必须.*调用/);
    expect(combined).toMatch(/四柱.*只能.*calculation|calculation.*四柱/);
    expect(combined).toMatch(/禁止.*(?:心算|自行重算|重新排盘)/);
    expect(combined).toMatch(/脚本.*失败.*停止|结果.*缺失.*停止/);
  });

  test('三份文档原样应用财经及 ready 奇门共享安全契约', () => {
    const docs = [
      read('skills/wealth-career/SKILL.md'),
      read('skills/wealth-career/methodology.md'),
      read('skills/wealth-career/templates/report.md'),
    ].join('\n');

    expect(docs).toMatch(/REPORT_CONTRACT\.evidenceRules/);
    expect(docs).toMatch(/REPORT_CONTRACT\.redlines/);
    expect(docs).toMatch(/disclaimerFor\(['"]财经['"]\)/);
    expect(docs).toMatch(/qimenEnhancement\.status:\s*ready/);
    expect(docs).toMatch(/qimenEnhancement\.共享安全契约\.evidenceRules/);
    expect(docs).toMatch(/qimenEnhancement\.共享安全契约\.redlines/);
    expect(docs).toMatch(/原样/);
    expect(docs).toMatch(/免责声明.*去重|去重.*免责声明/);
    disclaimerFor('财经').forEach(line => expect(docs).not.toContain(line));
    EVIDENCE_RULES.forEach(line => expect(docs).not.toContain(line));
    REDLINES.财经.forEach(line => expect(docs).not.toContain(line));
  });

  test('方法论保留双口径、组合条件和奇门七项的资料缺口', () => {
    const methodology = read('skills/wealth-career/methodology.md');

    expect(methodology).toMatch(/visibleOnly[\s\S]*allPositions/);
    expect(methodology).toMatch(/年.*月.*时.*天干/);
    expect(methodology).toMatch(/四支藏干/);
    expect(methodology).toMatch(/组间.*AND[\s\S]*组内.*OR/);
    expect(methodology).toMatch(/财富七项[\s\S]*戊[\s\S]*生门[\s\S]*六合[\s\S]*月令[\s\S]*行业[\s\S]*实干[\s\S]*干财/);
    expect(methodology).toMatch(/事业七项[\s\S]*开门[\s\S]*景门[\s\S]*玄武[\s\S]*庚\/虎[\s\S]*行业[\s\S]*符使[\s\S]*诸干/);
    expect(methodology).toMatch(/庚.*天盘[\s\S]*庚.*地盘[\s\S]*白虎.*八神[\s\S]*虎.*标记/);
    expect(methodology).toMatch(/诸干[\s\S]*起局年干[\s\S]*月干[\s\S]*时干/);
    expect(methodology).toMatch(/不得.*出生八字.*替代|出生八字.*不得.*替代/);
  });

  test('方法论与报告要求共享同宫标记摘要表及常量大小安全引用', () => {
    const methodology = read('skills/wealth-career/methodology.md');
    const report = read('skills/wealth-career/templates/report.md');

    [methodology, report].forEach(document => {
      expect(document).toMatch(/同宫标记摘要表/);
      expect(document).toMatch(/raw[\s\S]*source[\s\S]*school/);
      expect(document).toMatch(/宫位/);
      expect(document).toMatch(/名称[\s\S]*provenanceRef/);
      expect(document).toMatch(/count[\s\S]*summaryRef/);
      expect(document).toMatch(/excludedRef/);
      expect(document).toMatch(/每宫.*一次|一次.*每宫|预计算/);
      expect(document).toMatch(/summaryRef.*查|按.*summaryRef/);
      expect(document).toMatch(/不得.*复制.*标记 DTO|不.*复制.*标记 DTO/);
      expect(document).toMatch(/只.*盘面事实|不得.*现实事件|不.*现实事件/);
    });
  });

  test('代码与文档稳定提供五组收益和代价双向语义，不伪装成确定事实', () => {
    const { TEN_GOD_MEANINGS } = require('../../skills/wealth-career/lib/analyze');
    const methodology = read('skills/wealth-career/methodology.md');
    const report = read('skills/wealth-career/templates/report.md');

    expect(Object.keys(TEN_GOD_MEANINGS)).toEqual(['财', '官杀', '印', '食伤', '比劫']);
    Object.values(TEN_GOD_MEANINGS).forEach(item => {
      expect(item).toEqual(expect.objectContaining({
        十神: expect.any(Array), 收益面: expect.any(String), 代价面: expect.any(String),
        边界: expect.stringMatching(/待核验假设/),
      }));
    });
    [methodology, report].forEach(document => {
      ['印', '食伤', '官杀', '财', '比劫'].forEach(group => expect(document).toContain(group));
      expect(document).toMatch(/收益面|收益/);
      expect(document).toMatch(/代价面|代价/);
      expect(document).toMatch(/待核验假设/);
      expect(document).toMatch(/不.*确定事实|不得.*确定事实/);
    });
  });

  test('报告章节与代码冻结章节逐字一致并保留现实核验位置', () => {
    const report = read('skills/wealth-career/templates/report.md');
    const { REPORT_SECTIONS } = require('../../skills/wealth-career/lib/analyze');
    const headings = [...report.matchAll(/^##\s+(.+)$/gm)].map(match => match[1]);

    expect(headings).toEqual(REPORT_SECTIONS);
    expect(report).toMatch(/输入与口径/);
    expect(report).toMatch(/八字事业财运信号/);
    expect(report).toMatch(/职业组合与限制/);
    expect(report).toMatch(/奇门可选增强/);
    expect(report).toMatch(/现实核验与行动/);
    expect(report).toMatch(/流派与限制/);
    expect(report).toMatch(/免责声明/);
  });

  test('文档禁止把资料符号升级为确定收益、现实事件或职业宿命', () => {
    const docs = [
      read('skills/wealth-career/SKILL.md'),
      read('skills/wealth-career/methodology.md'),
      read('skills/wealth-career/templates/report.md'),
    ].join('\n');

    expect(docs).not.toMatch(/\d+\s*%/);
    expect(docs).not.toMatch(/本金必亏|必然裁员|必须跳槽|上司撒谎|合同有坑|身体必崩|声誉必崩/);
    expect(docs).not.toMatch(/命中.*(?:必创业|必适合)|(?:必创业|必适合).*命中/);
    expect(docs).not.toMatch(/个股|买入时点|卖出时点/);
    expect(docs).toMatch(/不.*旺衰|不得.*旺衰/);
    expect(docs).toMatch(/不.*收入|不得.*收入/);
  });
});
