'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { installSkills } = require('../install');
const { manifestPath, readManifest } = require('../manifest');
const { resolveRuntimeRoot, resolveSkillsRoot } = require('../paths');
const { uninstallSkills } = require('../uninstall');
const { verifyInstallation } = require('../verify');
const { createLegacyInstallation } = require('./fixtures/legacy-install');

const SOURCE_ROOT = path.resolve(__dirname, '../../..');
const LEGACY_VERSION = '0.2.1';
const FIX_VERSION = '0.3.1';
const NEW_SKILL = 'ziwei';
const fixtures = [];

// Reconstruct a real on-disk five-skill installation without Git history or an
// installer invocation. The compatible bazi runtime comes from this checkout.
afterEach(() => {
  jest.restoreAllMocks();
  fixtures.splice(0).forEach(base => fs.rmSync(base, { recursive: true, force: true }));
});

function fixture(scope = 'user') {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue upgrade ')));
  fixtures.push(base);
  const options = {
    target: 'codex', scope, sourceRoot: SOURCE_ROOT, version: FIX_VERSION,
    homeDir: path.join(base, 'isolated home'), projectDir: path.join(base, 'isolated project'),
  };
  fs.mkdirSync(options.homeDir);
  fs.mkdirSync(options.projectDir);
  return options;
}

function cli(sourceRoot, command, options) {
  return JSON.parse(execFileSync(process.execPath, [
    path.join(sourceRoot, 'scripts', 'agent-install', 'cli.js'),
    command, '--agent', options.target, '--scope', options.scope,
  ], {
    cwd: options.projectDir, env: { ...process.env, HOME: options.homeDir }, encoding: 'utf8',
  }));
}

function legacyInstall(options) {
  const result = createLegacyInstallation(options);
  expect(result.version).toBe(LEGACY_VERSION);
  expect(result.links).toHaveLength(5);
  expect(fs.existsSync(path.join(result.runtimeRoot, 'skills', NEW_SKILL))).toBe(false);
  expect(fs.existsSync(path.join(result.runtimeRoot, 'core', NEW_SKILL))).toBe(false);
  expect(fs.readFileSync(path.join(result.runtimeRoot, 'VERSION'), 'utf8').trim()).toBe(LEGACY_VERSION);
  expect(JSON.parse(fs.readFileSync(path.join(result.runtimeRoot, 'package.json'), 'utf8')).version)
    .toBe(LEGACY_VERSION);
  assertLiveLinks(result.links);
  return result;
}

function assertLiveLinks(links) {
  links.forEach(link => expect(fs.realpathSync(link.path)).toBe(fs.realpathSync(link.target)));
}

