'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  BAZI_PROBE_INPUT,
  BAZI_PROBE_PILLARS,
  ZIWEI_PROBE_INPUT,
  ZIWEI_PROBE_EXPECTED,
} = require('./constants');
const { assertManifestInstallation, manifestPath, publishedSkillsForVersion, readManifest } = require('./manifest');

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

function verifyResources(repoRoot, skills) {
  const required = [
    path.join('core', 'calendar', 'index.js'),
    path.join('vendor', 'lunar-javascript', 'index.js'),
    path.join('skills', '_shared', 'safety.js'),
    ...skills.map(skill => path.join('skills', skill, 'SKILL.md')),
  ];
  required.forEach(relative => {
    const pathname = path.join(repoRoot, relative);
    if (!fs.statSync(pathname).isFile()) throw new Error(`运行时资源不是文件: ${pathname}`);
  });
}

const PROBE_TIMEOUT_MS = 10_000;
const PROBE_MAX_BUFFER = 1024 * 1024;

function runSkillProbe(repoRoot, skill, label, input) {
  const script = path.join(repoRoot, 'skills', skill, 'scripts', 'calculate.js');
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    timeout: PROBE_TIMEOUT_MS,
    maxBuffer: PROBE_MAX_BUFFER,
  });
  if (result.error) throw new Error(`${label}探针执行失败: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label}探针返回非零: ${result.stderr.trim()}`);

  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label}探针未返回有效 JSON: ${error.message}`);
  }
  if (output?.status !== 'ready') throw new Error(`${label}探针状态错误: ${output?.status}`);
  return output;
}

function runBaziProbe(repoRoot) {
  const output = runSkillProbe(repoRoot, 'bazi', '八字', BAZI_PROBE_INPUT);
  const pillars = output.calculation && output.calculation.四柱结果;
  if (!pillars || Object.entries(BAZI_PROBE_PILLARS).some(([key, value]) => pillars[key] !== value)) {
    throw new Error('八字四柱探针不匹配');
  }
  return { status: output.status, pillars: { ...BAZI_PROBE_PILLARS } };
}

function runZiweiProbe(repoRoot) {
  const output = runSkillProbe(repoRoot, 'ziwei', '紫微', ZIWEI_PROBE_INPUT);
  const chart = output.supplement?.calculation;
  const actual = {
    lunarMonth: chart?.输入?.农历月份,
    lunarDay: chart?.输入?.农历日,
    timeBranch: chart?.输入?.时支,
    yearPillar: `${chart?.输入?.生年干}${chart?.输入?.生年支}`,
    lifePalace: chart?.命身?.命宫,
    bodyPalace: chart?.命身?.身宫,
    lifePalaceStem: chart?.命身?.命宫天干,
    fiveElementsClass: chart?.五行局?.name,
    fiveElementsValue: chart?.五行局?.value,
    useTrueSolar: output.输入口径?.policies?.useTrueSolar,
  };
  if (chart?.status !== 'ready'
      || Object.entries(ZIWEI_PROBE_EXPECTED).some(([key, value]) => actual[key] !== value)) {
    throw new Error('紫微命身/五行局探针不匹配');
  }
  if (output.supplement?.verification?.status !== 'passed'
      || chart.verification?.status !== 'passed') {
    throw new Error('紫微验证探针未通过');
  }
  return { status: output.status, ...actual };
}

function verifyInstallation(options) {
  const manifest = assertManifestInstallation(readManifest(manifestPath(options)), options);
  const skills = publishedSkillsForVersion(manifest.version);
  verifyResources(manifest.repoRoot, skills);
  verifyLinks(manifest);
  const probe = runBaziProbe(manifest.repoRoot);
  const ziweiProbe = skills.includes('ziwei') ? runZiweiProbe(manifest.repoRoot) : null;
  return {
    status: 'verified',
    project: manifest.project,
    version: manifest.version,
    target: manifest.target,
    scope: manifest.scope,
    runtimeRoot: manifest.repoRoot,
    linkCount: manifest.links.length,
    probe,
    ...(ziweiProbe ? { ziweiProbe } : {}),
  };
}

module.exports = { runBaziProbe, runZiweiProbe, verifyInstallation };
