'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { PACKAGE_ENTRIES } = require('../scripts/release-policy');
const { auditPackage, allowedPackageFile, validatePackageFiles, REQUIRED_PACKAGE_FILES } = require('../scripts/audit-release');
const ROOT = path.resolve(__dirname, '..');

test('npm安装包白名单与发布策略一致', () => {
  expect(require('../package.json').files).toEqual(PACKAGE_ENTRIES);
});
test('真实npm dry-run具备完整运行时与第三方许可，且不包含测试/审计材料', () => {
  expect(auditPackage(ROOT).status).toBe('passed');
});
test.each(['core/.research-example/source.md', 'skills/.audit-note/raw.txt', '../LICENSE',
  'vendor/lib/.git/config', 'extra-course/lesson.md', 'core/__tests__/sample.js'])('拒绝 %s', file => {
  expect(allowedPackageFile(file)).toBe(false);
});
test('即使其他文件齐全，缺少第三方LICENSE也不能通过', () => {
  expect(() => validatePackageFiles(REQUIRED_PACKAGE_FILES.filter(p => p !== 'vendor/lunar-javascript/LICENSE'))).toThrow(/缺失/);
});
test('强行创建调研目录和测试目录也不会被npm pack纳入', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'package-boundary-'));
  try {
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({name:'package-boundary-fixture',version:'1.0.0',files:PACKAGE_ENTRIES}));
    for (const file of ['core/allowed.js', 'skills/.research-example/source.md', 'core/__tests__/case.js',
      'vendor/example/.audit-note/raw.md', '.research-root/raw.md', 'foreign-course/lesson.md']) {
      fs.mkdirSync(path.dirname(path.join(directory,file)),{recursive:true});fs.writeFileSync(path.join(directory,file),'test sentinel');
    }
    const command=process.platform==='win32'?'npm.cmd':'npm';
    const output=JSON.parse(execFileSync(command,['pack','--dry-run','--json','--ignore-scripts'],{cwd:directory,encoding:'utf8',timeout:30000}));
    expect(output[0].files.map(file=>file.path).sort()).toEqual(['core/allowed.js','package.json']);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
