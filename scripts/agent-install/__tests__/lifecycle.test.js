'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { installSkills } = require('../install');
const { manifestPath } = require('../manifest');
const { uninstallSkills } = require('../uninstall');
const { verifyInstallation } = require('../verify');

const SOURCE_ROOT = path.resolve(__dirname, '../../..');
const VERSION = require('../../../package.json').version;

function setup(overrides = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue lifecycle '));
  const options = {
    target: 'codex',
    scope: 'user',
    homeDir: path.join(base, 'home'),
    projectDir: path.join(base, 'project'),
    sourceRoot: SOURCE_ROOT,
    version: VERSION,
    ...overrides,
  };
  const installed = installSkills(options);
  return { base, options, installed };
}

describe('installation verification', () => {
  test('verifies links, shared resources and deterministic bazi pillars', () => {
    const fixture = setup();

    expect(verifyInstallation(fixture.options)).toMatchObject({
      status: 'verified',
      target: 'codex',
      scope: 'user',
      version: VERSION,
      linkCount: 5,
      probe: {
        status: 'ready',
        pillars: { 年: '乙未', 月: '戊寅', 日: '丙辰', 时: '丁酉' },
      },
    });

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test.each([
    ['broken link', ({ installed }) => fs.rmSync(installed.links[0].target, { recursive: true })],
    ['missing core', ({ installed }) => fs.rmSync(path.join(installed.runtimeRoot, 'core'), { recursive: true })],
    ['missing vendor', ({ installed }) => fs.rmSync(path.join(installed.runtimeRoot, 'vendor', 'lunar-javascript', 'index.js'))],
  ])('fails for %s', (_label, breakInstallation) => {
    const fixture = setup();
    breakInstallation(fixture);

    expect(() => verifyInstallation(fixture.options)).toThrow();

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('fails when a user retargets an installed link', () => {
    const fixture = setup();
    const link = fixture.installed.links[0];
    const foreign = path.join(fixture.base, 'foreign-skill');
    fs.mkdirSync(foreign);
    fs.rmSync(link.path);
    fs.symlinkSync(foreign, link.path, 'dir');

    expect(() => verifyInstallation(fixture.options)).toThrow(/目标不匹配/);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('fails when deterministic bazi output no longer matches the fixture', () => {
    const fixture = setup();
    const script = path.join(
      fixture.installed.runtimeRoot,
      'skills',
      'bazi',
      'scripts',
      'calculate.js',
    );
    fs.writeFileSync(script, '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify({status:"ready",calculation:{四柱结果:{年:"错",月:"错",日:"错",时:"错"}}}));\n');

    expect(() => verifyInstallation(fixture.options)).toThrow(/四柱探针不匹配/);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('rejects manifest paths outside the derived installation roots', () => {
    const fixture = setup();
    const filePath = manifestPath(fixture.options);
    const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const foreign = path.join(fixture.base, 'foreign-runtime');
    fs.mkdirSync(foreign);
    manifest.repoRoot = foreign;
    manifest.links = manifest.links.map((link, index) => ({
      ...link,
      path: path.join(fixture.base, `foreign-link-${index}`),
      target: foreign,
    }));
    fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);

    expect(() => verifyInstallation(fixture.options)).toThrow(/安装路径不匹配/);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });
});

describe('safe uninstall', () => {
  test('removes owned links, manifest and unreferenced runtime but preserves unrelated skills', () => {
    const fixture = setup();
    const unrelated = path.join(path.dirname(fixture.installed.links[0].path), 'my-skill');
    fs.mkdirSync(unrelated);

    const result = uninstallSkills(fixture.options);

    expect(result).toMatchObject({ status: 'uninstalled', removedLinks: 5, skippedLinks: [] });
    fixture.installed.links.forEach(link => expect(fs.existsSync(link.path)).toBe(false));
    expect(fs.statSync(unrelated).isDirectory()).toBe(true);
    expect(fs.existsSync(manifestPath(fixture.options))).toBe(false);
    expect(fs.existsSync(fixture.installed.runtimeRoot)).toBe(false);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('preserves a retargeted user path and reports it as skipped', () => {
    const fixture = setup();
    const link = fixture.installed.links[0];
    const foreign = path.join(fixture.base, 'foreign-skill');
    fs.mkdirSync(foreign);
    fs.rmSync(link.path);
    fs.symlinkSync(foreign, link.path, 'dir');

    const result = uninstallSkills(fixture.options);

    expect(result.removedLinks).toBe(4);
    expect(result.skippedLinks).toEqual([link.path]);
    expect(fs.realpathSync(link.path)).toBe(fs.realpathSync(foreign));
    expect(fs.statSync(foreign).isDirectory()).toBe(true);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('keeps a runtime still referenced by another host manifest', () => {
    const fixture = setup();
    const cursorOptions = { ...fixture.options, target: 'cursor' };
    installSkills(cursorOptions);

    uninstallSkills(fixture.options);

    expect(fs.statSync(fixture.installed.runtimeRoot).isDirectory()).toBe(true);
    expect(verifyInstallation(cursorOptions).status).toBe('verified');

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('shares project links between Codex and Cursor until the last owner uninstalls', () => {
    const fixture = setup({ scope: 'project' });
    const cursorOptions = { ...fixture.options, target: 'cursor' };
    const cursor = installSkills(cursorOptions);

    expect(cursor.links).toEqual(fixture.installed.links);
    expect(uninstallSkills(fixture.options)).toMatchObject({
      removedLinks: 0,
      retainedSharedLinks: 5,
    });
    cursor.links.forEach(link => expect(fs.realpathSync(link.path)).toBe(fs.realpathSync(link.target)));
    expect(verifyInstallation(cursorOptions).status).toBe('verified');

    expect(uninstallSkills(cursorOptions)).toMatchObject({
      removedLinks: 5,
      retainedSharedLinks: 0,
    });
    cursor.links.forEach(link => expect(fs.existsSync(link.path)).toBe(false));

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });

  test('refuses a tampered manifest without deleting paths outside the installation roots', () => {
    const fixture = setup();
    const filePath = manifestPath(fixture.options);
    const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const foreign = path.join(fixture.base, 'foreign-runtime');
    const canary = path.join(foreign, 'KEEP');
    fs.mkdirSync(foreign);
    fs.writeFileSync(canary, 'keep');
    manifest.repoRoot = foreign;
    manifest.links = manifest.links.map((link, index) => ({
      ...link,
      path: path.join(fixture.base, `foreign-link-${index}`),
      target: foreign,
    }));
    fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);

    expect(() => uninstallSkills(fixture.options)).toThrow(/安装路径不匹配/);
    expect(fs.readFileSync(canary, 'utf8')).toBe('keep');
    expect(fs.existsSync(filePath)).toBe(true);

    fs.rmSync(fixture.base, { recursive: true, force: true });
  });
});
