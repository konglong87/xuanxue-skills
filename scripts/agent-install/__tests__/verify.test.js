'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { ZIWEI_PROBE_INPUT } = require('../constants');
const { installSkills } = require('../install');
const { verifyInstallation } = require('../verify');

const SOURCE_ROOT = path.resolve(__dirname, '../../..');
let base;
let options;
let script;

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'xuanxue probe '));
  options = {
    target: 'codex', scope: 'user', version: '0.3.1', sourceRoot: SOURCE_ROOT,
    homeDir: path.join(base, 'home'), projectDir: path.join(base, 'project'),
  };
  const installed = installSkills(options);
  script = path.join(installed.runtimeRoot, 'skills', 'ziwei', 'scripts', 'calculate.js');
});

afterEach(() => {
  if (base) fs.rmSync(base, { recursive: true, force: true });
});

describe('installed ziwei CLI probe', () => {
  test('verifies the real civil-time lunar new year chart alongside the existing bazi probe', () => {
    expect(verifyInstallation(options)).toMatchObject({
      status: 'verified', probe: { status: 'ready' },
      ziweiProbe: {
        status: 'ready', lunarMonth: 1, lunarDay: 1, timeBranch: '子',
        yearPillar: '甲辰', lifePalace: '寅', bodyPalace: '寅', lifePalaceStem: '丙',
        fiveElementsClass: '火六局', fiveElementsValue: 6, useTrueSolar: false,
      },
    });
    expect(ZIWEI_PROBE_INPUT).toMatchObject({
      birthDate: '2024-02-10', birthTime: '00:30', options: { useTrueSolar: false },
    });
  });

  test('requires ziwei resources for a six-skill manifest', () => {
    fs.rmSync(path.join(path.dirname(path.dirname(script)), 'SKILL.md'));
    expect(() => verifyInstallation(options)).toThrow(/ENOENT/);
  });

  test.each([
    ['missing CLI', null, /紫微探针返回非零/],
    ['nonzero exit', 'process.exit(2);', /紫微探针返回非零/],
    ['invalid JSON', 'process.stdout.write("not JSON");', /紫微探针未返回有效 JSON/],
    ['null output', 'process.stdout.write("null");', /紫微探针状态错误/],
    ['needs input', 'process.stdout.write(JSON.stringify({status:"needs_input"}));', /紫微探针状态错误/],
    ['empty chart', 'process.stdout.write(JSON.stringify({status:"ready"}));', /紫微命身\/五行局探针不匹配/],
  ])('fails closed for %s', (_label, replacement, message) => {
    if (replacement === null) fs.rmSync(script);
    else fs.writeFileSync(script, replacement);
    expect(() => verifyInstallation(options)).toThrow(message);
  });

  test.each([
    ['wrong month', report => { report.supplement.calculation.输入.农历月份 = 2; }],
    ['wrong year', report => { report.supplement.calculation.输入.生年干 = '乙'; }],
    ['old palace bug', report => { report.supplement.calculation.命身.命宫 = '辰'; }],
    ['wrong body palace', report => { report.supplement.calculation.命身.身宫 = '子'; }],
    ['wrong palace stem', report => { report.supplement.calculation.命身.命宫天干 = '戊'; }],
    ['wrong element class', report => { report.supplement.calculation.五行局.name = '木三局'; }],
    ['wrong element value', report => { report.supplement.calculation.五行局.value = 3; }],
    ['ignored civil-time option', report => { report.输入口径.policies.useTrueSolar = true; }],
  ])('detects %s even when CLI status is ready', (_label, mutate) => {
    const report = JSON.parse(execFileSync(process.execPath, [script], {
      input: JSON.stringify(ZIWEI_PROBE_INPUT), encoding: 'utf8',
    }));
    mutate(report);
    fs.writeFileSync(script, `process.stdout.write(${JSON.stringify(JSON.stringify(report))});`);
    expect(() => verifyInstallation(options)).toThrow(/紫微命身\/五行局探针不匹配/);
  });

  test.each(['supplement', 'calculation'])('requires passed verification at the %s layer', layer => {
    const report = JSON.parse(execFileSync(process.execPath, [script], {
      input: JSON.stringify(ZIWEI_PROBE_INPUT), encoding: 'utf8',
    }));
    expect(report.supplement.verification.status).toBe('passed');
    expect(report.supplement.calculation.verification.status).toBe('passed');
    const subject = layer === 'supplement' ? report.supplement : report.supplement.calculation;
    for (const verification of [undefined, null, {}, { status: 'failed' }, { status: 'ready' }]) {
      subject.verification = verification;
      fs.writeFileSync(script, `process.stdout.write(${JSON.stringify(JSON.stringify(report))});`);
      expect(() => verifyInstallation(options)).toThrow(/紫微验证探针未通过/);
    }
  });

});
