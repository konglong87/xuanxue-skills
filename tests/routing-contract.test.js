const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const json = relative => JSON.parse(read(relative));

const AVAILABLE_SKILLS = Object.freeze([
  'bazi',
  'palm',
  'qimen',
  'love-marriage',
  'wealth-career',
]);
const FUTURE_SKILLS = Object.freeze(['fengshui-naqi', 'divination']);
const RETIRED_NAMES = Object.freeze([
  'mingli',
  'fengshui-yangzhai',
  'yijing-divination',
  'palm-reading',
]);

function frontmatter(relative) {
  const source = read(relative);
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${relative} 缺少 frontmatter`);
  const field = name => {
    const value = match[1].match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return value ? value[1].trim() : null;
  };
  return { name: field('name'), description: field('description'), source };
}

const skills = Object.fromEntries(AVAILABLE_SKILLS.map(name => [
  name,
  frontmatter(`skills/${name}/SKILL.md`),
]));

describe('当前发布技能目录与发现契约', () => {
  test.each(AVAILABLE_SKILLS)('%s 目录名、frontmatter name 完全一致', name => {
    expect(skills[name].name).toBe(name);
  });

  test.each([
    ['bazi', /出生日期.*出生时间|出生时间.*出生日期/, /看八字|算命/, /not for|不用于/i],
    ['palm', /手掌|掌心|掌纹.*照片|图片/, /看看手相|看一下手相/, /not for|不用于/i],
    ['qimen', /APP.*局盘|局盘截图|转录文本/, /奇门遁甲|看局/, /not for|不用于/i],
    ['love-marriage', /出生资料|出生日期/, /婚恋|姻缘|正缘|复合/, /not for|不用于/i],
    ['wealth-career', /出生日期.*出生时间/, /事业|财运|跳槽|创业/, /not for|不用于/i],
  ])('%s description 同时说明输入、口语触发和反向排除', (name, input, trigger, exclusion) => {
    const { description } = skills[name];
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(input);
    expect(description).toMatch(trigger);
    expect(description).toMatch(exclusion);
  });

  test.each(['bazi', 'palm', 'qimen'])('%s 不把 future 风水或占卜写成可调用技能', name => {
    const source = skills[name].source;
    expect(source).not.toMatch(/转风水技能|转占卜技能/);
    expect(source).toMatch(/住宅风水.*(?:future|未交付|当前不支持)/);
    expect(source).toMatch(/占卜.*(?:future|未交付|当前不支持)/);
    expect(source).toMatch(/不得调用/);
  });
});

describe('11 类自然语言路由逐文件消歧', () => {
  test('1 出生资料加综合命理由 bazi 自己声明', () => {
    expect(skills.bazi.source).toMatch(/本技能用于综合命理/);
    expect(skills.bazi.source).toMatch(/出生/);
  });

  test('2 出生资料加明确婚恋由 love-marriage 自己声明', () => {
    expect(skills['love-marriage'].source).toMatch(/明确婚恋问题才进入本技能/);
    expect(skills['love-marriage'].source).toMatch(/出生资料/);
  });

  test('3 出生资料加事业财运由 wealth-career 自己声明', () => {
    expect(skills['wealth-career'].source).toMatch(/明确事业财运问题才进入本技能/);
    expect(skills['wealth-career'].source).toMatch(/出生资料/);
  });

  test.each(['love-marriage', 'wealth-career'])('4 %s 自己声明双领域回 bazi 概览', name => {
    expect(skills[name].source).toMatch(/同时.*事业.*婚恋.*`bazi`.*概览/);
  });

  test('5 palm 自己声明手掌图片和纯图输入', () => {
    expect(skills.palm.description).toMatch(/手掌|掌心|掌纹/);
    expect(skills.palm.description).toMatch(/image-only|只上传图片/);
  });

  test('6 qimen 自己声明仅接外部已起局盘', () => {
    expect(skills.qimen.source).toMatch(/只接收外部 APP 已起好的局盘/);
    expect(skills.qimen.source).toMatch(/不自行起局/);
  });

  test.each(['love-marriage', 'wealth-career'])('7 %s 自己声明奇门仅为可选增强', name => {
    expect(skills[name].source).toMatch(/奇门.*可选增强|可选外部增强/);
    expect(skills[name].source).toMatch(/不是.*前置条件|not_provided|未提供.*正常/);
  });

  test('8 qimen 自己声明只有出生资料回 bazi', () => {
    expect(skills.qimen.source).toMatch(/只有出生资料.*`bazi`/);
  });

  test('9 qimen 自己声明拒绝自行起局', () => {
    expect(skills.qimen.source).toMatch(/要求本技能起局.*当前不实现起局/);
  });

  test.each(['qimen', 'love-marriage', 'wealth-career'])('10 %s 自己声明点名不覆盖输入和安全', name => {
    expect(skills[name].source).toMatch(/显式点名.*覆盖自动|显式点名技能.*覆盖自动/);
    expect(skills[name].source).toMatch(/不覆盖.*输入.*安全|仍须遵守.*边界/);
  });

  test.each(['love-marriage', 'wealth-career'])('11 %s 自己声明信息不足一次问全后停止', name => {
    expect(skills[name].source).toMatch(/信息不足.*一次性追问全部.*停止/);
  });
});

describe('README、路线图与发布元数据', () => {
  const packageJson = json('package.json');
  const plugin = json('plugin.json');
  const marketplace = json('.claude-plugin/marketplace.json');
  const readme = read('README.md');
  const taxonomy = read('docs/SKILL-TAXONOMY.md');
  const claude = read('CLAUDE.md');
  const roadmap = read('docs/ROADMAP.md');
  const publishedSurface = [
    readme,
    claude,
    JSON.stringify(plugin),
    JSON.stringify(marketplace),
  ].join('\n');

  test('README 第一屏列出五个当前技能、输入和五条用户入口', () => {
    const firstScreen = readme.split('\n').slice(0, 90).join('\n');
    AVAILABLE_SKILLS.forEach(name => expect(firstScreen).toContain(`\`${name}\``));
    expect(firstScreen).toMatch(/出生.*综合/);
    expect(firstScreen).toMatch(/婚恋|情感/);
    expect(firstScreen).toMatch(/事业.*财运|财运.*事业/);
    expect(firstScreen).toMatch(/双手.*照片/);
    expect(firstScreen).toMatch(/外部.*奇门.*盘|奇门.*APP.*局盘/);
  });

  test('README 给出 marketplace 安装和 clone 后真实加载命令', () => {
    expect(readme).toContain('claude plugin marketplace add konglong87/xuanxue-skills');
    expect(readme).toContain('claude plugin install xuanxue-skills@xuanxue-skills');
    expect(readme).toMatch(/git clone[\s\S]*claude --plugin-dir \/absolute\/path/);
    expect(readme).not.toMatch(/直接克隆仓库，让宿主从本地路径加载/);
  });

  test('package 暴露跨 Agent 的 npx 安装器入口', () => {
    expect(packageJson.bin).toEqual({
      'xuanxue-skills': 'scripts/agent-install/cli.js',
    });
    expect(fs.existsSync(path.join(ROOT, packageJson.bin['xuanxue-skills']))).toBe(true);
  });

  test('计算型技能声明可移植绝对路径且不依赖 shell 工作目录', () => {
    expect(skills.bazi.source).toMatch(/绝对.*技能目录|技能目录.*绝对/);
    expect(skills.bazi.source).toContain('${CLAUDE_PLUGIN_ROOT}');
    expect(skills.bazi.source).toMatch(/不得依赖.*(?:当前工作目录|shell 工作目录)/);

    ['love-marriage', 'wealth-career'].forEach(name => {
      expect(skills[name].source).toMatch(/已安装.*SKILL\.md.*真实路径|SKILL\.md.*真实路径/);
      expect(skills[name].source).toMatch(/不得依赖.*(?:当前工作目录|shell 工作目录)/);
    });
  });

  test('README 如实声明手相观察边界和奇门不起局', () => {
    expect(readme).toMatch(/宿主.*多模态.*观察/);
    expect(readme).toMatch(/代码.*验证.*结构/);
    expect(readme).not.toMatch(/代码.*(?:识别|看图).*手相/);
    expect(readme).toMatch(/奇门.*不.*起局|不.*奇门.*起局/);
  });

  test.each([1, 2, 3])('ROADMAP Phase %s 已按真实 core 完成状态校准', phase => {
    const section = roadmap.match(new RegExp(
      `### Phase ${phase}(?![\\d.])[^\\n]*✅ 已完成[\\s\\S]*?(?=### Phase )`,
    ));
    expect(section).not.toBeNull();
    expect(section[0]).not.toContain('- [ ]');
  });

  test('ROADMAP 路由契约数量校准为 11 类', () => {
    expect(roadmap).toMatch(/routing-contract\.test\.js` 锁定 11 类/);
    expect(roadmap).not.toMatch(/routing-contract\.test\.js` 锁定 10 类/);
  });

  test('架构文档逐项写清当前真实依赖且不再称领域以奇门为单一底座', () => {
    const docs = [readme, claude, taxonomy].join('\n');
    expect(docs).toMatch(/bazi.*(?:必需|依赖).*qimen.*(?:可选|增强)/i);
    expect(docs).toMatch(/palm.*不依赖.*core/i);
    expect(docs).toMatch(/qimen.*ganzhi.*direction/i);
    expect(docs).toMatch(/love-marriage.*bazi.*ganzhi.*qimen.*可选/i);
    expect(docs).toMatch(/wealth-career.*bazi.*ganzhi.*qimen.*可选/i);
    expect(docs).toMatch(/naqi.*依赖.*direction/i);
    expect(docs).not.toMatch(/以奇门为单一底座|奇门单一底座/);
  });

  test('taxonomy 的领域示例明确八字必需、外部奇门仅可选', () => {
    const section = taxonomy.match(/\*\*⑥⑦ 与 ③ 的触发边界\*\*[\s\S]*?(?=### 解法层)/)[0];
    expect(section).toMatch(/⑥[\s\S]*八字.*必需[\s\S]*奇门.*可选/);
    expect(section).not.toMatch(/内部取用八字与奇门/);
  });

  test('ROADMAP 方位层不再声明供手相使用', () => {
    const section = roadmap.match(/### Phase 3[\s\S]*?(?=### Phase 4)/)[0];
    expect(section).not.toMatch(/手相/);
    expect(section).toMatch(/风水/);
  });

  test('ROADMAP 收尾项引用 CLAUDE 逐项依赖表而非泛化 skills 通配依赖', () => {
    const section = roadmap.match(/## 收尾 todo[\s\S]*$/)[0];
    expect(section).toMatch(/CLAUDE\.md[\s\S]{0,160}逐项依赖表/);
    expect(section).not.toContain('core/ganzhi <- core/calendar <- skills/*/lib');
  });

  test('旧目录名不再出现在当前发布面', () => {
    RETIRED_NAMES.forEach(name => expect(publishedSurface).not.toContain(name));
  });

  test('taxonomy 保留七技能设计但显著区分 current 5 与 future 2', () => {
    expect(taxonomy).toMatch(/当前已交付[\s\S]*5/);
    AVAILABLE_SKILLS.forEach(name => expect(taxonomy).toMatch(new RegExp(`${name}[\\s\\S]{0,100}(?:已交付|current)|(?:已交付|current)[\\s\\S]{0,100}${name}`)));
    FUTURE_SKILLS.forEach(name => expect(taxonomy).toMatch(new RegExp(`${name}[\\s\\S]{0,100}(?:future|未交付)|(?:future|未交付)[\\s\\S]{0,100}${name}`)));
    expect(taxonomy).toMatch(/miexiang\.md[\s\S]{0,100}(?:future|未交付)/);
    expect(taxonomy).toMatch(/core\/wanwu[\s\S]{0,100}(?:future|未交付)/);
  });

  test('manifest 与 marketplace 版本一致且仅陈述五个能力', () => {
    expect(plugin.version).toBe(packageJson.version);
    expect(marketplace.description).toEqual(expect.any(String));
    expect(marketplace.description.length).toBeGreaterThan(10);
    expect(marketplace.plugins).toHaveLength(1);
    expect(marketplace.plugins[0].version).toBe(packageJson.version);
    const metadata = JSON.stringify({ plugin, marketplace });
    AVAILABLE_SKILLS.forEach(name => expect(metadata).toContain(name));
    FUTURE_SKILLS.forEach(name => expect(metadata).not.toContain(name));
  });

  test('package 与 manifest 不宣称不存在的 core/gua 或 future 能力可用', () => {
    const metadata = JSON.stringify({ packageJson, plugin, marketplace });
    expect(metadata).not.toMatch(/core\/gua|卦象计算内核|起卦解卦|住宅风水/);
  });
});
