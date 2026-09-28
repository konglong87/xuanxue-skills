#!/usr/bin/env node
'use strict';

const path = require('path');
const { execFileSync } = require('child_process');
const { isPrivatePath } = require('./release-policy');
const { PUBLISHED_SKILLS } = require('./agent-install/constants');
const REQUIRED_PACKAGE_FILES = Object.freeze([
  'LICENSE', 'VERSION', 'package.json', 'plugin.json', '.claude-plugin/marketplace.json',
  'vendor/lunar-javascript/LICENSE', 'vendor/lunar-javascript/README.md',
  'vendor/lunar-javascript/package.json', 'vendor/lunar-javascript/lunar.js',
  'core/index.js', 'core/calendar/index.js', 'core/ziwei/index.js',
  'scripts/agent-install/cli.js', 'skills/bazi/scripts/calculate.js', 'skills/ziwei/scripts/calculate.js',
  ...PUBLISHED_SKILLS.map(skill => `skills/${skill}/SKILL.md`),
]);
const PACKAGE_ROOTS = Object.freeze(['core', 'skills', 'vendor', '.claude-plugin']);
const PACKAGE_TOP_FILES = Object.freeze(['package.json', 'LICENSE', 'VERSION', 'README.md', 'README_EN.md', 'plugin.json']);
function allowedPackageFile(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || path.posix.isAbsolute(file)
    || file.split('/').includes('..') || isPrivatePath(file)) return false;
  if (file.split('/').some(part => part === '__tests__' || part === 'tests')) return false;
  return PACKAGE_TOP_FILES.includes(file) || PACKAGE_ROOTS.includes(file.split('/')[0])
    || file.startsWith('scripts/agent-install/') || file === 'docs/CONTENT-POLICY.md' || file === 'docs/RELEASE-AUDIT.md';
}
function validatePackageFiles(files) {
  if (!Array.isArray(files)) throw new Error('打包文件列表无效');
  const rejected = files.filter(file => !allowedPackageFile(file));
  const missing = REQUIRED_PACKAGE_FILES.filter(file => !files.includes(file));
  if (rejected.length || missing.length) {
    throw new Error(`发布校验失败：${rejected.length} 个越界路径，${missing.length} 个必需文件缺失`);
  }
  return { status: 'passed', files: files.length, requiredFiles: REQUIRED_PACKAGE_FILES.length };
}
function auditPackage(root = path.resolve(__dirname, '..')) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const output = execFileSync(command, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  });
  const packages = JSON.parse(output);
  if (!Array.isArray(packages) || packages.length !== 1 || !Array.isArray(packages[0].files)) {
    throw new Error('npm未返回预期的打包列表');
  }
  return validatePackageFiles(packages[0].files.map(file => file.path));
}
if (require.main === module) {
  try { process.stdout.write(`${JSON.stringify(auditPackage())}\n`); }
  catch (error) { process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`); process.exitCode = 1; }
}
module.exports = { REQUIRED_PACKAGE_FILES, allowedPackageFile, validatePackageFiles, auditPackage };
