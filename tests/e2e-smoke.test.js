const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'e2e-smoke.js');

describe('仓库外 cwd E2E smoke', () => {
  test('从仓库外工作目录运行并输出单行可解析摘要', () => {
    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      env: { ...process.env, TZ: 'Pacific/Honolulu' },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    const summary = JSON.parse(lines[0]);
    expect(summary).toEqual(expect.objectContaining({
      status: 'ok',
      targetYear: 2026,
      total: expect.any(Number),
      checks: {
        core: expect.any(Number),
        baziCli: expect.any(Number),
        domains: expect.any(Number),
        qimen: expect.any(Number),
        palm: expect.any(Number),
        safety: expect.any(Number),
      },
    }));
    expect(summary.total).toBe(Object.values(summary.checks)
      .reduce((total, count) => total + count, 0));
    expect(summary.checks.core).toBeGreaterThanOrEqual(6);
    expect(summary.checks.baziCli).toBeGreaterThanOrEqual(7);
    expect(summary.checks.domains).toBeGreaterThanOrEqual(12);
    expect(summary.checks.qimen).toBeGreaterThanOrEqual(5);
    expect(summary.checks.palm).toBeGreaterThanOrEqual(9);
    expect(summary.checks.safety).toBeGreaterThanOrEqual(7);
  });

  test('脚本限用 Node 内置模块与仓内相对 require，且不依赖网络和当前日期', () => {
    const source = fs.readFileSync(SCRIPT, 'utf8');

    expect(source).not.toMatch(/require\(['"](?!\.\.?\/)(?!assert(?:\/strict)?['"]|child_process['"]|fs['"]|path['"]|util['"]|os['"])[^'"]+/);
    expect(source).not.toMatch(/https?:\/\/|fetch\(|XMLHttpRequest|node_modules/);
    expect(source).not.toMatch(/Date\.now\(|new Date\(|getFullYear\(/);
    expect(source).toMatch(/targetYear:\s*2026/);
  });

  test('palm fixture 与 safe DTO 预期不读取被测 contract 常量', () => {
    const source = fs.readFileSync(SCRIPT, 'utf8');
    const fixture = source.match(/function palmInput\([\s\S]*?\n}\n\nfunction verifyCore/);
    expect(fixture).not.toBeNull();
    [
      'HAND_SHAPE_TRAITS',
      'PALM_MOUNTS',
      'MAJOR_LINES',
      'AUXILIARY_LINES',
      'SAFE_HEALTH_TEXT',
      'REQUIRED_DISCLAIMER',
    ].forEach(name => expect(fixture[0]).not.toContain(`contract.${name}`));
    expect(fixture[0]).toContain("'本报告属于中国传统文化中的手相娱乐性观察，不把象征关系当作确定事实，不保证医疗、寿命、职业、关系或收益结果。现实决定应结合真实经历与相应专业意见。'");
    expect(fixture[0]).toContain("'健康内容只作体质倾向与精力状态提示，不构成医疗诊断；如有身体不适或疑虑，请及时就医。'");
  });
});
