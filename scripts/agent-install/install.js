'use strict';

const fs = require('fs');
const path = require('path');
const {
  INSTALL_LOCK_TIMEOUT_MS,
  MANIFEST_SCHEMA_VERSION,
  PROJECT_NAME,
  RUNTIME_ENTRIES,
  STALE_INSTALL_ARTIFACT_MS,
} = require('./constants');
const {
  assertManifestInstallation,
  listManifestRecords,
  publishedSkillsForVersion,
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

function assertSourceRoot(sourceRoot, skills) {
  if (!path.isAbsolute(sourceRoot)) throw new Error('sourceRoot 必须是绝对路径');
  RUNTIME_ENTRIES.forEach(entry => {
    if (!exists(path.join(sourceRoot, entry))) throw new Error(`运行时源缺少 ${entry}`);
  });
  skills.forEach(skill => {
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

function sleep(milliseconds) {
  if (milliseconds <= 0) return;
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, milliseconds);
}

function artifactAge(pathname) {
  try {
    return Date.now() - fs.statSync(pathname).mtimeMs;
  } catch (error) {
    if (error.code === 'ENOENT') return Number.POSITIVE_INFINITY;
    throw error;
  }
}

function removeStaleArtifacts(runtimeRoot, {
  staleArtifactMs = STALE_INSTALL_ARTIFACT_MS,
} = {}) {
  const parent = path.dirname(runtimeRoot);
  if (!exists(parent)) return;
  const base = path.basename(runtimeRoot);
  fs.readdirSync(parent).forEach(name => {
    const candidate = path.join(parent, name);
    const isTemp = name.startsWith('v') && name.includes('.tmp-');
    const isLock = name.startsWith('v') && name.endsWith('.lock');
    if ((isTemp || isLock) && artifactAge(candidate) >= staleArtifactMs) {
      fs.rmSync(candidate, { recursive: true, force: true });
    }
  });
}

function acquireRuntimeLock(runtimeRoot, {
  lockTimeoutMs = INSTALL_LOCK_TIMEOUT_MS,
  staleArtifactMs = STALE_INSTALL_ARTIFACT_MS,
} = {}) {
  const lockPath = `${runtimeRoot}.lock`;
  const startedAt = Date.now();
  removeStaleArtifacts(runtimeRoot, { staleArtifactMs });
  fs.mkdirSync(path.dirname(runtimeRoot), { recursive: true });
  while (true) {
    try {
      fs.writeFileSync(lockPath, JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
      }), {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      return lockPath;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (artifactAge(lockPath) >= staleArtifactMs) {
        fs.rmSync(lockPath, { force: true });
        continue;
      }
      if (Date.now() - startedAt >= lockTimeoutMs) {
        throw new Error(`运行时安装锁超时: ${runtimeRoot}`);
      }
      sleep(Math.min(50, lockTimeoutMs));
    }
  }
}

function createRuntime(sourceRoot, runtimeRoot, options = {}) {
  if (exists(runtimeRoot)) {
    assertRuntime(runtimeRoot);
    return false;
  }

  const lockPath = acquireRuntimeLock(runtimeRoot, options);
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
    fs.rmSync(lockPath, { force: true });
  }
}

function cleanupOldRuntimes(options, currentRuntimeRoot) {
  const runtimeDirectory = path.dirname(currentRuntimeRoot);
  if (!exists(runtimeDirectory)) return [];
  const referenced = new Set(
    listManifestRecords(options).map(record => path.resolve(record.manifest.repoRoot)),
  );
  referenced.add(path.resolve(currentRuntimeRoot));
  const removed = [];
  fs.readdirSync(runtimeDirectory).forEach(name => {
    if (!/^v[^/]+$/.test(name)) return;
    const candidate = path.join(runtimeDirectory, name);
    if (referenced.has(path.resolve(candidate))) return;
    if (!fs.lstatSync(candidate).isDirectory()) return;
    fs.rmSync(candidate, { recursive: true, force: true });
    removed.push(candidate);
  });
  return removed;
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

function expectedLinks(skillsRoot, runtimeRoot, skills) {
  return skills.map(skill => ({
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

function existingManifest(filePath, options) {
  if (!exists(filePath)) return null;
  return assertManifestInstallation(readManifest(filePath), options);
}

function ownedDestination(link, owners) {
  return owners.flatMap(owner => owner.links).find(stored => (
    stored.path === link.path && linkPointsTo(stored.path, stored.target)
  )) || null;
}

function assertDestinationsAvailable(links, owners) {
  links.forEach(link => {
    if (!exists(link.path)) return;
    if (!ownedDestination(link, owners)) {
      throw new Error(`不会覆盖非本项目拥有的路径: ${link.path}`);
    }
  });
}

function installSkills(options) {
  const {
    sourceRoot,
    version,
    target,
    scope,
    onLinkCreated,
    lockTimeoutMs,
    staleArtifactMs,
  } = options;
  const skills = publishedSkillsForVersion(version);
  assertSourceRoot(sourceRoot, skills);
  const runtimeRoot = resolveRuntimeRoot(options);
  const skillsRoot = resolveSkillsRoot(options);
  const filePath = manifestPath(options);
  const links = expectedLinks(skillsRoot, runtimeRoot, skills);
  const owned = existingManifest(filePath, options);
  const records = listManifestRecords(options).filter(record => record.filePath !== filePath);

  const sharedOwners = records.filter(record => (
    resolveSkillsRoot({ ...options, target: record.manifest.target }) === skillsRoot
  ));
  if (owned && owned.version === version && owned.repoRoot === runtimeRoot
      && sameInstallation(owned, links)
      && sharedOwners.every(record => record.manifest.version === version
        && sameInstallation(record.manifest, links))) {
    return { status: 'already-installed', ...owned, runtimeRoot };
  }
  const owners = [owned, ...sharedOwners.map(record => record.manifest)].filter(Boolean);
  // Never downgrade an owner by silently dropping its additional skills.
  if (owners.some(owner => owner.links.some(link => !skills.includes(link.skill)))) {
    throw new Error('不会移除已有或共享 owner 的技能');
  }
  assertDestinationsAvailable(links, owners);

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    project: PROJECT_NAME,
    version,
    target,
    scope,
    repoRoot: runtimeRoot,
    links,
  };
  const updates = [
    ...sharedOwners.map(record => ({
      ...record,
      next: { ...manifest, target: record.manifest.target },
    })),
    { filePath, manifest: owned, next: manifest },
  ];
  const committed = [];
  const createdLinks = [];
  const replacedLinks = [];
  try {
    createRuntime(sourceRoot, runtimeRoot, { lockTimeoutMs, staleArtifactMs });
    fs.mkdirSync(skillsRoot, { recursive: true });
    links.forEach(link => {
      if (sameLink(link)) return;
      const previous = ownedDestination(link, owners);
      if (previous) {
        fs.rmSync(link.path);
        replacedLinks.push(previous);
      }
      createDirectoryLink(link.target, link.path);
      createdLinks.push(link.path);
      if (onLinkCreated) onLinkCreated(link);
    });
    updates.forEach(update => {
      writeManifestAtomic(update.filePath, update.next);
      committed.push(update);
    });
  } catch (error) {
    committed.reverse().forEach(update => {
      if (update.manifest) writeManifestAtomic(update.filePath, update.manifest);
      else fs.rmSync(update.filePath, { force: true });
    });
    createdLinks.reverse().forEach(linkPath => fs.rmSync(linkPath, { force: true }));
    replacedLinks.reverse().forEach(link => createDirectoryLink(link.target, link.path));
    throw error;
  }

  cleanupOldRuntimes(options, runtimeRoot);
  return { status: 'installed', ...manifest, runtimeRoot };
}

module.exports = { installSkills };
