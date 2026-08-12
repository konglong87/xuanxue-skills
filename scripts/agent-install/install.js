'use strict';

const fs = require('fs');
const path = require('path');
const {
  MANIFEST_SCHEMA_VERSION,
  PROJECT_NAME,
  PUBLISHED_SKILLS,
  RUNTIME_ENTRIES,
} = require('./constants');
const {
  listManifestRecords,
  manifestPath,
  readManifest,
  writeManifestAtomic,
} = require('./manifest');
const { directoryLinkType, resolveRuntimeRoot, resolveSkillsRoot } = require('./paths');

function exists(pathname) {
  try {
    fs.lstatSync(pathname);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function assertSourceRoot(sourceRoot) {
  if (!path.isAbsolute(sourceRoot)) throw new Error('sourceRoot 必须是绝对路径');
  RUNTIME_ENTRIES.forEach(entry => {
    if (!exists(path.join(sourceRoot, entry))) throw new Error(`运行时源缺少 ${entry}`);
  });
  PUBLISHED_SKILLS.forEach(skill => {
    if (!exists(path.join(sourceRoot, 'skills', skill, 'SKILL.md'))) {
      throw new Error(`运行时源缺少 skill: ${skill}`);
    }
  });
}

function assertRuntime(runtimeRoot) {
  RUNTIME_ENTRIES.forEach(entry => {
    if (!exists(path.join(runtimeRoot, entry))) throw new Error(`已存在的运行时不完整: ${entry}`);
  });
}

function createRuntime(sourceRoot, runtimeRoot) {
  if (exists(runtimeRoot)) {
    assertRuntime(runtimeRoot);
    return false;
  }

  fs.mkdirSync(path.dirname(runtimeRoot), { recursive: true });
  const temporary = `${runtimeRoot}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.mkdirSync(temporary, { recursive: false });
    RUNTIME_ENTRIES.forEach(entry => {
      fs.cpSync(path.join(sourceRoot, entry), path.join(temporary, entry), {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    });
    fs.renameSync(temporary, runtimeRoot);
    return true;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function linkPointsTo(linkPath, target) {
  if (!exists(linkPath)) return false;
  const stat = fs.lstatSync(linkPath);
  if (!stat.isSymbolicLink()) return false;
  return path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath)) === target;
}

function sameLink(link) {
  return linkPointsTo(link.path, link.target);
}

function createDirectoryLink(target, linkPath) {
  fs.symlinkSync(target, linkPath, directoryLinkType());
}

function expectedLinks(skillsRoot, runtimeRoot) {
  return PUBLISHED_SKILLS.map(skill => ({
    skill,
    path: path.join(skillsRoot, skill),
    target: path.join(runtimeRoot, 'skills', skill),
  }));
}

function sameInstallation(manifest, expected) {
  return manifest.links.length === expected.length
    && expected.every((link, index) => {
      const stored = manifest.links[index];
      return stored.skill === link.skill
        && stored.path === link.path
        && stored.target === link.target
        && sameLink(link);
    });
}

function existingManifest(filePath) {
  if (!exists(filePath)) return null;
  return readManifest(filePath);
}

function ownedDestination(link, owned) {
  if (!owned) return null;
  const stored = owned.links.find(candidate => candidate.path === link.path);
  if (!stored || !linkPointsTo(stored.path, stored.target)) return null;
  return stored;
}

function sharedDestination(link, records) {
  return records
    .flatMap(record => record.manifest.links)
    .find(stored => (
      stored.path === link.path
      && stored.target === link.target
      && linkPointsTo(stored.path, stored.target)
    )) || null;
}

function assertDestinationsAvailable(links, owned, records) {
  links.forEach(link => {
    if (!exists(link.path)) return;
    if (!ownedDestination(link, owned) && !sharedDestination(link, records)) {
      throw new Error(`不会覆盖非本项目拥有的路径: ${link.path}`);
    }
  });
}

function installSkills(options) {
  const { sourceRoot, version, target, scope, onLinkCreated } = options;
  assertSourceRoot(sourceRoot);
  const runtimeRoot = resolveRuntimeRoot(options);
  const skillsRoot = resolveSkillsRoot(options);
  const filePath = manifestPath(options);
  const links = expectedLinks(skillsRoot, runtimeRoot);
  const owned = existingManifest(filePath);
  const records = listManifestRecords(options).filter(record => record.filePath !== filePath);

  if (owned && owned.version === version && owned.repoRoot === runtimeRoot && sameInstallation(owned, links)) {
    return { status: 'already-installed', ...owned, runtimeRoot };
  }
  assertDestinationsAvailable(links, owned, records);

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    project: PROJECT_NAME,
    version,
    target,
    scope,
    repoRoot: runtimeRoot,
    links,
  };
  const createdLinks = [];
  const replacedLinks = [];
  try {
    createRuntime(sourceRoot, runtimeRoot);
    fs.mkdirSync(skillsRoot, { recursive: true });
    links.forEach(link => {
      if (sameLink(link)) return;
      const previous = ownedDestination(link, owned);
      if (previous) {
        fs.rmSync(link.path);
        replacedLinks.push(previous);
      }
      createDirectoryLink(link.target, link.path);
      createdLinks.push(link.path);
      if (onLinkCreated) onLinkCreated(link);
    });
    writeManifestAtomic(filePath, manifest);
  } catch (error) {
    createdLinks.reverse().forEach(linkPath => fs.rmSync(linkPath, { force: true }));
    replacedLinks.reverse().forEach(link => createDirectoryLink(link.target, link.path));
    throw error;
  }

  return { status: 'installed', ...manifest, runtimeRoot };
}

module.exports = { installSkills };
