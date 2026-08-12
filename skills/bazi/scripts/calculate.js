#!/usr/bin/env node

const fs = require('fs');
const { analyze } = require('../lib/analyze');

const MAX_INPUT_BYTES = 64 * 1024;

let input = '';
let inputBytes = 0;
let failed = false;

function fail(error) {
  if (failed) return;
  failed = true;
  input = '';
  try {
    fs.writeSync(2, `${JSON.stringify({ status: 'error', error })}\n`);
  } finally {
    process.stdin.pause();
    process.exit(1);
  }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (failed) return;
  inputBytes += Buffer.byteLength(chunk, 'utf8');
  if (inputBytes > MAX_INPUT_BYTES) {
    fail('输入不得超过 64 KiB');
    return;
  }
  input += chunk;
});
process.stdin.on('end', () => {
  if (failed) return;
  try {
    const result = analyze(JSON.parse(input));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    fail(error.message);
  }
});