describe('real isolated five-to-six skill migration', () => {
  test.each([
    ['user', '0.3.0'], ['project', '0.3.0'], ['user', FIX_VERSION], ['project', FIX_VERSION],
  ])('upgrades v0.2.1 %s to %s and is idempotent', (scope, version) => {
    const options = { ...fixture(scope), version };
    const old = legacyInstall(options);
    const upgraded = installSkills(options);
    expect(upgraded.links).toHaveLength(6);
    expect(readManifest(manifestPath(options)).version).toBe(version);
    assertLiveLinks(upgraded.links);
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
    expect(verifyInstallation(options)).toMatchObject({ status: 'verified', version, linkCount: 6 });
    expect(installSkills(options).status).toBe('already-installed');
    expect(uninstallSkills(options).removedLinks).toBe(6);
    expect(fs.existsSync(upgraded.runtimeRoot)).toBe(false);
  });

  test.each(['user', 'project'])('current CLI verifies and uninstalls untouched legacy %s installs', scope => {
    const options = fixture(scope);
    const old = legacyInstall(options);
    const verified = cli(SOURCE_ROOT, 'verify', options);
    expect(verified).toMatchObject({
      status: 'verified', version: LEGACY_VERSION, linkCount: 5, probe: { status: 'ready' },
    });
    expect(verified).not.toHaveProperty('ziweiProbe');
    const foreign = path.join(resolveSkillsRoot(options), NEW_SKILL);
    fs.mkdirSync(foreign);
    fs.writeFileSync(path.join(foreign, 'KEEP'), 'user owned');
    expect(cli(SOURCE_ROOT, 'uninstall', options)).toMatchObject({ removedLinks: 5, skippedLinks: [] });
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
    expect(fs.readFileSync(path.join(foreign, 'KEEP'), 'utf8')).toBe('user owned');
  });

  test('retains old runtime while a different user-level owner still references it', () => {
    const options = fixture();
    const cursor = { ...options, target: 'cursor' };
    const old = legacyInstall(options);
    legacyInstall(cursor);
    installSkills(options);
    expect(fs.existsSync(old.runtimeRoot)).toBe(true);
    expect(verifyInstallation(cursor)).toMatchObject({ version: LEGACY_VERSION, linkCount: 5 });
    expect(uninstallSkills(cursor).removedLinks).toBe(5);
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
    expect(verifyInstallation(options).linkCount).toBe(6);
  });

  test('legacy shared owners retain five links until the last uninstall', () => {
    const options = fixture('project');
    const cursor = { ...options, target: 'cursor' };
    const old = legacyInstall(options);
    legacyInstall(cursor);
    expect(uninstallSkills(options)).toMatchObject({ removedLinks: 0, retainedSharedLinks: 5 });
    assertLiveLinks(old.links);
    expect(verifyInstallation(cursor).linkCount).toBe(5);
    expect(uninstallSkills(cursor).removedLinks).toBe(5);
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
  });

  test.each(['codex', 'cursor'])('upgrading shared %s migrates both owner contracts together', target => {
    const options = fixture('project');
    const cursor = { ...options, target: 'cursor' };
    const old = legacyInstall(options);
    legacyInstall(cursor);
    installSkills({ ...options, target });
    for (const owner of [options, cursor]) {
      expect(readManifest(manifestPath(owner))).toMatchObject({ version: FIX_VERSION, links: expect.any(Array) });
      expect(verifyInstallation(owner).linkCount).toBe(6);
      expect(installSkills(owner).status).toBe('already-installed');
    }
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
    expect(uninstallSkills(options)).toMatchObject({ removedLinks: 0, retainedSharedLinks: 6 });
    expect(verifyInstallation(cursor).linkCount).toBe(6);
    expect(uninstallSkills(cursor).removedLinks).toBe(6);
  });

  test('a new shared owner can join and upgrade an existing five-skill owner', () => {
    const options = fixture('project');
    legacyInstall(options);
    const cursor = { ...options, target: 'cursor' };
    expect(installSkills(cursor).links).toHaveLength(6);
    expect(verifyInstallation(options)).toMatchObject({ version: FIX_VERSION, linkCount: 6 });
    expect(verifyInstallation(cursor)).toMatchObject({ version: FIX_VERSION, linkCount: 6 });
    expect(() => installSkills({ ...options, version: LEGACY_VERSION })).toThrow(/共享 owner/);
    expect(verifyInstallation(options).linkCount).toBe(6);
  });

  test('unknown install versions fail before changing the legacy installation', () => {
    const options = fixture();
    const old = legacyInstall(options);
    const before = fs.readFileSync(manifestPath(options), 'utf8');
    expect(() => installSkills({ ...options, version: '0.3.2' })).toThrow(/version 不受支持/);
    expect(fs.readFileSync(manifestPath(options), 'utf8')).toBe(before);
    assertLiveLinks(old.links);
    expect(verifyInstallation(options).linkCount).toBe(5);
  });

  test('0.3.0 upgrades into a new 0.3.1 runtime instead of short-circuiting', () => {
    const options = fixture();
    const old = installSkills({ ...options, version: '0.3.0' });
    fs.writeFileSync(path.join(old.runtimeRoot, 'skills', NEW_SKILL, 'scripts', 'calculate.js'),
      'process.stdout.write(JSON.stringify({status: "ready"}));');
    expect(() => verifyInstallation(options)).toThrow(/紫微命身\/五行局探针不匹配/);
    const fixed = installSkills(options);
    expect(fixed.status).toBe('installed');
    expect(fixed.runtimeRoot).not.toBe(old.runtimeRoot);
    expect(fs.existsSync(old.runtimeRoot)).toBe(false);
    expect(verifyInstallation(options)).toMatchObject({ version: FIX_VERSION, linkCount: 6 });
  });

  test.each(['ziwei conflict', 'retargeted legacy skill'])('preserves ownership on %s', conflict => {
    const options = fixture();
    const old = legacyInstall(options);
    const before = fs.readFileSync(manifestPath(options), 'utf8');
    const foreign = path.join(options.homeDir, 'foreign');
    fs.mkdirSync(foreign);
    fs.writeFileSync(path.join(foreign, 'KEEP'), 'keep');
    const destination = conflict === 'ziwei conflict'
      ? path.join(resolveSkillsRoot(options), NEW_SKILL) : old.links[0].path;
    if (conflict !== 'ziwei conflict') fs.rmSync(destination);
    fs.symlinkSync(foreign, destination, 'dir');
    expect(() => installSkills(options)).toThrow(/不会覆盖非本项目拥有的路径/);
    expect(fs.readFileSync(manifestPath(options), 'utf8')).toBe(before);
    expect(fs.realpathSync(destination)).toBe(fs.realpathSync(foreign));
    expect(fs.readFileSync(path.join(foreign, 'KEEP'), 'utf8')).toBe('keep');
    expect(fs.existsSync(resolveRuntimeRoot(options))).toBe(false);
  });

  test.each(['link creation', 'manifest commit'])('rolls back shared upgrade on failed %s', failure => {
    const options = fixture('project');
    const cursor = { ...options, target: 'cursor' };
    const old = legacyInstall(options);
    legacyInstall(cursor);
    const snapshots = [options, cursor].map(owner => fs.readFileSync(manifestPath(owner), 'utf8'));
    if (failure === 'manifest commit') {
      const rename = fs.renameSync;
      let failed = false;
      jest.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
        if (!failed && to === manifestPath(options)) {
          failed = true;
          throw new Error('injected failure');
        }
        return rename(from, to);
      });
    }
    expect(() => installSkills({
      ...options,
      onLinkCreated(link) {
        if (failure === 'link creation' && link.skill === NEW_SKILL) throw new Error('injected failure');
      },
    })).toThrow('injected failure');
    [options, cursor].forEach((owner, index) => {
      expect(fs.readFileSync(manifestPath(owner), 'utf8')).toBe(snapshots[index]);
      expect(verifyInstallation(owner).linkCount).toBe(5);
    });
    assertLiveLinks(old.links);
    expect(fs.existsSync(path.join(resolveSkillsRoot(options), NEW_SKILL))).toBe(false);
    expect(installSkills(options).status).toBe('installed');
  });

  test.each(['own path', 'other target', 'other filename'])('rejects tampered %s before migration', mutation => {
    const options = fixture('project');
    const old = legacyInstall(options);
    const owner = mutation === 'own path' ? options : { ...options, target: 'cursor' };
    if (owner !== options) legacyInstall(owner);
    const file = manifestPath(owner);
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (mutation === 'own path') manifest.links[0].path = path.join(options.homeDir, 'foreign');
    if (mutation === 'other target') manifest.links[0].target = path.join(options.homeDir, 'foreign');
    fs.writeFileSync(file, JSON.stringify(manifest));
    if (mutation === 'other filename') fs.renameSync(file, path.join(path.dirname(file), 'unexpected.json'));
    expect(() => installSkills(options)).toThrow(/安装路径不匹配|文件名/);
    expect(() => uninstallSkills(options)).toThrow(/安装路径不匹配|文件名/);
    if (mutation === 'own path') expect(() => verifyInstallation(options)).toThrow(/安装路径不匹配/);
    assertLiveLinks(old.links);
    expect(fs.existsSync(resolveRuntimeRoot(options))).toBe(false);
  });
});
