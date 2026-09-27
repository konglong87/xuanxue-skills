'use strict';

const PUBLISHED_SKILLS = Object.freeze([
  'bazi',
  'palm',
  'qimen',
  'love-marriage',
  'wealth-career',
  'ziwei',
]);

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

module.exports = {
  BAZI_PROBE_INPUT,
  BAZI_PROBE_PILLARS,
  COMMANDS,
  MANIFEST_SCHEMA_VERSION,
  INSTALL_LOCK_TIMEOUT_MS,
  PUBLISHED_SKILLS,
  PROJECT_NAME,
  RUNTIME_ENTRIES,
  SCOPES,
  SKILLS_ROOTS,
  SUPPORT_STATES,
  STALE_INSTALL_ARTIFACT_MS,
  TARGETS,
};
