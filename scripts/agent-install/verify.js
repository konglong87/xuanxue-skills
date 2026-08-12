'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  BAZI_PROBE_INPUT,
  BAZI_PROBE_PILLARS,
  PUBLISHED_SKILLS,
} = require('./constants');
const { assertManifestInstallation, manifestPath, readManifest } = require('./manifest');

function linkTarget(linkPath) {
  const stat = fs.lstatSync(linkPath);
  if (!stat.isSymbolicLink()) throw new Error(`技能入口不是软链接: ${linkPath}`);
  return path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
}

function verifyLinks(manifest) {
  manifest.links.forEach(link => {
    if (linkTarget(link.path) !== link.target) throw new Error(`技能入口目标不匹配: ${link.path}`);
    if (fs.realpathSync(link.path) !== fs.realpathSync(link.target)) {
      throw new Error(`技能入口无法到达运行时: ${link.path}`);
    }
  });
}

function verifyResources(repoRoot) {
  const required = [
    path.join('core', 'calendar', 'index.js'),
    path.join('vendor', 'lunar-javascript', 'index.js'),
    path.join('skills', '_shared', 'safety.js'),
    ...PUBLISHED_SKILLS.map(skill => path.join('skills', skill, 'SKILL.md')),
  ];
  required.forEach(relative => {
    const pathname = path.join(repoRoot, relative);
    if (!fs.statSync(pathname).isFile()) throw new Error(`运行时资源不是文件: ${pathname}`);
  });
}

function runBaziProbe(repoRoot) {
  const script = path.join(repoRoot, 'skills', 'bazi', 'scripts', 'calculate.js');
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(BAZI_PROBE_INPUT),
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw new Error(`八字探针执行失败: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`八字探针返回非零: ${result.stderr.trim()}`);

  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`八字探针未返回有效 JSON: ${error.message}`);
  }
  if (output.status !== 'ready') throw new Error(`八字探针状态错误: ${output.status}`);
  const pillars = output.calculation && output.calculation.四柱结果;
  if (!pillars || Object.entries(BAZI_PROBE_PILLARS).some(([key, value]) => pillars[key] !== value)) {
    throw new Error('八字四柱探针不匹配');
  }
  return { status: output.status, pillars: { ...BAZI_PROBE_PILLARS } };
}

function verifyInstallation(options) {
  const manifest = assertManifestInstallation(readManifest(manifestPath(options)), options);
  verifyResources(manifest.repoRoot);
  verifyLinks(manifest);
  const probe = runBaziProbe(manifest.repoRoot);
  return {
    status: 'verified',
    project: manifest.project,
    version: manifest.version,
    target: manifest.target,
    scope: manifest.scope,
    runtimeRoot: manifest.repoRoot,
    linkCount: manifest.links.length,
    probe,
  };
}

module.exports = { runBaziProbe, verifyInstallation };
