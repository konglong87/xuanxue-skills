#!/usr/bin/env node

'use strict';

const HELP = `Usage: xuanxue-skills <command> [options]

Commands:
  install    Install the complete runtime bundle and link its five skills
  verify     Verify an existing installation
  uninstall  Remove links owned by this installer

Run with Node.js 18 or newer.
`;

const path = require('path');
const { installSkills } = require('./install');
const { assertSupportedNode, parseCliArgs } = require('./paths');
const { uninstallSkills } = require('./uninstall');
const { verifyInstallation } = require('./verify');

function run(argv = process.argv.slice(2), environment = {}) {
  assertSupportedNode(environment.nodeVersion);
  const parsed = parseCliArgs(argv.length === 0 ? ['--help'] : argv);
  if (parsed.help) return { help: true };

  const options = {
    ...parsed,
    homeDir: environment.homeDir || process.env.HOME,
    projectDir: environment.projectDir || process.cwd(),
    sourceRoot: environment.sourceRoot || path.resolve(__dirname, '../..'),
    version: environment.version || require('../../package.json').version,
  };
  if (parsed.command === 'install') return installSkills(options);
  if (parsed.command === 'verify') return verifyInstallation(options);
  if (parsed.command === 'uninstall') return uninstallSkills(options);
  throw new Error(`未知命令: ${parsed.command}`);
}

if (require.main === module) {
  try {
    const result = run();
    if (result.help) process.stdout.write(HELP);
    else process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = { HELP, run };
