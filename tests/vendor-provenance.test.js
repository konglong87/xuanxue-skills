// 内联第三方库的溯源门禁。
//
// 内联（vendor）换来了运行时零依赖与版本锁定，但丢掉了 npm 那套机器可验的保障：
// 谁替换了 vendor/ 里的文件、版本是否还是 README 声明的那个，全靠人记性。
// 这组测试把「版本声明一致」和「入口可用」变成红灯，而不是无声漂移。

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const VENDOR = path.join(__dirname, '..', 'vendor', 'lunar-javascript');

describe('vendor/lunar-javascript 溯源', () => {
  test('上游 package.json 存在（机器可读的版本来源）', () => {
    expect(fs.existsSync(path.join(VENDOR, 'package.json'))).toBe(true);
  });

  test('LICENSE 存在（MIT 要求保留版权声明）', () => {
    const license = fs.readFileSync(path.join(VENDOR, 'LICENSE'), 'utf8');
    expect(license).toMatch(/MIT/i);
    expect(license).toMatch(/6tail/);
  });

  test('README 声明的版本与上游 package.json 一致', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(VENDOR, 'package.json'), 'utf8'));
    const readme = fs.readFileSync(path.join(VENDOR, 'README.md'), 'utf8');

    // README 里以表格形式声明：| 版本 | 1.7.7 |
    const m = readme.match(/\|\s*版本\s*\|\s*([0-9]+\.[0-9]+\.[0-9]+)\s*\|/);
    expect(m).not.toBeNull();

    expect(m[1]).toBe(pkg.version);
  });

  test('README 锁定 npm 发布元数据与上游 gitHead', () => {
    const readme = fs.readFileSync(path.join(VENDOR, 'README.md'), 'utf8');
    expect(readme).toContain('eecd5d12c8221b82ce574dc2bad2d7aefcb46e56');
    expect(readme).toContain('2c7a359f2ffc414ce2b0214f59148ff7a823851f');
    expect(readme).toContain(
      'sha512-u/KYiwPIBo/0bT+WWfU7qO1d+aqeB90Tuy4ErXenr2Gam0QcWeezUvtiOIyXR7HbVnW2I1DKfU0NBvzMZhbVQw==',
    );
  });

  test.each([
    ['LICENSE', 'd9210caf1844dcf410095cea464b79800aad30dbd49df092076b9f0ddc015404'],
    ['index.js', '93301dca7b1ba04a96ae8a8410cf02a11016be4b17614d63d298325e976abc35'],
    ['lunar.js', '9750324bfe1aa63c146f8c72b1143df924466c11c8a5277d7d9225c541a18aaa'],
    ['package.json', '39b062864077ca2980683db5f209cb78339f74e4d5c1dea77b4a6263da116c02'],
  ])('%s 的实际 SHA-256 与 README 锁定值一致', (file, expected) => {
    const bytes = fs.readFileSync(path.join(VENDOR, file));
    const actual = crypto.createHash('sha256').update(bytes).digest('hex');
    const readme = fs.readFileSync(path.join(VENDOR, 'README.md'), 'utf8');
    expect(actual).toBe(expected);
    expect(readme).toContain(`| ${file} | \`${expected}\` |`);
  });

  test('并行开发契约明确保留已跟踪的根 lockfile', () => {
    const root = path.join(__dirname, '..');
    const contract = fs.readFileSync(path.join(root, 'docs', 'SKILL-CONTRACTS.md'), 'utf8');
    expect(fs.existsSync(path.join(root, 'package-lock.json'))).toBe(true);
    expect(contract).toMatch(/package-lock\.json[\s\S]{0,80}(?:已纳入版本控制|已经跟踪|必须保留)/);
    expect(contract).not.toMatch(/package-lock\.json[\s\S]{0,40}未纳入版本控制/);
  });

  test('包名与仓库指向上游，未被改写', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(VENDOR, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('lunar-javascript');
    expect(pkg.repository.url).toMatch(/6tail\/lunar-javascript/);
  });

  test('无传递依赖 —— 这是它能被内联的前提', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(VENDOR, 'package.json'), 'utf8'));
    expect(pkg.dependencies == null || Object.keys(pkg.dependencies).length === 0).toBe(true);
  });

  test('根 package.json 不得有 runtime dependencies', () => {
    const root = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const deps = root.dependencies || {};
    // 用户装技能包不会跑 npm install，任何 runtime 依赖都会在用户机器上 MODULE_NOT_FOUND
    expect(Object.keys(deps)).toEqual([]);
  });

  test('入口可用且导出历法核心类', () => {
    const lunar = require('../vendor/lunar-javascript');
    for (const k of ['Solar', 'Lunar', 'EightChar', 'NineStar']) {
      expect(lunar[k]).toBeDefined();
    }
  });

  test('四柱抽测：1990-08-15 10:30 → 庚午 甲申 壬子 乙巳', () => {
    const lunar = require('../vendor/lunar-javascript');
    const d = lunar.Solar.fromYmdHms(1990, 8, 15, 10, 30, 0).getLunar();
    expect(d.getYearInGanZhiByLiChun()).toBe('庚午'); // 年柱以立春为界
    expect(d.getMonthInGanZhi()).toBe('甲申');
    expect(d.getDayInGanZhi()).toBe('壬子');
    expect(d.getTimeInGanZhi()).toBe('乙巳'); // 壬日起庚子，巳位第 6 → 乙巳
  });

  test('core/calendar 依赖的关键 API 都在（升级后若消失，此处先红）', () => {
    const lunar = require('../vendor/lunar-javascript');
    const l = lunar.Lunar.fromYmd(2026, 2, 16);
    for (const fn of ['getJieQiTable', 'getYearInGanZhiByLiChun', 'getMonthInGanZhi', 'getDayInGanZhi']) {
      expect(typeof l[fn]).toBe('function');
    }
    expect(typeof lunar.Lunar.fromYmd(2026, 2, 16).getJieQiTable()).toBe('object');
  });

  test('vendor 下不得有测试文件 —— 上游 __tests__ 若被误拷会混进 npm test', () => {
    const 越界 = fs.readdirSync(VENDOR).filter(n => n === '__tests__' || n === 'tests');
    expect(越界).toEqual([]);
  });
});
