'use strict';

const LEGACY_PUBLISHED_SKILLS = Object.freeze([
  'bazi',
  'palm',
  'qimen',
  'love-marriage',
  'wealth-career',
]);

const ZIWEI_RELEASE_SKILLS = Object.freeze([...LEGACY_PUBLISHED_SKILLS, 'ziwei']);
const PUBLISHED_SKILLS = ZIWEI_RELEASE_SKILLS;

// Explicit release history; 0.1.1 is retained for installer migration fixtures.
const PUBLISHED_SKILLS_BY_VERSION = Object.freeze({
  '0.1.0': LEGACY_PUBLISHED_SKILLS,
  '0.1.1': LEGACY_PUBLISHED_SKILLS,
  '0.2.0': LEGACY_PUBLISHED_SKILLS,
  '0.2.1': LEGACY_PUBLISHED_SKILLS,
  '0.3.0': ZIWEI_RELEASE_SKILLS,
  '0.3.1': ZIWEI_RELEASE_SKILLS,
});

const TARGETS = Object.freeze([
  'claude-code',
  'codex',
  'cursor',
  'trae',
  'workbuddy',
]);

const SCOPES = Object.freeze(['user', 'project']);
const SUPPORT_STATES = Object.freeze(['verified', 'experimental', 'unverified']);

const SKILLS_ROOTS = Object.freeze({
  'claude-code': Object.freeze({ user: ['.claude', 'skills'], project: ['.claude', 'skills'] }),
  codex: Object.freeze({ user: ['.agents', 'skills'], project: ['.agents', 'skills'] }),
  cursor: Object.freeze({ user: ['.cursor', 'skills'], project: ['.agents', 'skills'] }),
  trae: Object.freeze({ user: ['.trae', 'skills'], project: ['.trae', 'skills'] }),
  workbuddy: Object.freeze({ user: ['.workbuddy', 'skills'], project: ['.workbuddy', 'skills'] }),
});

const COMMANDS = Object.freeze(['install', 'verify', 'uninstall']);
const MANIFEST_SCHEMA_VERSION = 1;
const PROJECT_NAME = 'xuanxue-skills';
const INSTALL_LOCK_TIMEOUT_MS = 2000;
const STALE_INSTALL_ARTIFACT_MS = 10 * 60 * 1000;
const RUNTIME_ENTRIES = Object.freeze([
  'core',
  'vendor',
  'skills',
  'LICENSE',
  'VERSION',
  'package.json',
]);
const BAZI_PROBE_INPUT = Object.freeze({
  birthDate: '1955-02-24',
  birthTime: '19:15',
  longitude: -122.4194,
  utcOffsetMinutes: -480,
  gender: 'male',
  targetYear: 2026,
});
const BAZI_PROBE_PILLARS = Object.freeze({
  年: '乙未',
  月: '戊寅',
  日: '丙辰',
  时: '丁酉',
});

const ZIWEI_PROBE_INPUT = Object.freeze({
  birthDate: '2024-02-10',
  birthTime: '00:30',
  longitude: 120,
  utcOffsetMinutes: 480,
  gender: 'male',
  options: Object.freeze({ useTrueSolar: false }),
});
const ZIWEI_PROBE_EXPECTED = Object.freeze({
  lunarMonth: 1,
  lunarDay: 1,
  timeBranch: '子',
  yearPillar: '甲辰',
  lifePalace: '寅',
  bodyPalace: '寅',
  lifePalaceStem: '丙',
  fiveElementsClass: '火六局',
  fiveElementsValue: 6,
  useTrueSolar: false,
});

module.exports = {
  BAZI_PROBE_INPUT,
  BAZI_PROBE_PILLARS,
  COMMANDS,
  MANIFEST_SCHEMA_VERSION,
  INSTALL_LOCK_TIMEOUT_MS,
  PUBLISHED_SKILLS,
  PUBLISHED_SKILLS_BY_VERSION,
  PROJECT_NAME,
  RUNTIME_ENTRIES,
  SCOPES,
  SKILLS_ROOTS,
  SUPPORT_STATES,
  STALE_INSTALL_ARTIFACT_MS,
  TARGETS,
  ZIWEI_PROBE_INPUT,
  ZIWEI_PROBE_EXPECTED,
};
