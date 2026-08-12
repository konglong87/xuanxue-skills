'use strict';

const fs = require('fs');
const path = require('path');
const {
  assertManifestInstallation,
  installStateRoot,
  listManifestRecords,
  manifestPath,
  readManifest,
} = require('./manifest');

function pathExists(pathname) {
  try {
    fs.lstatSync(pathname);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function isOwnedLink(link) {
  if (!pathExists(link.path) || !fs.lstatSync(link.path).isSymbolicLink()) return false;
  return path.resolve(path.dirname(link.path), fs.readlinkSync(link.path)) === link.target;
}

function runtimeStillReferenced(options, runtimeRoot) {
  return listManifestRecords(options)
    .some(record => record.manifest.repoRoot === runtimeRoot);
}

function removeEmptyParents(pathname, stopAt) {
  let current = pathname;
  while (current.startsWith(`${stopAt}${path.sep}`)) {
    try {
      fs.rmdirSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      if (error.code === 'ENOTEMPTY') return;
      throw error;
    }
    current = path.dirname(current);
  }
}

function uninstallSkills(options) {
  const filePath = manifestPath(options);
  const manifest = assertManifestInstallation(readManifest(filePath), options);
  const skippedLinks = [];
  let removedLinks = 0;
  let retainedSharedLinks = 0;
  const otherRecords = listManifestRecords(options)
    .filter(record => record.filePath !== filePath);

  manifest.links.forEach(link => {
    if (!isOwnedLink(link)) {
      if (pathExists(link.path)) skippedLinks.push(link.path);
      return;
    }
    const hasOtherOwner = otherRecords.some(record => record.manifest.links.some(other => (
      other.path === link.path && other.target === link.target
    )));
    if (hasOtherOwner) {
      retainedSharedLinks += 1;
      return;
    }
    fs.rmSync(link.path);
    removedLinks += 1;
  });

  fs.rmSync(filePath);
  const stateRoot = installStateRoot(options);
  if (!runtimeStillReferenced(options, manifest.repoRoot)) {
    fs.rmSync(manifest.repoRoot, { recursive: true, force: true });
    removeEmptyParents(path.dirname(manifest.repoRoot), stateRoot);
  }
  removeEmptyParents(path.dirname(filePath), stateRoot);

  return {
    status: 'uninstalled',
    project: manifest.project,
    version: manifest.version,
    target: manifest.target,
    scope: manifest.scope,
    removedLinks,
    retainedSharedLinks,
    skippedLinks,
  };
}

module.exports = { uninstallSkills };
