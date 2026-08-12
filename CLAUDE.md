# xuanxue-skills 仓库约定

中国传统术数技能包。当前交付 5 个用户技能，共享经过测试的计算内核 `core/`。

接手工作前先读 [docs/ROADMAP.md](docs/ROADMAP.md)；内容来源与验收基准见 [docs/REFERENCES.md](docs/REFERENCES.md)。

## 架构边界

确定性数据只沿单向依赖流动：

```text
core/ganzhi <- core/calendar <- skills/bazi/lib
                                <- skills/love-marriage/lib
                                <- skills/wealth-career/lib

core/direction     独立方位能力
core/naqi          依赖 core/direction 的确定性方位语义
skills/qimen       依赖 ganzhi + direction，只校验外部 APP / 手工转录局盘
skills/palm        不依赖 core；宿主多模态观察 -> 代码契约验证 -> safe DTO
```

`core` 不依赖 skills。`love-marriage` 和 `wealth-career` 都以 `bazi` + `core/ganzhi` 为必需依赖，以 `qimen` 为可选增强；不重复排盘、不自行起奇门局。宿主负责图像观察；代码不能声称看图或识别掌纹。

## 三条硬约定

### 1. 有唯一正确答案的计算必须走 `core/`

排盘、大运起运、节气分界、真太阳时、干支关系、二十四山、九宫、纳气规则和磁偏角都有可复算答案，禁止在 skill 的提示文本里让模型心算。

模型的职责是解释与判断：旺衰、格局、喜用、命理结构的现实核验、掌纹象意及外部奇门盘的审慎判读。判断标准是两个懂行的人对同一输入是否应得到完全相同的结果。

### 2. `core/` 和运行时行为改动必须先有失败测试

固定顺序：写失败测试 -> 实跑确认因缺功能失败 -> 最小实现 -> 定向绿灯 -> 全量回归。未测试或测试失败的 `.js` 改动禁止提交或推送。

### 3. 流派分歧全部呈现

日柱换日点、起运折算、旺衰、格局和喜用神等存在流派差异时，全部列出算法、依据和结果，不挑一派冒充唯一答案。设计决策也遵循同样原则；真正影响实现且没有裁决的事项向需求方提问。

当前 C1（纳气对齐是平行还是叠合）和 C2（2044 边界机制）仅阻塞未来风水技能，不影响已经交付的五个技能。

## 当前目录职责

| 目录 | 职责 |
|---|---|
| `core/ganzhi/` | 六十甲子、藏干、刑冲合害会、纳音、十神及领域确定性信号；纯符号代数 |
| `core/calendar/` | 民用时间、公历农历、节气、真太阳时、四柱、大运与流年 |
| `core/direction/` | 二十四山、三元龙、洛书九宫、飞星与磁偏角 |
| `core/naqi/` | 依赖 `core/direction`；提供气位水位、房屋中心和龙虎水灶等确定性空间规则 |
| `skills/bazi/` | 出生资料的综合命理；调用 `core/calendar`，领域问题只给概览 |
| `skills/love-marriage/` | 必需依赖 `bazi` + `core/ganzhi`；外部 `qimen` 仅可选增强 |
| `skills/wealth-career/` | 必需依赖 `bazi` + `core/ganzhi`；外部 `qimen` 仅可选增强 |
| `skills/qimen/` | 依赖 `core/ganzhi` + `core/direction`；外部局盘结构校验与判读，不自行起局 |
| `skills/palm/` | 不依赖 `core`；宿主多模态观察的质量、覆盖、证据和安全输出契约 |
| `skills/_shared/` | 已交付技能共用的冻结安全常量；不是用户技能 |
| `vendor/` | 内联第三方库原样副本及许可证、溯源说明 |
| `docs/` | 规则来源、测试案例、路线图、长期技能设计与实施计划 |

长期设计中的 `skills/fengshui-naqi/`、`skills/divination/`、`skills/_shared/miexiang.md` 和 `core/wanwu/` 均为 **future / 未交付**，不得写进当前 manifest 或当前使用示例，也不得把不存在的接口描述为可调用。

## 路由约定

- 完整出生资料 + 综合命理 -> `bazi`。
- 完整出生资料 + 明确婚恋 -> `love-marriage`。
- 完整出生资料 + 明确事业财运 -> `wealth-career`。
- 同时深入询问事业与婚恋 -> `bazi` 先给概览，再由用户选择单领域深入。
- 手掌图片或纯图片请求 -> `palm`。
- 外部奇门 APP 局盘 + 看局 -> `qimen`。
- 婚恋或事业问题附奇门盘仍进入领域技能，奇门只作可选增强。
- 用户显式点名覆盖自动路由，但不覆盖输入要求、证据契约和安全边界。
- 信息不足时一次性问全缺项后停止，不猜测、不补造。

## 依赖

运行时零外部依赖。用户安装技能包不会执行 `npm install`，运行时用到的第三方库必须内联到 `vendor/` 并保留许可证。运行时代码一律用仓内相对路径，例如 `require('../../vendor/lunar-javascript')`；不得向 `package.json` 添加 `dependencies`。

全仓库单一 `package.json`，不用 npm workspaces。Node.js 最低版本为 18。

## 测试门禁

```bash
npm test -- --runInBand
node scripts/e2e-smoke.js
```

发布前还要在不含 `node_modules` 的 `git archive` 树中运行 smoke，检查全部 `.js` 语法、运行时依赖树、JSON manifest 严格校验及 `git diff --check`。

## Git 约定

- 默认直接在 `main` 工作；新分支必须先取得用户同意，且只能用 `dev-c/` 前缀。
- 提交身份只用 `konglong`，邮箱留空。
- commit message、代码注释和 PR 文本不得出现任何工具标识或协作署名。
- 每个逻辑任务通过定向和全量测试后提交；按用户授权决定是否立即 pull/rebase 与 push。
