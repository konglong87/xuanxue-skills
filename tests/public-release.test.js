'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  PUBLIC_EXCLUSIONS,
  buildPublicTree,
  isPublicPath,
} = require('../scripts/build-public-tree');

const ROOT = path.resolve(__dirname, '..');

function trackedFiles() {
  const publicManifest = path.join(ROOT, 'public-release-manifest.json');
  if (!fs.existsSync(path.join(ROOT, '.git')) && fs.existsSync(publicManifest)) {
    return JSON.parse(fs.readFileSync(publicManifest, 'utf8')).files.map(file => file.path);
  }
  const { execFileSync } = require('child_process');
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

describe('clean public release tree', () => {
  test('uses a frozen exclusion policy for private and generated paths', () => {
    expect(Object.isFrozen(PUBLIC_EXCLUSIONS)).toBe(true);
    [
      '.git/config',
      '.workbuddy/memory/note.md',
      'node_modules/jest/package.json',
      'docs/xuanxue-refs/source.pdf',
      'docs/HANDOFF-2026-08-12.md',
      'docs/KICKOFF.md',
      'docs/superpowers/plans/private.md',
      'docs/superpowers/specs/private.md',
      'docs/REFERENCES.md',
      'tests/references-fidelity.test.js',
    ].forEach(file => expect(isPublicPath(file)).toBe(false));
    [
      'README.md',
      'README_EN.md',
      'core/index.js',
      'skills/bazi/SKILL.md',
      'scripts/agent-install/cli.js',
      'docs/ROADMAP.md',
    ].forEach(file => expect(isPublicPath(file)).toBe(true));
  });

  test('builds required runtime, tests, public docs and installer with hashes', () => {
    const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue public '));
    const result = buildPublicTree(destination, {
      repositoryRoot: ROOT,
      files: trackedFiles(),
      readFile: relative => fs.readFileSync(path.join(ROOT, relative)),
      modeOf: relative => (
        fs.statSync(path.join(ROOT, relative)).mode & 0o111 ? '100755' : '100644'
      ),
    });

    [
      'README.md',
      'README_EN.md',
      'LICENSE',
      'VERSION',
      'package.json',
      'package-lock.json',
      'plugin.json',
      '.claude-plugin/marketplace.json',
      'core/calendar/index.js',
      'vendor/lunar-javascript/LICENSE',
      'skills/bazi/SKILL.md',
      'skills/love-marriage/SKILL.md',
      'skills/wealth-career/SKILL.md',
      'skills/palm/SKILL.md',
      'skills/qimen/SKILL.md',
      'scripts/agent-install/cli.js',
      'scripts/e2e-smoke.js',
      'tests/readme-contract.test.js',
      'docs/agent-compatibility.json',
    ].forEach(relative => {
      expect(fs.statSync(path.join(destination, relative)).isFile()).toBe(true);
    });

    const manifest = JSON.parse(fs.readFileSync(
      path.join(destination, 'public-release-manifest.json'),
      'utf8',
    ));
    expect(manifest).toMatchObject({ schemaVersion: 1, version: '0.1.0' });
    expect(manifest).not.toHaveProperty('sourceCommit');
    expect(manifest.files).toHaveLength(result.fileCount);
    expect(manifest.files).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'core/calendar/index.js',
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        bytes: expect.any(Number),
      }),
    ]));

    // 参考资料提炼文档不进公开树；除声明该策略的两个文件外，公开树里不得留下指向它的引用。
    const policyFiles = ['scripts/build-public-tree.js', 'tests/public-release.test.js'];
    expect(manifest.files.map(file => file.path)).not.toContain('docs/REFERENCES.md');
    const dangling = manifest.files.filter(file => (
      /\.(md|js|json)$/.test(file.path)
      && !policyFiles.includes(file.path)
      && fs.readFileSync(path.join(destination, file.path), 'utf8').includes('REFERENCES')
    ));
    expect(dangling.map(file => file.path)).toEqual([]);

    fs.rmSync(destination, { recursive: true, force: true });
  });

  test('excludes private paths and refuses non-empty destinations or symlinks', () => {
    const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue public '));
    fs.writeFileSync(path.join(destination, 'existing'), 'keep');
    expect(() => buildPublicTree(destination, {
      repositoryRoot: ROOT,
      files: ['README.md'],
      readFile: relative => fs.readFileSync(path.join(ROOT, relative)),
    })).toThrow(/目标目录必须为空/);

    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue public '));
    expect(() => buildPublicTree(empty, {
      repositoryRoot: ROOT,
      files: ['README.md'],
      readFile: relative => fs.readFileSync(path.join(ROOT, relative)),
      modeOf: () => '120000',
    })).toThrow(/软链接/);

    fs.rmSync(destination, { recursive: true, force: true });
    fs.rmSync(empty, { recursive: true, force: true });
  });
});
