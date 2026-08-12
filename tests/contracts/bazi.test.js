const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const read = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

describe('bazi 技能契约', () => {
  const skill = read('skills/bazi/SKILL.md');
  const methodology = read('skills/bazi/methodology.md');
  const report = read('skills/bazi/templates/report.md');

  test('frontmatter 只以具体使用场景触发并包含口语与反向排除', () => {
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const description = frontmatter.match(/^description:\s*(.+)$/m)[1];

    expect(frontmatter).toMatch(/^name:\s*bazi$/m);
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(/出生日期|出生时间/);
    expect(description).toMatch(/生辰八字|看八字|算命/);
    expect(description).toMatch(/not for|不用于/i);
    expect(description).toMatch(/手相|风水|占卜/);
    expect(description).toMatch(/婚恋|事业|财运/);
  });

  test('正文强制调用确定性脚本并禁止心算四柱', () => {
    expect(skill).toMatch(/scripts\/calculate\.js/);
    expect(skill).toMatch(/必须.*调用|MUST.*run/i);
    expect(skill).toMatch(/禁止.*心算.*四柱|不得.*心算.*四柱/);
    expect(skill).toMatch(/缺失.*追问|信息不足.*询问/);
    expect(skill).toMatch(/targetYear.*可选|目标年份.*可选/);
    expect(skill).not.toMatch(/不得猜测[^。\n]*目标年份/);
    expect(skill).toMatch(/两次.*core|core.*复算.*另一派/i);
  });

  test('方法论与模板要求算出到依据再到结论并呈现流派分歧', () => {
    expect(methodology).toMatch(/算出[\s\S]*依据[\s\S]*结论/);
    expect(methodology).toMatch(/旺衰[\s\S]*格局[\s\S]*喜用神/);
    expect(methodology).toMatch(/并列/);
    expect(report).toMatch(/综合/);
    expect(report).toMatch(/性格与资源/);
    expect(report).toMatch(/事业财运概览/);
    expect(report).toMatch(/婚恋概览/);
    expect(report).toMatch(/阶段趋势/);
    expect(report).toMatch(/流派差异/);
    expect(report).toMatch(/文化.*娱乐/);
    expect(report).toMatch(/医疗/);
    expect(report).toMatch(/投资/);
  });

  test('记录三组外部基线命令在登录前受阻，不伪造模型结果', () => {
    const cases = read('docs/TEST-CASES.md');
    expect(cases).toMatch(/外部技能基线/);
    expect(cases).toMatch(/完整出生资料/);
    expect(cases).toMatch(/缺少经度与时区/);
    expect(cases).toMatch(/23:00.*流派分歧/);
    expect(cases).toMatch(/Not logged in/);
    expect(cases).toMatch(/未进入模型调用|没有生成模型结果/);
  });
});

