# lunar-javascript（内联副本）

| | |
|---|---|
| 版本 | 1.7.7 |
| 来源 | https://www.npmjs.com/package/lunar-javascript |
| 上游仓库 | https://github.com/6tail/lunar-javascript |
| 上游 gitHead | `eecd5d12c8221b82ce574dc2bad2d7aefcb46e56` |
| npm tarball shasum | `2c7a359f2ffc414ce2b0214f59148ff7a823851f` |
| npm integrity | `sha512-u/KYiwPIBo/0bT+WWfU7qO1d+aqeB90Tuy4ErXenr2Gam0QcWeezUvtiOIyXR7HbVnW2I1DKfU0NBvzMZhbVQw==` |
| 协议 | MIT（Copyright (c) 2018 6tail，见同目录 LICENSE） |
| 传递依赖 | 无 |

以上发布元数据于 2026-08-11 通过 `npm view lunar-javascript@1.7.7 version dist.shasum dist.integrity gitHead --json` 实测取得。

## 内联文件指纹

| 文件 | SHA-256 |
|---|---|
| LICENSE | `d9210caf1844dcf410095cea464b79800aad30dbd49df092076b9f0ddc015404` |
| index.js | `93301dca7b1ba04a96ae8a8410cf02a11016be4b17614d63d298325e976abc35` |
| lunar.js | `9750324bfe1aa63c146f8c72b1143df924466c11c8a5277d7d9225c541a18aaa` |
| package.json | `39b062864077ca2980683db5f209cb78339f74e4d5c1dea77b4a6263da116c02` |

`tests/vendor-provenance.test.js` 会对文件字节重新计算 SHA-256；只改表格不能让被替换的内联代码通过门禁。

## 为什么内联而不是走 npm

这个包是**运行时**依赖 —— `core/calendar/` 的节气、农历、四柱都靠它。

而 agent 装技能包的路径（`claude plugin marketplace add` / 直接 clone）**不会执行 `npm install`**。走 npm 的话，用户装完第一次问八字就会撞 `Cannot find module 'lunar-javascript'`，四个技能里三个当场失效。

内联进来之后，用户机器上只要有 Node 就能跑，不需要 npm、不需要联网。根 `package.json` 里因此没有 `dependencies`，`npm install` 只装开发用的 jest。

## 怎么引用

```js
const lunar = require('../../vendor/lunar-javascript');   // 从 core/calendar/ 出发
```

目录内 `index.js` 是入口，`lunar.js` 是本体，两者均为上游原样文件，**未做任何修改**。

## 怎么升级

```bash
npm pack lunar-javascript@<新版本>
tar -xzf lunar-javascript-<新版本>.tgz
cp package/lunar.js package/index.js package/LICENSE vendor/lunar-javascript/
```

上游 tarball 里的 `package.json` **也要一起拷**（`tests/vendor-provenance.test.js` 用它作为机器可读的版本来源）。然后更新本文件表格里的版本号，跑 `npm test`。

### 升级时会自动拦住你的两道门禁

`tests/vendor-provenance.test.js` 会检查：

- 本文件表格声明的版本 **必须等于** 上游 `package.json` 的 `version` —— 换了库忘改 README 会报红
- npm tarball 的 shasum、integrity、gitHead 与四个内联文件 SHA-256 必须保持锁定
- `LICENSE` 存在且含 6tail 版权声明（MIT 要求）
- 上游包**无传递依赖** —— 这是它能被内联的前提，哪天上游加了依赖就不能再这么内联
- 根 `package.json` 的 `dependencies` **必须为空** —— 防止有人顺手 `npm i` 把运行时依赖加回去
- `core/calendar/` 依赖的关键 API 仍在：`getJieQiTable` / `getYearInGanZhiByLiChun` / `getMonthInGanZhi` / `getDayInGanZhi`
- 四柱抽测：`1990-08-15 10:30` → `庚午 甲申 壬子 乙巳`（升级后算错会立刻暴露）
- `vendor/` 下**不得有 `__tests__/` 或 `tests/`**

**关于上游的 `__tests__/`**：`jest.config.js` 已设 `testPathIgnorePatterns: ['/node_modules/', '/vendor/']`，即使误拷也不会被跑；但上面那条守卫测试仍会报红提醒你删掉。两道保险都在。
