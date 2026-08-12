'use strict';

const fs = require('fs');
const path = require('path');
const {
  MANIFEST_SCHEMA_VERSION,
  PROJECT_NAME,
  PUBLISHED_SKILLS,
  SCOPES,
  TARGETS,
} = require('./constants');
const { resolveRuntimeRoot, resolveSkillsRoot } = require('./paths');

function installStateRoot({ scope, homeDir, projectDir }) {
  if (!SCOPES.includes(scope)) throw new Error(`未知 scope: ${scope}`);
  const base = scope === 'user' ? homeDir : projectDir;
  if (typeof base !== 'string' || base.length === 0) {
    throw new Error(`${scope === 'user' ? 'homeDir' : 'projectDir'} 不能为空`);
  }
  return path.join(base, '.xuanxue-skills');
}

function manifestPath(options) {
  if (!TARGETS.includes(options.target)) throw new Error(`未知 agent: ${options.target}`);
  return path.join(
    installStateRoot(options),
    'manifests',
    `${options.target}-${options.scope}.json`,
  );
}

function validateLink(link) {
  if (!link || typeof link !== 'object') throw new Error('manifest link 必须是对象');
  if (!PUBLISHED_SKILLS.includes(link.skill)) throw new Error(`manifest skill 无效: ${link.skill}`);
  if (!path.isAbsolute(link.path)) throw new Error('manifest link path 必须是绝对路径');
  if (!path.isAbsolute(link.target)) throw new Error('manifest link target 必须是绝对路径');
}

function validateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('manifest 必须是对象');
  }
  if (value.schemaVersion !== MANIFEST_SCHEMA_VERSION) throw new Error('manifest schemaVersion 不受支持');
  if (value.project !== PROJECT_NAME) throw new Error('manifest project 不匹配');
  if (typeof value.version !== 'string' || value.version.length === 0) throw new Error('manifest version 无效');
  if (!TARGETS.includes(value.target)) throw new Error('manifest target 无效');
  if (!SCOPES.includes(value.scope)) throw new Error('manifest scope 无效');
  if (!path.isAbsolute(value.repoRoot)) throw new Error('manifest repoRoot 必须是绝对路径');
  if (!Array.isArray(value.links) || value.links.length !== PUBLISHED_SKILLS.length) {
    throw new Error(`manifest 必须记录 ${PUBLISHED_SKILLS.length} 个链接`);
  }
  value.links.forEach(validateLink);
  if (new Set(value.links.map(link => link.skill)).size !== PUBLISHED_SKILLS.length) {
    throw new Error('manifest skill 不得重复');
  }
  return value;
}

function assertManifestInstallation(manifest, options) {
  validateManifest(manifest);
  if (manifest.target !== options.target || manifest.scope !== options.scope) {
    throw new Error('manifest 与请求的 agent/scope 不匹配');
  }

  const runtimeRoot = resolveRuntimeRoot({ ...options, version: manifest.version });
  const skillsRoot = resolveSkillsRoot(options);
  const expected = new Map(PUBLISHED_SKILLS.map(skill => [skill, {
    path: path.join(skillsRoot, skill),
    target: path.join(runtimeRoot, 'skills', skill),
  }]));
  const pathsMatch = manifest.repoRoot === runtimeRoot && manifest.links.every(link => {
    const derived = expected.get(link.skill);
    return derived && link.path === derived.path && link.target === derived.target;
  });
  if (!pathsMatch) throw new Error('manifest 安装路径不匹配');
  return manifest;
}

function readManifest(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return validateManifest(parsed);
}

function listManifestRecords(options) {
  const directory = path.join(installStateRoot(options), 'manifests');
  try {
    return fs.readdirSync(directory)
      .filter(name => name.endsWith('.json'))
      .sort()
      .map(name => {
        const filePath = path.join(directory, name);
        return { filePath, manifest: readManifest(filePath) };
      });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writeManifestAtomic(filePath, manifest) {
  validateManifest(manifest);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    fs.renameSync(temporary, filePath);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

module.exports = {
  installStateRoot,
  assertManifestInstallation,
  listManifestRecords,
  manifestPath,
  readManifest,
  validateManifest,
  writeManifestAtomic,
};
