'use strict';

const PUBLIC_ROOT_FILES = Object.freeze([
  'LICENSE', 'VERSION', 'README.md', 'README_EN.md', 'package.json', 'package-lock.json',
  'plugin.json', 'jest.config.js', '.gitignore', '.npmignore',
]);
const PUBLIC_ROOT_DIRECTORIES = Object.freeze(['core', 'skills', 'vendor', 'scripts', 'tests', 'docs', '.github', '.claude-plugin']);
const PRIVATE_SEGMENTS = Object.freeze(['.git', 'node_modules', 'coverage', 'public-release']);
const PRIVATE_PREFIXES = Object.freeze(['.research-', '.audit-']);
const PACKAGE_ENTRIES = Object.freeze([
  'core/', 'skills/', 'vendor/', 'scripts/agent-install/', '.claude-plugin/',
  'LICENSE', 'VERSION', 'plugin.json', 'README.md', 'README_EN.md', 'docs/CONTENT-POLICY.md', 'docs/RELEASE-AUDIT.md',
  '!**/__tests__/**', '!**/tests/**', '!**/.research-*/**', '!**/.audit-*/**',
  '!**/.git/**', '!**/node_modules/**', '!**/coverage/**',
]);
function isPrivatePath(relative) {
  return relative.replaceAll('\\', '/').split('/').some(segment =>
    PRIVATE_SEGMENTS.includes(segment.toLowerCase())
    || PRIVATE_PREFIXES.some(prefix => segment.toLowerCase().startsWith(prefix)));
}
function isApprovedRoot(relative) {
  const segments = relative.split('/');
  return segments.length === 1 ? PUBLIC_ROOT_FILES.includes(relative)
    : PUBLIC_ROOT_DIRECTORIES.includes(segments[0]);
}
module.exports = { PUBLIC_ROOT_FILES, PUBLIC_ROOT_DIRECTORIES, PRIVATE_SEGMENTS, PRIVATE_PREFIXES,
  PACKAGE_ENTRIES, isPrivatePath, isApprovedRoot };