describe('palm 技能契约', () => {
  const skill = read('skills/palm/SKILL.md');
  const methodology = read('skills/palm/methodology.md');
  const report = read('skills/palm/templates/report.md');
  const fixtureNotes = read('tests/fixtures/palm/README.md');

  test('frontmatter 由手掌图片与口语请求触发并反向排除其他体系', () => {
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const description = frontmatter.match(/^description:\s*(.+)$/m)[1];

    expect(frontmatter).toMatch(/^name:\s*palm$/m);
    expect(description).toMatch(/^Use when/);
    expect(description).toMatch(/手掌|掌心|手相|掌纹/);
    expect(description).toMatch(/照片|图片|看看|看一下/);
    expect(description).toMatch(/只上传|image-only|无需文字/i);
    expect(description).toMatch(/not for|不用于/i);
    expect(description).toMatch(/出生|八字|风水|卦盘/);
  });

  test('正文要求宿主先做视觉观察，再送入契约校验，且不得由代码声称看图', () => {
    expect(skill).toMatch(/宿主.*多模态|多模态.*宿主/);
    expect(skill).toMatch(/validatePalmContract/);
    expect(skill).not.toMatch(/调用 `validateCoverageManifest`|调用 `validateObservations`|调用 `validateReport`/);
    expect(skill).toMatch(/不得.*代码.*看图|代码.*不能.*看图/);
    expect(skill).toMatch(/只.*一只手[\s\S]*一半/);
    expect(skill).toMatch(/不可见[\s\S]*不得.*补造|不得.*补造[\s\S]*不可见/);
    expect(skill).toMatch(/军道[\s\S]*左手|左手[\s\S]*军道/);
    expect(skill).toMatch(/臣道[\s\S]*右手|右手[\s\S]*臣道/);
    expect(skill).not.toMatch(/男左女右/);
  });

  test('方法论和模板锁定三看顺序、完整观察清单与证据链', () => {
    expect(methodology).toMatch(/饱满度[\s\S]*纹路[\s\S]*气色/);
    expect(methodology).toMatch(/五行手型/);
    expect(methodology).toMatch(/掌丘/);
    expect(methodology).toMatch(/五条主脉|生命线[\s\S]*感情线[\s\S]*智慧线[\s\S]*事业线[\s\S]*婚姻线/);
    expect(methodology).toMatch(/特殊纹路/);
    expect(methodology).toMatch(/七种[\s\S]*两项[\s\S]*(?:缺失|未确认|未提供)/);
    expect(methodology).toMatch(/成功线[\s\S]*健康线/);
    expect(report).toMatch(/事业[\s\S]*感情[\s\S]*健康[\s\S]*财与人际/);
    expect(report).toMatch(/天赋|优势/);
    expect(report).toMatch(/短板|风险/);
    expect(report).toMatch(/看到的[\s\S]*依据[\s\S]*结论/);
    expect(methodology).toMatch(/九宫星丘|掌中风水/);
    expect(methodology).toMatch(/粗\/细|深\/浅/);
    expect(methodology).toMatch(/寿命|疾病|真爱|财富必然|超自然/);
    expect(methodology).toMatch(/混合形态|双形/);
  });

  test('公开图片候选记录许可证、作者、隐私风险与真实外部阻塞', () => {
    expect(fixtureNotes).toMatch(/Open_Palm_of_the_Left_Hand,_Fingers\.jpg/);
    expect(fixtureNotes).toMatch(/Eyefive45/);
    expect(fixtureNotes).toMatch(/25\.12\.2018_Vierfingerfurche,_beidseitig\.JPG/);
    expect(fixtureNotes).toMatch(/CC BY-SA 4\.0/);
    expect(fixtureNotes).toMatch(/EXIF|GPS/);
    expect(fixtureNotes).toMatch(/超时|timeout/i);
    expect(fixtureNotes).toMatch(/Not logged in/);
    expect(fixtureNotes).toMatch(/未生成|没有生成/);
  });

  test('Pexels 临时掌图记录精确来源、许可核验和元数据清理证据', () => {
    expect(fixtureNotes).toContain('https://www.pexels.com/photo/photo-of-person-s-open-hands-2258248/');
    expect(fixtureNotes).toContain(
      'https://images.pexels.com/photos/2258248/pexels-photo-2258248.jpeg?cs=srgb&dl=pexels-jibarofoto-2258248.jpg&fm=jpg',
    );
    expect(fixtureNotes).toContain('https://www.pexels.com/license/');
    expect(fixtureNotes).toMatch(/2026-08-11/);
    expect(fixtureNotes).toMatch(/Luis Quintero[\s\S]*JIBAROFOTO|JIBAROFOTO[\s\S]*Luis Quintero/);
    expect(fixtureNotes).toMatch(/新文件|new file/i);
    expect(fixtureNotes).toMatch(/eXIf[\s\S]*XMP[\s\S]*GPS[\s\S]*artist[\s\S]*copyright/i);
    expect(fixtureNotes).toMatch(/sips|Pillow|ImageMagick|ffmpeg/);
  });
});
