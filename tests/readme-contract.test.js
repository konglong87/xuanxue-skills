'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const compatibilityPath = path.join(ROOT, 'docs', 'agent-compatibility.json');
const CURRENT_SKILLS = [
  'bazi',
  'palm',
  'qimen',
  'love-marriage',
  'wealth-career',
];
const HOSTS = ['claude-code', 'codex', 'cursor', 'trae', 'workbuddy'];
const STATES = ['verified', 'experimental', 'unverified'];
const VERIFIED_EVIDENCE = ['install', 'discovery', 'runtime'];

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

function readText(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

describe('agent compatibility facts', () => {
  test('declares exactly five current skills and five target hosts', () => {
    const facts = readJson('docs/agent-compatibility.json');

    expect(facts.schemaVersion).toBe(1);
    expect(facts.projectVersion).toBe(readJson('package.json').version);
    expect(facts.currentSkills).toEqual(CURRENT_SKILLS);
    expect(facts.hosts.map(host => host.id)).toEqual(HOSTS);
    expect(new Set(facts.hosts.map(host => host.id)).size).toBe(HOSTS.length);
  });

  test('uses conservative support states backed by typed evidence', () => {
    const facts = readJson('docs/agent-compatibility.json');

    facts.hosts.forEach(host => {
      expect(STATES).toContain(host.status);
      expect(host.installRoots).toEqual({
        user: expect.any(String),
        project: expect.any(String),
      });
      expect(Array.isArray(host.evidence)).toBe(true);
      host.evidence.forEach(record => {
        expect(record).toEqual(expect.objectContaining({
          type: expect.stringMatching(/^(install|discovery|runtime|limitation)$/),
          status: expect.stringMatching(/^(passed|blocked|not-run)$/),
          checkedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          detail: expect.any(String),
        }));
      });

      if (host.status === 'verified') {
        const passed = new Set(host.evidence
          .filter(record => record.status === 'passed')
          .map(record => record.type));
        VERIFIED_EVIDENCE.forEach(type => expect(passed).toContain(type));
      }
    });
  });

  test('does not publish future skills through current plugin manifests', () => {
    const plugin = readJson('plugin.json');
    const marketplace = readJson('.claude-plugin/marketplace.json');
    const serialized = JSON.stringify({ plugin, marketplace });

    CURRENT_SKILLS.forEach(skill => expect(serialized).toContain(skill));
    ['face-reading', 'fengshui-naqi', 'divination'].forEach(skill => {
      expect(serialized).not.toContain(skill);
    });
  });

  test('compatibility facts file exists as valid JSON', () => {
    expect(fs.statSync(compatibilityPath).isFile()).toBe(true);
  });
});

describe('bilingual open-source onboarding', () => {
  const capabilityIds = [
    'bazi',
    'love-marriage',
    'wealth-career',
    'palm',
    'qimen',
    'face-reading',
    'fengshui-naqi',
    'divination',
  ];

  test('Chinese and English READMEs cross-link and expose the current version', () => {
    const chinese = readText('README.md');
    const english = readText('README_EN.md');
    const version = readText('VERSION').trim();

    expect(chinese).toContain('[English](README_EN.md)');
    expect(english).toContain('[中文](README.md)');
    expect(chinese).toContain(`v${version}`);
    expect(english).toContain(`v${version}`);
  });

  test('both READMEs state four differentiators and all eight capability rows', () => {
    const chinese = readText('README.md');
    const english = readText('README_EN.md');

    ['代码计算', '流派并列', '现实核验', '安全边界'].forEach(label => {
      expect(chinese).toContain(label);
    });
    ['Code-backed calculation', 'Schools in parallel', 'Reality checks', 'Safety boundaries']
      .forEach(label => expect(english).toContain(label));
    capabilityIds.forEach(id => {
      expect(chinese).toContain(`\`${id}\``);
      expect(english).toContain(`\`${id}\``);
    });
  });

  test('both READMEs mirror five host states from the machine-readable facts', () => {
    const facts = readJson('docs/agent-compatibility.json');
    const chinese = readText('README.md');
    const english = readText('README_EN.md');

    facts.hosts.forEach(host => {
      expect(chinese).toContain(`\`${host.id}\``);
      expect(chinese).toContain(`\`${host.status}\``);
      expect(english).toContain(`\`${host.id}\``);
      expect(english).toContain(`\`${host.status}\``);
    });
  });

  test('documents the real npx install, verify and uninstall commands', () => {
    const readmes = `${readText('README.md')}\n${readText('README_EN.md')}`;
    ['install', 'verify', 'uninstall'].forEach(command => {
      expect(readmes).toContain(
        `npx --yes github:konglong87/xuanxue-skills ${command} --agent codex --scope user`,
      );
    });
    expect(readmes).not.toContain('npx skills add');
  });

  test('offers a beginner-friendly install prompt before terminal commands', () => {
    const chinese = readText('README.md');
    const english = readText('README_EN.md');
    const repository = 'https://github.com/konglong87/xuanxue-skills';

    expect(chinese).toContain(`帮我安装 ${repository}`);
    expect(english).toContain(`Please install ${repository}`);
    expect(chinese.indexOf(`帮我安装 ${repository}`)).toBeLessThan(chinese.indexOf('npx --yes'));
    expect(english.indexOf(`Please install ${repository}`)).toBeLessThan(english.indexOf('npx --yes'));
  });

  test('keeps face reading future-only with the approved privacy wording', () => {
    const chinese = readText('README.md');
    const english = readText('README_EN.md');

    expect(chinese).toContain('因人脸隐私暂不开放');
    expect(english).toContain('Not available due to facial-image privacy concerns.');
  });
});
