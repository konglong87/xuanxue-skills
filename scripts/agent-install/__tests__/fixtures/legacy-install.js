'use strict';

const fs = require('fs');
const path = require('path');
const manifestFixture = require('./manifest-v0.2.1.json');

// Historical fixture contracts deliberately do not import the current installer,
// manifest writer, path resolver or published-skills registry.
const RUNTIME_ENTRIES = Object.freeze(['core', 'vendor', 'skills', 'LICENSE', 'VERSION', 'package.json']);
const USER_SKILLS_ROOTS = Object.freeze({ codex: '.agents', cursor: '.cursor' });
const REMOVED_RUNTIME_PATHS = Object.freeze(['core/ziwei', 'skills/ziwei']);

function copyLegacyRuntime(sourceRoot, runtimeRoot) {
  if (fs.existsSync(runtimeRoot)) return;
  fs.mkdirSync(runtimeRoot, { recursive: true });
  RUNTIME_ENTRIES.forEach(entry => {
    fs.cpSync(path.join(sourceRoot, entry), path.join(runtimeRoot, entry), { recursive: true });
  });
  REMOVED_RUNTIME_PATHS.forEach(relative => {
    fs.rmSync(path.join(runtimeRoot, relative), { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(runtimeRoot, 'VERSION'), `${manifestFixture.version}\n`);
  const packagePath = path.join(runtimeRoot, 'package.json');
  const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  fs.writeFileSync(packagePath, `${JSON.stringify({ ...metadata, version: manifestFixture.version }, null, 2)}\n`);
}

function createLegacyInstallation({ sourceRoot, homeDir, projectDir, scope, target }) {
  if (!Object.hasOwn(USER_SKILLS_ROOTS, target) || !['user', 'project'].includes(scope)) {
    throw new Error('Unsupported legacy fixture target/scope');
  }
  const base = scope === 'user' ? homeDir : projectDir;
  const runtimeRoot = path.join(base, manifestFixture.repoRoot);
  const skillsRoot = path.join(base, scope === 'project' ? '.agents' : USER_SKILLS_ROOTS[target], 'skills');
  // Only the fixture's relative roots are expanded; the five-skill contract is fixed.
  const manifest = {
    ...manifestFixture, target, scope, repoRoot: runtimeRoot,
    links: manifestFixture.links.map(link => ({
      ...link, path: path.join(skillsRoot, link.path), target: path.join(runtimeRoot, link.target),
    })),
  };
  copyLegacyRuntime(sourceRoot, runtimeRoot);
  fs.mkdirSync(skillsRoot, { recursive: true });
  manifest.links.forEach(link => {
    if (!fs.existsSync(link.path)) {
      fs.symlinkSync(link.target, link.path, process.platform === 'win32' ? 'junction' : 'dir');
    }
  });
  const filePath = path.join(base, '.xuanxue-skills', 'manifests', `${target}-${scope}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { ...manifest, runtimeRoot };
}

module.exports = { createLegacyInstallation };
