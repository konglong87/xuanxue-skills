'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { PUBLISHED_SKILLS } = require('../constants');
const { installSkills } = require('../install');
const { manifestPath, readManifest } = require('../manifest');
const { resolveSkillsRoot } = require('../paths');

const SOURCE_ROOT = path.resolve(__dirname, '../../..');
const VERSION = require('../../../package.json').version;

function temporaryRoots() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue install '));
  return {
    base,
    homeDir: path.join(base, 'home with spaces'),
    projectDir: path.join(base, 'project with spaces'),
  };
}

function installOptions(roots, overrides = {}) {
  return {
    target: 'codex',
    scope: 'user',
    homeDir: roots.homeDir,
    projectDir: roots.projectDir,
    sourceRoot: SOURCE_ROOT,
    version: VERSION,
    ...overrides,
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('owned multi-agent installation', () => {
  test('copies one complete stable runtime and links all five published skills', () => {
    const roots = temporaryRoots();
    const result = installSkills(installOptions(roots));

    expect(result).toMatchObject({
      status: 'installed',
      project: 'xuanxue-skills',
      version: VERSION,
      target: 'codex',
      scope: 'user',
    });
    expect(result.runtimeRoot).toBe(path.join(
      roots.homeDir,
      '.xuanxue-skills',
      'runtime',
      `v${VERSION}`,
    ));

    ['core', 'vendor', 'skills'].forEach(entry => {
      expect(fs.statSync(path.join(result.runtimeRoot, entry)).isDirectory()).toBe(true);
    });
    ['LICENSE', 'VERSION', 'package.json'].forEach(entry => {
      expect(fs.statSync(path.join(result.runtimeRoot, entry)).isFile()).toBe(true);
    });

    expect(result.links).toHaveLength(PUBLISHED_SKILLS.length);
    result.links.forEach((link, index) => {
      expect(link.skill).toBe(PUBLISHED_SKILLS[index]);
      expect(fs.lstatSync(link.path).isSymbolicLink()).toBe(true);
      expect(fs.realpathSync(link.path)).toBe(
        fs.realpathSync(path.join(result.runtimeRoot, 'skills', link.skill)),
      );
    });

    fs.rmSync(roots.base, { recursive: true, force: true });
  });

  test('writes an ownership manifest with stable schema and five links', () => {
    const roots = temporaryRoots();
    const options = installOptions(roots, { target: 'cursor', scope: 'project' });
    const result = installSkills(options);
    const stored = readManifest(manifestPath(options));

    expect(stored).toEqual({
      schemaVersion: 1,
      project: 'xuanxue-skills',
      version: VERSION,
      target: 'cursor',
      scope: 'project',
      repoRoot: result.runtimeRoot,
      links: result.links,
    });

    fs.rmSync(roots.base, { recursive: true, force: true });
  });

  test('reinstall is idempotent and preserves the same owned links', () => {
    const roots = temporaryRoots();
    const options = installOptions(roots);
    const first = installSkills(options);
    const firstManifest = fs.readFileSync(manifestPath(options), 'utf8');
    const second = installSkills(options);

    expect(second.status).toBe('already-installed');
    expect(second.links).toEqual(first.links);
    expect(fs.readFileSync(manifestPath(options), 'utf8')).toBe(firstManifest);

    fs.rmSync(roots.base, { recursive: true, force: true });
  });

  test('upgrades links that are still owned by the previous manifest', () => {
    const roots = temporaryRoots();
    const original = installSkills(installOptions(roots));
    const upgraded = installSkills(installOptions(roots, { version: '0.1.1' }));

    expect(upgraded.status).toBe('installed');
    expect(upgraded.version).toBe('0.1.1');
    upgraded.links.forEach(link => {
      expect(fs.realpathSync(link.path)).toBe(fs.realpathSync(link.target));
      expect(link.target).toContain(`${path.sep}v0.1.1${path.sep}`);
    });
    expect(fs.statSync(original.runtimeRoot).isDirectory()).toBe(true);
    expect(readManifest(manifestPath(installOptions(roots))).version).toBe('0.1.1');

    fs.rmSync(roots.base, { recursive: true, force: true });
  });

  test('refuses to overwrite an existing path not owned by this project', () => {
    const roots = temporaryRoots();
    const options = installOptions(roots);
    const foreign = path.join(resolveSkillsRoot(options), PUBLISHED_SKILLS[0]);
    fs.mkdirSync(foreign, { recursive: true });
    fs.writeFileSync(path.join(foreign, 'FOREIGN'), 'keep', 'utf8');

    expect(() => installSkills(options)).toThrow(/不会覆盖非本项目拥有的路径/);
    expect(fs.readFileSync(path.join(foreign, 'FOREIGN'), 'utf8')).toBe('keep');
    expect(fs.existsSync(manifestPath(installOptions(roots)))).toBe(false);

    fs.rmSync(roots.base, { recursive: true, force: true });
  });

  test('rolls back only links created by a failed invocation before manifest commit', () => {
    const roots = temporaryRoots();
    const options = installOptions(roots);
    const skillsRoot = resolveSkillsRoot(options);
    const unrelated = path.join(skillsRoot, 'my-skill');
    fs.mkdirSync(unrelated, { recursive: true });
    let created = 0;

    expect(() => installSkills({ ...options,
      onLinkCreated() {
        created += 1;
        if (created === 2) throw new Error('simulated interruption');
      },
    })).toThrow('simulated interruption');

    PUBLISHED_SKILLS.forEach(skill => {
      expect(fs.existsSync(path.join(skillsRoot, skill))).toBe(false);
    });
    expect(fs.statSync(unrelated).isDirectory()).toBe(true);
    expect(fs.existsSync(manifestPath(installOptions(roots)))).toBe(false);

    fs.rmSync(roots.base, { recursive: true, force: true });
  });
});
