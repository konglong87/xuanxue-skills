#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PUBLIC_EXCLUSIONS = Object.freeze([
  '.git',
  '.workbuddy',
  'node_modules',
  'docs/xuanxue-refs',
  'docs/REFERENCES.md',
  'tests/references-fidelity.test.js',
  'docs/HANDOFF-',
  'docs/KICKOFF.md',
  'docs/superpowers/plans',
  'docs/superpowers/specs',
]);

function normalized(relative) {
  if (typeof relative !== 'string' || relative.length === 0) throw new Error('发布路径不能为空');
  const value = relative.replaceAll('\\', '/');
  if (path.posix.isAbsolute(value) || value.split('/').includes('..')) {
    throw new Error(`发布路径不得逃逸仓库: ${relative}`);
  }
  return value;
}

function isPublicPath(relative) {
  const value = normalized(relative);
  return !PUBLIC_EXCLUSIONS.some(exclusion => (
    value === exclusion
    || value.startsWith(`${exclusion}/`)
    || (exclusion.endsWith('-') && value.startsWith(exclusion))
  ));
}

function trackedFiles(repositoryRoot) {
  return execFileSync('git', ['ls-files', '-z'], { cwd: repositoryRoot })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

function trackedModes(repositoryRoot) {
  const lines = execFileSync('git', ['ls-files', '-s', '-z'], { cwd: repositoryRoot })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
  const result = new Map();
  lines.forEach(line => {
    const match = /^(\d+) [a-f0-9]+ \d+\t(.+)$/.exec(line);
    if (!match) throw new Error(`无法解析 git 文件模式: ${line}`);
    result.set(match[2], match[1]);
  });
  return result;
}

function readHeadFile(repositoryRoot, relative) {
  return execFileSync('git', ['show', `HEAD:${relative}`], {
    cwd: repositoryRoot,
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function assertEmptyDirectory(destination) {
  fs.mkdirSync(destination, { recursive: true });
  if (!fs.statSync(destination).isDirectory()) throw new Error('目标必须是目录');
  if (fs.readdirSync(destination).length > 0) throw new Error('发布目标目录必须为空');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function buildPublicTree(destination, options = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot || path.resolve(__dirname, '..'));
  const outputRoot = path.resolve(destination);
  assertEmptyDirectory(outputRoot);

  const files = (options.files || trackedFiles(repositoryRoot))
    .map(normalized)
    .filter(isPublicPath)
    .sort();
  const modes = options.modeOf ? null : trackedModes(repositoryRoot);
  const modeOf = options.modeOf || (relative => modes.get(relative));
  const readFile = options.readFile || (relative => readHeadFile(repositoryRoot, relative));
  const manifestFiles = [];

  files.forEach(relative => {
    const mode = modeOf(relative);
    if (mode === '120000') throw new Error(`公开树拒绝软链接: ${relative}`);
    if (mode && mode !== '100644' && mode !== '100755') {
      throw new Error(`公开树不支持 git mode ${mode}: ${relative}`);
    }
    const content = Buffer.from(readFile(relative));
    const destinationPath = path.resolve(outputRoot, relative);
    if (!destinationPath.startsWith(`${outputRoot}${path.sep}`)) {
      throw new Error(`发布目标路径逃逸: ${relative}`);
    }
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, content, { mode: mode === '100755' ? 0o755 : 0o644 });
    manifestFiles.push({ path: relative, sha256: sha256(content), bytes: content.length });
  });

  const version = fs.readFileSync(path.join(outputRoot, 'VERSION'), 'utf8').trim();
  const manifest = {
    schemaVersion: 1,
    version,
    files: manifestFiles,
  };
  fs.writeFileSync(
    path.join(outputRoot, 'public-release-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  return { destination: outputRoot, fileCount: manifestFiles.length, manifest };
}

if (require.main === module) {
  const destination = process.argv[2];
  if (!destination) {
    process.stderr.write('Usage: node scripts/build-public-tree.js <empty-destination>\n');
    process.exitCode = 1;
  } else {
    try {
      process.stdout.write(`${JSON.stringify(buildPublicTree(destination))}\n`);
    } catch (error) {
      process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
      process.exitCode = 1;
    }
  }
}

module.exports = { PUBLIC_EXCLUSIONS, buildPublicTree, isPublicPath };
