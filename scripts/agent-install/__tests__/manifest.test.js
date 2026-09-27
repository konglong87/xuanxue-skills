'use strict';

const path = require('path');
const { PUBLISHED_SKILLS_BY_VERSION } = require('../constants');
const { assertManifestInstallation, publishedSkillsForVersion, validateManifest } = require('../manifest');
const { resolveRuntimeRoot, resolveSkillsRoot } = require('../paths');

const LEGACY_SKILLS = ['bazi', 'palm', 'qimen', 'love-marriage', 'wealth-career'];
const CURRENT_SKILLS = [...LEGACY_SKILLS, 'ziwei'];
const OPTIONS = {
  target: 'codex', scope: 'user', homeDir: path.resolve('isolated-home'),
};

function manifestFor(version, skills = LEGACY_SKILLS) {
  const repoRoot = resolveRuntimeRoot({ ...OPTIONS, version });
  return {
    schemaVersion: 1, project: 'xuanxue-skills', target: OPTIONS.target,
    scope: OPTIONS.scope, version, repoRoot,
    links: skills.map(skill => ({
      skill, path: path.join(resolveSkillsRoot(OPTIONS), skill),
      target: path.join(repoRoot, 'skills', skill),
    })),
  };
}

describe('explicit versioned release contracts', () => {
  test.each(['0.1.0', '0.1.1', '0.2.0', '0.2.1'])('accepts exactly five skills for %s', version => {
    const manifest = manifestFor(version);
    expect(assertManifestInstallation(manifest, OPTIONS)).toBe(manifest);
    expect(publishedSkillsForVersion(version)).toEqual(LEGACY_SKILLS);
    expect(() => validateManifest(manifestFor(version, CURRENT_SKILLS))).toThrow(/5 个链接/);
  });

  test.each(['0.3.0', '0.3.1'])('requires all six skills for %s', version => {
    const manifest = manifestFor(version, CURRENT_SKILLS);
    expect(assertManifestInstallation(manifest, OPTIONS)).toBe(manifest);
    expect(publishedSkillsForVersion(version)).toEqual(CURRENT_SKILLS);
    expect(() => validateManifest(manifestFor(version))).toThrow(/6 个链接/);
  });

  test('release registry and its lists are immutable', () => {
    expect(Object.isFrozen(PUBLISHED_SKILLS_BY_VERSION)).toBe(true);
    Object.values(PUBLISHED_SKILLS_BY_VERSION).forEach(skills => expect(Object.isFrozen(skills)).toBe(true));
  });

  test.each(['0.1.2', '0.1.99', '0.2.2', '0.3.2', '0.4.0', '1.0.0', '0.3.1-rc.1',
    '__proto__', 'constructor', '../../outside', '0.3.1/../../outside'])('rejects unknown version %s', version => {
    expect(() => validateManifest(manifestFor(version))).toThrow(/version 不受支持/);
  });

  test.each(['0.2.1', '0.3.1'])('rejects unknown and duplicate skills in %s', version => {
    const skills = version === '0.2.1' ? LEGACY_SKILLS : CURRENT_SKILLS;
    expect(() => validateManifest(manifestFor(version, ['foreign', ...skills.slice(1)])))
      .toThrow(/skill 无效/);
    expect(() => validateManifest(manifestFor(version, [skills[1], ...skills.slice(1)])))
      .toThrow(/skill 不得重复/);
  });

  test('ziwei cannot masquerade as a legacy published skill', () => {
    expect(() => validateManifest(manifestFor('0.2.1', ['ziwei', ...LEGACY_SKILLS.slice(1)])))
      .toThrow(/skill 无效/);
  });

  test.each(['0.2.1', '0.3.1'])('keeps derived ownership boundaries for %s', version => {
    const make = () => manifestFor(version, publishedSkillsForVersion(version));
    for (const field of ['path', 'target']) {
      const manifest = make();
      manifest.links[0][field] = path.resolve('foreign');
      expect(() => assertManifestInstallation(manifest, OPTIONS)).toThrow(/安装路径不匹配/);
    }
    const manifest = make();
    manifest.repoRoot = path.resolve('foreign');
    expect(() => assertManifestInstallation(manifest, OPTIONS)).toThrow(/安装路径不匹配/);
    expect(() => assertManifestInstallation(make(), { ...OPTIONS, target: 'cursor' })).toThrow(/agent\/scope/);
  });
});
