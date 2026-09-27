#!/usr/bin/env node
'use strict';
// Offline generator after installing iztro@2.6.1 into a disposable directory.
// Usage: node scripts/gen-ziwei-golden.js /absolute/path/node_modules/iztro
// It does not import the implementation under test, or copy oracle source code.
const fs = require('fs');
const path = require('path');
const oraclePath = process.argv[2];
if (!oraclePath || !path.isAbsolute(oraclePath)) throw new Error('Provide an absolute oracle package path');
const pkg = require(path.join(oraclePath, 'package.json'));
if (pkg.name !== 'iztro' || pkg.version !== '2.6.1') throw new Error('Oracle must be iztro@2.6.1');
const { astro } = require(oraclePath);
astro.config({ yearDivide: 'normal', dayDivide: 'current' });
const STARS = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军','文昌','文曲','左辅','右弼','禄存','擎羊','陀罗','天马'];
const cases = [];
function add(date, hour, gender, expectedDate = date, boundary = '00:00', time) {
  const input = { birthDate: date, birthTime: time || `${String(hour * 2).padStart(2, '0')}:30`,
    longitude: 120, utcOffsetMinutes: 480, gender,
    options: { useTrueSolar: false, dayBoundary: boundary, yearBoundary: 'lunar-new-year', leapMonthPolicy: 'same-month' } };
  const chart = astro.bySolar(expectedDate, hour, gender === 'male' ? '男' : '女', false, 'zh-CN');
  cases.push({ input, oracleDate: expectedDate, expected: {
    life: chart.earthlyBranchOfSoulPalace, body: chart.earthlyBranchOfBodyPalace, bureau: chart.fiveElementsClass,
    palaces: chart.palaces.map(p => ({ branch: p.earthlyBranch, stem: p.heavenlyStem,
      name: p.name === '命宫' ? p.name : `${p.name}宫`, body: p.isBodyPalace,
      stars: [...p.majorStars, ...p.minorStars].filter(s => STARS.includes(s.name))
        .map(s => s.name + (s.mutagen || '')).sort(), decade: p.decadal.range })),
  } });
}
for (let year = 1984; year < 1994; year++) {
  for (const hour of [0, 5, 10]) add(`${year}-${String(year % 9 + 3).padStart(2, '0')}-18`, hour, year % 2 ? 'female' : 'male');
}
for (let hour = 0; hour < 12; hour++) add('2000-09-18', hour, hour % 2 ? 'female' : 'male');
for (const date of ['2023-03-22','2023-04-05','2023-04-19','2024-02-09','2024-02-10','2024-02-11']) add(date, 3, 'female');
// Late-rat convention is normalized by explicit independently specified dates, not DUT output.
add('2024-02-09', 0, 'male', '2024-02-10', '23:00', '23:30');
add('2024-02-09', 0, 'male', '2024-02-09', '00:00', '23:30');
add('2023-03-21', 0, 'female', '2023-03-22', '23:00', '23:30');
add('2023-04-19', 0, 'female', '2023-04-20', '23:00', '23:30');
const destination = path.join(__dirname, '../core/ziwei/__tests__/fixtures/golden.json');
fs.writeFileSync(destination, `${JSON.stringify({ oracle: 'iztro', version: pkg.version,
  policy: 'normal year; current day; fixLeap=false; default algorithm; only shared star subset', cases }, null, 2)}\n`);
console.log(JSON.stringify({ cases: cases.length, destination }));
