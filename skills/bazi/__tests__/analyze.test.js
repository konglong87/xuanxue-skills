const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { baziChart } = require('../../../core/calendar');
const {
  analyze,
  REQUIRED_FIELDS,
  REPORT_SECTIONS,
  SCHOOL_METHODS,
} = require('../lib/analyze');

const COMPLETE_INPUT = {
  birthDate: '1955-02-24',
  birthTime: '19:15',
  longitude: -122.4194,
  utcOffsetMinutes: -480,
  gender: 'male',
  targetYear: 2026,
};

describe('八字综合判读上下文', () => {
  test.each([null, [], 'not-an-object', new Date()])('顶层输入必须是普通对象：%p', input => {
    expect(() => analyze(input)).toThrow(/input.*普通对象|输入.*普通对象/);
  });

  test.each([
    ['birthDate', '出生日期'],
    ['birthTime', '出生时间'],
    ['longitude', '经度'],
    ['gender', '性别'],
  ])('缺少 %s 时返回结构化补充问题', (field, label) => {
    const input = { ...COMPLETE_INPUT };
    delete input[field];

    const result = analyze(input);

    expect(result.status).toBe('needs_input');
    expect(result.missing).toContain(field);
    expect(result.questions).toContainEqual(expect.objectContaining({
      field,
      question: expect.stringContaining(label),
    }));
    expect(result).not.toHaveProperty('calculation');
  });

  test('纯空白字符串按缺失字段处理', () => {
    const result = analyze({ ...COMPLETE_INPUT, birthTime: ' \t\n ' });

    expect(result).toMatchObject({
      status: 'needs_input',
      missing: ['birthTime'],
      questions: [expect.objectContaining({ field: 'birthTime' })],
    });
  });

  test('时区偏移与显式标准经线至少提供一个', () => {
    const input = { ...COMPLETE_INPUT };
    delete input.utcOffsetMinutes;

    const missing = analyze(input);
    expect(missing).toMatchObject({
      status: 'needs_input',
      missing: ['utcOffsetMinutes|standardMeridian'],
    });
    expect(missing.questions[0].question).toMatch(/UTC|标准经线/);

    expect(analyze({ ...input, standardMeridian: -120 }).status).toBe('ready');
  });

  test('一次返回全部缺失字段，且必填契约稳定可枚举', () => {
    expect(REQUIRED_FIELDS).toEqual([
      'birthDate',
      'birthTime',
      'longitude',
      'utcOffsetMinutes|standardMeridian',
      'gender',
    ]);
    const result = analyze({ birthDate: '2000-01-01' });
    expect(result.missing).toEqual(REQUIRED_FIELDS.slice(1));
    expect(result.questions).toHaveLength(4);
  });

  test('未提供目标年份时由技能层注入可复现的当前公历年并披露来源', () => {
    const { targetYear, ...input } = COMPLETE_INPUT;

    const result = analyze(input, { currentYear: 2026 });
    const defaultResult = analyze(input);

    expect(result.status).toBe('ready');
    expect(defaultResult).toMatchObject({
      status: 'ready',
      input: { targetYearSource: 'skill-current-year' },
    });
    expect(result.calculation.目标流年.年份).toBe(2026);
    expect(result.input).toMatchObject({
      targetYear: 2026,
      targetYearSource: 'skill-current-year',
    });
    expect(result.analysisContext.输入说明.目标年).toMatch(/技能层.*当前公历年.*2026.*注入/);
  });

  test('用户显式目标年份优先于技能层当前年份', () => {
    const result = analyze({ ...COMPLETE_INPUT, targetYear: 2025 }, { currentYear: 2026 });

    expect(result.calculation.目标流年.年份).toBe(2025);
    expect(result.input).toMatchObject({
      targetYear: 2025,
      targetYearSource: 'user',
    });
    expect(result.analysisContext.输入说明.目标年).toMatch(/用户.*2025/);
  });

  test('完整输入复用 core/calendar.baziChart 并输出中文依据链', () => {
    const result = analyze(COMPLETE_INPUT);
    const expected = baziChart(COMPLETE_INPUT);

    expect(result.status).toBe('ready');
    expect(result.calculation).toEqual(expected);
    expect(result.calculation.四柱结果).toMatchObject({
      年: '乙未', 月: '戊寅', 日: '丙辰', 时: '丁酉',
    });
    expect(result.analysisContext.依据链).toEqual(expect.arrayContaining([
      expect.objectContaining({
        算出: expect.stringMatching(/乙未.*戊寅.*丙辰.*丁酉/),
        依据: expect.stringMatching(/真太阳时|节气|换日/),
        可供判读: expect.any(String),
      }),
      expect.objectContaining({
        算出: expect.stringMatching(/五行/),
        依据: expect.stringMatching(/明八字|藏干/),
        可供判读: expect.stringMatching(/旺衰|权重/),
      }),
      expect.objectContaining({
        算出: expect.stringMatching(/起运|大运|流年/),
        依据: expect.stringMatching(/两派|折算/),
        可供判读: expect.stringMatching(/阶段|趋势/),
      }),
    ]));
    expect(result).not.toHaveProperty('promptContext');
  });

  test('近子时日柱分歧时由 core 复算另一派完整命盘', () => {
    const input = {
      birthDate: '2000-01-01',
      birthTime: '23:30',
      longitude: 120,
      utcOffsetMinutes: 480,
      gender: 'male',
      targetYear: 2026,
      options: { dayBoundary: '23:00', useTrueSolar: true },
    };

    const result = analyze(input);

    expect(result.calculation.四柱结果).toMatchObject({ 日: '己未' });
    expect(result.calculation.命盘详情.日主.天干).toBe('己');
    expect(result.alternateCalculation).not.toBeNull();
    expect(result.alternateCalculation.四柱结果).toMatchObject({
      日: '戊午',
      采用规则: { dayBoundary: '00:00', useTrueSolar: true },
    });
    expect(result.alternateCalculation.命盘详情.日主.天干).toBe('戊');
    expect(result.alternateCalculation.命盘详情.十神统计.透干)
      .not.toEqual(result.calculation.命盘详情.十神统计.透干);
    expect(result.analysisContext.输入说明.换日复算).toMatch(/core.*两次|两次.*core/i);
    expect(result.analysisContext.依据链[0]).toMatchObject({
      算出: expect.stringMatching(/己未.*戊午/),
      依据: expect.stringMatching(/23:00.*00:00.*core|core.*23:00.*00:00/i),
    });
  });

  test('另一派复算保留用户其他排盘选项', () => {
    const result = analyze({
      birthDate: '2000-01-01',
      birthTime: '23:30',
      longitude: 120,
      utcOffsetMinutes: 480,
      gender: 'male',
      targetYear: 2026,
      options: { dayBoundary: '23:00', useTrueSolar: false },
    });

    expect(result.alternateCalculation.input.options).toEqual({
      dayBoundary: '00:00',
      useTrueSolar: false,
    });
  });

  test('两派四柱无分歧时统一返回 alternateCalculation null', () => {
    expect(analyze(COMPLETE_INPUT).alternateCalculation).toBeNull();
  });

  test('报告契约覆盖七个章节与文化、医疗、投资安全边界', () => {
    const result = analyze(COMPLETE_INPUT);

    expect(REPORT_SECTIONS).toEqual([
      '综合',
      '性格与资源',
      '事业财运概览',
      '婚恋概览',
      '阶段趋势',
      '流派差异',
      '免责声明',
    ]);
    expect(result.analysisContext.报告契约.章节).toEqual(REPORT_SECTIONS);
    expect(result.analysisContext.报告契约.免责声明.join('')).toMatch(/文化.*娱乐/);
    expect(result.analysisContext.报告契约.免责声明.join('')).toMatch(/医疗/);
    expect(result.analysisContext.报告契约.免责声明.join('')).toMatch(/投资/);
  });

  test('旺衰、格局、喜用神只提供并列方法，不生成唯一裁决', () => {
    const { analysisContext, calculation } = analyze(COMPLETE_INPUT);

    expect(analysisContext.流派方法).toEqual(expect.objectContaining({
      旺衰: expect.objectContaining({ 方法: expect.any(Array), 约束: expect.stringMatching(/并列|不得/) }),
      格局: expect.objectContaining({ 方法: expect.any(Array), 约束: expect.stringMatching(/并列|不得/) }),
      喜用神: expect.objectContaining({ 方法: expect.any(Array), 约束: expect.stringMatching(/并列|不得/) }),
    }));
    expect(calculation.命盘详情).not.toHaveProperty('旺衰');
    expect(calculation.命盘详情).not.toHaveProperty('格局');
    expect(calculation.命盘详情).not.toHaveProperty('喜用神');
  });

  test('调用方修改流派方法不会污染后续分析或导出的源配置', () => {
    const first = analyze(COMPLETE_INPUT);
    first.analysisContext.流派方法.旺衰.方法.push('外部污染');
    first.analysisContext.流派方法.旺衰.约束 = '外部污染';

    const second = analyze(COMPLETE_INPUT);

    expect(second.analysisContext.流派方法.旺衰.方法).not.toContain('外部污染');
    expect(second.analysisContext.流派方法.旺衰.约束).not.toBe('外部污染');
    expect(Object.isFrozen(SCHOOL_METHODS)).toBe(true);
    expect(Object.isFrozen(SCHOOL_METHODS.旺衰)).toBe(true);
    expect(Object.isFrozen(SCHOOL_METHODS.旺衰.方法)).toBe(true);
  });
});

