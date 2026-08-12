const path = require('path');

const {
  PUBLISHED_SKILLS,
  SCOPES,
  SUPPORT_STATES,
  TARGETS,
} = require('../constants');
const {
  assertSupportedNode,
  directoryLinkType,
  parseCliArgs,
  resolveRuntimeRoot,
  resolveSkillsRoot,
} = require('../paths');

const HOME = path.join(path.sep, 'tmp', 'home with spaces');
const PROJECT = path.join(path.sep, 'tmp', 'project with spaces');

describe('agent installer constants', () => {
  test('publishes exactly five frozen skills', () => {
    expect(PUBLISHED_SKILLS).toEqual([
      'bazi',
      'palm',
      'qimen',
      'love-marriage',
      'wealth-career',
    ]);
    expect(Object.isFrozen(PUBLISHED_SKILLS)).toBe(true);
  });

  test('targets, scopes and support states are frozen', () => {
    expect(TARGETS).toEqual(['claude-code', 'codex', 'cursor', 'trae', 'workbuddy']);
    expect(SCOPES).toEqual(['user', 'project']);
    expect(SUPPORT_STATES).toEqual(['verified', 'experimental', 'unverified']);
    [TARGETS, SCOPES, SUPPORT_STATES].forEach(value => expect(Object.isFrozen(value)).toBe(true));
  });
});

describe('host path mapping', () => {
  test('uses junctions on Windows and directory symlinks elsewhere', () => {
    expect(directoryLinkType('win32')).toBe('junction');
    expect(directoryLinkType('darwin')).toBe('dir');
    expect(directoryLinkType('linux')).toBe('dir');
  });

  test.each([
    ['claude-code', 'user', ['.claude', 'skills']],
    ['codex', 'user', ['.agents', 'skills']],
    ['cursor', 'user', ['.cursor', 'skills']],
    ['trae', 'user', ['.trae', 'skills']],
    ['workbuddy', 'user', ['.workbuddy', 'skills']],
    ['claude-code', 'project', ['.claude', 'skills']],
    ['codex', 'project', ['.agents', 'skills']],
    ['cursor', 'project', ['.agents', 'skills']],
    ['trae', 'project', ['.trae', 'skills']],
    ['workbuddy', 'project', ['.workbuddy', 'skills']],
  ])('%s %s resolves to its evidence-backed root', (target, scope, suffix) => {
    const base = scope === 'user' ? HOME : PROJECT;
    expect(resolveSkillsRoot({ target, scope, homeDir: HOME, projectDir: PROJECT }))
      .toBe(path.join(base, ...suffix));
  });

  test.each(['user', 'project'])('%s runtime root is stable and versioned', scope => {
    const base = scope === 'user' ? HOME : PROJECT;
    expect(resolveRuntimeRoot({ scope, homeDir: HOME, projectDir: PROJECT, version: '0.1.0' }))
      .toBe(path.join(base, '.xuanxue-skills', 'runtime', 'v0.1.0'));
  });

  test.each([
    [{ target: 'unknown', scope: 'user' }, /未知 agent/],
    [{ target: 'codex', scope: 'machine' }, /未知 scope/],
    [{ target: 'codex', scope: 'user', homeDir: '' }, /homeDir/],
    [{ target: 'codex', scope: 'project', projectDir: '' }, /projectDir/],
  ])('rejects invalid options %#', (partial, message) => {
    expect(() => resolveSkillsRoot({ homeDir: HOME, projectDir: PROJECT, ...partial }))
      .toThrow(message);
  });
});

describe('CLI parsing', () => {
  test.each([
    ['18.0.0', 18],
    ['22.14.0', 22],
  ])('accepts supported Node %s', (version, expected) => {
    expect(assertSupportedNode(version)).toBe(expected);
  });

  test.each(['17.9.1', 'v16.20.2', 'invalid'])('rejects unsupported Node %s', version => {
    expect(() => assertSupportedNode(version)).toThrow(/Node\.js 18/);
  });

  test('parses command, agent and scope', () => {
    expect(parseCliArgs(['install', '--agent', 'codex', '--scope', 'user'])).toEqual({
      command: 'install',
      target: 'codex',
      scope: 'user',
      help: false,
    });
  });

  test.each([
    [[], /缺少命令/],
    [['deploy'], /未知命令/],
    [['install', '--agent'], /--agent 缺少值/],
    [['install', '--agent', 'codex'], /--scope/],
    [['install', '--agent', 'codex', '--scope', 'user', '--force'], /未知参数/],
  ])('rejects invalid argv %#', (argv, message) => {
    expect(() => parseCliArgs(argv)).toThrow(message);
  });

  test('supports help without agent and scope', () => {
    expect(parseCliArgs(['--help'])).toEqual({ help: true });
  });
});
