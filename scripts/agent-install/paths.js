'use strict';

const path = require('path');
const { COMMANDS, SCOPES, SKILLS_ROOTS, TARGETS } = require('./constants');

function assertSupportedNode(version = process.versions.node) {
  const match = /^v?(\d+)(?:\.|$)/.exec(version);
  const major = match ? Number(match[1]) : Number.NaN;
  if (!Number.isInteger(major) || major < 18) {
    throw new Error(`需要 Node.js 18 或更高版本，当前版本: ${version}`);
  }
  return major;
}

function directoryLinkType(platform = process.platform) {
  return platform === 'win32' ? 'junction' : 'dir';
}

function requireOption(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} 不能为空`);
  }
  return value;
}

function validateTargetScope(target, scope) {
  if (!TARGETS.includes(target)) throw new Error(`未知 agent: ${target}`);
  if (!SCOPES.includes(scope)) throw new Error(`未知 scope: ${scope}`);
}

function baseDir({ scope, homeDir, projectDir }) {
  return scope === 'user'
    ? requireOption(homeDir, 'homeDir')
    : requireOption(projectDir, 'projectDir');
}

function resolveSkillsRoot(options) {
  const { target, scope } = options;
  validateTargetScope(target, scope);
  return path.join(baseDir(options), ...SKILLS_ROOTS[target][scope]);
}

function resolveRuntimeRoot(options) {
  const { scope, version } = options;
  if (!SCOPES.includes(scope)) throw new Error(`未知 scope: ${scope}`);
  requireOption(version, 'version');
  return path.join(baseDir(options), '.xuanxue-skills', 'runtime', `v${version}`);
}

function optionValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} 缺少值`);
  return value;
}

function parseCliArgs(argv) {
  if (argv.length === 0) throw new Error('缺少命令');
  if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) return { help: true };

  const [command] = argv;
  if (!COMMANDS.includes(command)) throw new Error(`未知命令: ${command}`);

  let target;
  let scope;
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--agent') {
      target = optionValue(argv, i, '--agent');
      i += 1;
    } else if (arg === '--scope') {
      scope = optionValue(argv, i, '--scope');
      i += 1;
    } else {
      throw new Error(`未知参数: ${arg}`);
    }
  }

  if (!target) throw new Error('缺少 --agent');
  if (!scope) throw new Error('缺少 --scope');
  validateTargetScope(target, scope);
  return { command, target, scope, help: false };
}

module.exports = {
  assertSupportedNode,
  directoryLinkType,
  parseCliArgs,
  resolveRuntimeRoot,
  resolveSkillsRoot,
};
