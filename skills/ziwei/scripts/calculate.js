#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { analyze } = require('../lib/analyze');

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  process.stdout.write(`${JSON.stringify(analyze(input))}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
  process.exitCode = 1;
}
