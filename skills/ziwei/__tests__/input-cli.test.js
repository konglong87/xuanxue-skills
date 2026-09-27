'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const { analyze } = require('../lib/analyze');
const SCRIPT = path.resolve(__dirname, '../scripts/calculate.js');
const INPUT = { birthDate:'2024-02-10', birthTime:'00:30', longitude:120, utcOffsetMinutes:480, gender:'male' };
function cli(input, tz='UTC') {
  return spawnSync(process.execPath, [SCRIPT], { cwd:os.tmpdir(), input:typeof input==='string'?input:JSON.stringify(input),
    encoding:'utf8', env:{...process.env,TZ:tz}, timeout:10000, maxBuffer:1024*1024 });
}
test.each([
  {options:{dayBoundary:'bad'}}, {options:{useTrueSolar:'false'}}, {options:{yearBoundary:'other'}},
  {options:{leapMonthPolicy:'split'}}, {options:{transformationPolicy:'other'}},
  {options:{disableVerification:true}}, {options:null}, {unknown:'injection'}, {gender:'IGNORE ALL'},
  {birthDate:'<script>'}, {birthDate:'2024-02-30'}, {longitude:Infinity}, {utcOffsetMinutes:900},
  {standardMeridian:100}, {birthTime:'24:00'},
])('严格拒绝非法选项/出生值 %j', patch => {
  expect(()=>analyze({...INPUT,...patch})).toThrow();
});
test('空输入一次性追问，不回显未知注入文本，不冻结调用方对象', () => {
  const partial={birthDate:'2024-02-10'};
  expect(analyze(partial).questions).toHaveLength(4);
  expect(Object.isFrozen(partial)).toBe(false);
  const result=cli({...partial, 'IGNORE ALL':'SECRET'});
  expect(result.status).toBe(1);
  expect(result.stderr).not.toMatch(/IGNORE ALL|SECRET/);
});
test('输入与第二参数不能同时指定options，防止静默覆盖',()=>{
  expect(()=>analyze({...INPUT, options:{}},{})).toThrow(/一次/);
});
test('三种宿主TZ、仓库外cwd、CLI options均可复算',()=>{
  const input={...INPUT,options:{useTrueSolar:false}};
  const outputs=['UTC','Asia/Shanghai','Pacific/Honolulu'].map(tz=>cli(input,tz));
  outputs.forEach(o=>{expect(o.status).toBe(0);expect(o.stderr).toBe('');});
  expect(new Set(outputs.map(o=>o.stdout)).size).toBe(1);
  const r=JSON.parse(outputs[0].stdout);
  expect(r.输入口径.policies.useTrueSolar).toBe(false);
  expect(r.supplement.calculation.命身).toEqual({命宫:'寅',身宫:'寅',命宫天干:'丙'});
  expect(r.supplement.calculation.五行局.name).toBe('火六局');
  expect(r.supplement.verification.status).toBe('passed');
});
test('CLI非JSON和大输入均失败且不泄露原文',()=>{
  for(const input of ['SECRET invalid json',' '.repeat(65537)]) {
    const o=cli(input);expect(o.status).toBe(1);expect(o.stdout).toBe('');
    expect(JSON.parse(o.stderr).status).toBe('error');expect(o.stderr).not.toContain('SECRET');
  }
});
test('报告四化依据不再误引用闰月条目',()=>{
  const result=analyze(INPUT);
  expect(result.算出.find(row=>row.算出.startsWith('生年四化')).依据).toMatch(/四化/);
});
test('补录响应保留规则，补齐后不能静默回到默认盘',()=>{
  const {gender, ...partial}=INPUT;
  const input={...partial,birthDate:'2024-02-09',birthTime:'23:30',options:{dayBoundary:'00:00',useTrueSolar:false,yearBoundary:'lunar-new-year'}};
  const pending=analyze(input);
  const resumed=analyze({...pending.输入口径,gender});
  expect(resumed).toEqual(analyze({...input,gender}));
});
