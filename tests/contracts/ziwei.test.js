'use strict';

const fs = require('fs');
const path = require('path');
const { REDLINES, disclaimerFor } = require('../../skills/_shared/safety');
const { analyze } = require('../../skills/ziwei/lib/analyze');

const ROOT = path.resolve(__dirname, '../..');
const skillPath = path.join(ROOT, 'skills', 'ziwei');
const read = relative => fs.readFileSync(path.join(skillPath, relative), 'utf8');

describe('ziwei skill contract', () => {
  test('frontmatter and routing boundary are explicit', () => {
    const docs = read('SKILL.md');
    expect(docs).toMatch(/^name: ziwei/m);
    expect(docs).toMatch(/紫微斗数/);
    expect(docs).toMatch(/birthDate|出生日期/);
    expect(docs).toMatch(/不要.*八字|bazi/);
    expect(docs).toMatch(/禁止.*心算|不得心算/);
  });

  test('methodology documents reusable facts and evidence chain', () => {
    const docs = read('methodology.md');
    ['命宫', '身宫', '五行局', '十四主星', '四化', '大限', '三方四正'].forEach(term => {
      expect(`${docs}${read('SKILL.md')}`).toContain(term);
    });
  });

  test('runtime report uses shared command and safety contract', () => {
    const docs = read('SKILL.md');
    expect(docs).toContain('scripts/calculate.js');
    expect(read('lib/analyze.js')).toContain("disclaimerFor('命理'");
    disclaimerFor('命理').forEach(line => expect(read('lib/analyze.js')).not.toContain(line));
    REDLINES.命理.forEach(line => expect(docs).not.toContain(line));
  });

  test('ready report exposes stable calculation evidence', () => {
    const report = analyze({
      birthDate: '1990-01-01',
      birthTime: '12:00',
      longitude: 121.47,
      utcOffsetMinutes: 480,
      gender: 'male',
    });
    expect(report.status).toBe('ready');
    expect(report.supplement).toEqual(expect.objectContaining({
      skill: 'ziwei',
      calculation: expect.objectContaining({ 宫位: expect.any(Array), 三方四正: expect.any(Object) }),
    }));
    expect(report.边界.join('')).toMatch(/传统术数|命盘/);
  });
});