describe('八字计算脚本协议', () => {
  const script = path.join(__dirname, '../scripts/calculate.js');

  function runWithOpenStdin(input, timeoutMs = 1_000) {
    return new Promise(resolve => {
      const child = spawn(process.execPath, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdin.on('error', () => {});
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);
      child.on('close', (code, signal) => {
        clearTimeout(timeout);
        resolve({ code, signal, stdout, stderr, timedOut });
      });
      child.stdin.write(input);
    });
  }

  test('完整 JSON 从 stdin 输入且只有 JSON 写入 stdout', () => {
    const run = spawnSync(process.execPath, [script], {
      input: JSON.stringify(COMPLETE_INPUT),
      encoding: 'utf8',
    });

    expect(run.status).toBe(0);
    expect(run.stderr).toBe('');
    expect(Buffer.byteLength(run.stdout, 'utf8')).toBeLessThan(40_000);
    expect(JSON.parse(run.stdout)).toMatchObject({ status: 'ready' });
    expect(JSON.parse(run.stdout)).not.toHaveProperty('promptContext');
  });

  test('无效 JSON 只写 stderr 并返回非零退出码', () => {
    const run = spawnSync(process.execPath, [script], {
      input: '{bad json',
      encoding: 'utf8',
    });

    expect(run.status).not.toBe(0);
    expect(run.stdout).toBe('');
    expect(JSON.parse(run.stderr)).toEqual(expect.objectContaining({
      status: 'error',
      error: expect.any(String),
    }));
  });

  test('上限内的 UTF-8 中文 JSON 输入正常处理', () => {
    const input = JSON.stringify({ ...COMPLETE_INPUT, padding: '中'.repeat(20_000) });
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);

    const run = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });

    expect(run.status).toBe(0);
    expect(run.stderr).toBe('');
    expect(JSON.parse(run.stdout)).toMatchObject({ status: 'ready' });
  });

  test('超过 64 KiB 的 UTF-8 输入只输出一次结构化错误', () => {
    const input = JSON.stringify({ ...COMPLETE_INPUT, padding: '中'.repeat(22_000) });
    expect(Buffer.byteLength(input, 'utf8')).toBeGreaterThan(64 * 1024);

    const run = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });

    expect(run.status).not.toBe(0);
    expect(run.stdout).toBe('');
    expect(run.stderr.trim().split('\n')).toHaveLength(1);
    expect(JSON.parse(run.stderr)).toEqual({
      status: 'error',
      error: expect.stringMatching(/输入.*64.*KiB|64.*KiB.*输入/),
    });
  });

  test('超限后不等待 stdin EOF 即写完单一错误并退出', async () => {
    const input = JSON.stringify({ ...COMPLETE_INPUT, padding: '中'.repeat(22_000) });

    const run = await runWithOpenStdin(input);

    expect(run).toMatchObject({
      code: 1,
      signal: null,
      stdout: '',
      timedOut: false,
    });
    expect(run.stderr.trim().split('\n')).toHaveLength(1);
    expect(JSON.parse(run.stderr)).toEqual({
      status: 'error',
      error: '输入不得超过 64 KiB',
    });
  });

  test('非对象顶层 JSON 只走脚本错误通道', () => {
    const run = spawnSync(process.execPath, [script], {
      input: '[]',
      encoding: 'utf8',
    });

    expect(run.status).not.toBe(0);
    expect(run.stdout).toBe('');
    expect(JSON.parse(run.stderr)).toEqual({
      status: 'error',
      error: expect.stringMatching(/input.*普通对象|输入.*普通对象/),
    });
  });
});
