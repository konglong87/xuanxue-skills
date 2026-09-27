'use strict';
const MAX_INPUT_BYTES = 64 * 1024;

async function runJsonCli(analyze) {
  let size = 0;
  const chunks = [];
  try {
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > MAX_INPUT_BYTES) throw new Error('输入不得超过 64 KiB');
      chunks.push(chunk);
    }
    let input;
    try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new Error('输入必须是有效 JSON'); }
    process.stdout.write(`${JSON.stringify(analyze(input))}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
    process.exitCode = 1;
    process.stdin.destroy();
  }
}
module.exports = { runJsonCli, MAX_INPUT_BYTES };
