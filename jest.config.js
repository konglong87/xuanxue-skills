module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js'],
  // vendor/ 是第三方库的原样副本。上游 tarball 自带 __tests__/，
  // 若升级时误拷进来，会被上面的 testMatch 收走并混进 npm test。
  // .claude/worktrees/ 是并行开发时 agent 各自的 git worktree，位于仓库内。
  // 不排除的话，根目录跑 npm test 会连带扫进别人进行中的测试。
  testPathIgnorePatterns: ['/node_modules/', '/vendor/', '/\\.claude/'],
  collectCoverageFrom: ['core/**/*.js', 'skills/**/lib/**/*.js'],
};
