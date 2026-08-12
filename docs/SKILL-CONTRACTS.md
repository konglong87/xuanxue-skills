# 技能包并行开发契约

> **这份文档的唯一目的：让 Task 4~7 四路并行时不产生语义漂移和文件冲突。**
> 它冻结的是**跨任务共享的部分**（骨架、触发边界、措辞、接口）。各技能自己的判读方法论不在这里，由各自 `methodology.md` 承担。
>
> 契约在并行开工前一次性冻结。**并行期内任何一路都不得单方面修改本文档** —— 需要改就停下来提出，由集成方裁决后统一更新。

## 一 · 并行期禁改文件

这些文件被多路共享或由集成方收口，并行期内**只读**：

| 文件 | 归属 |
|---|---|
| `docs/SKILL-CONTRACTS.md`（本文） | 集成方 |
| `docs/ROADMAP.md` | 集成方统一收口，各路不要改进度 |
| `docs/REFERENCES.md`、`docs/SKILL-TAXONOMY.md` | 只读资料，不改 |
| `skills/_shared/safety.js` | 集成方，各路只 require |
| `skills/bazi/**` | 已交付，Task 6/7 只读复用 |
| `core/**`（除 Task 6 的 `core/ganzhi/domains.js`） | 只读 |
| `README.md`、`plugin.json`、`.claude-plugin/marketplace.json` | Task 8 |
| `package.json` | 无人需改（运行时零依赖不变） |

根 `package-lock.json` 已纳入版本控制，是开发依赖的可复现锁文件，**必须保留并随 `package.json` 的依赖变更同步提交**。运行时零依赖由根 `package.json`、vendor 门禁和离线发布树共同保证，不以删除 lockfile 代替。

## 二 · 技能包固定骨架

每个技能一律按此结构落盘，不增不减目录层级：

```
skills/<name>/
  SKILL.md              触发 frontmatter + 执行流程 + 路由边界 + 禁止事项
  methodology.md        判读方法论：只给判断标准、操作步骤、推演链条，不给标准答案
  templates/report.md   报告骨架，章节名与 lib 导出的 REPORT_SECTIONS 逐字一致
  lib/<主模块>.js       输入校验、组装 core 输出、报告契约
  __tests__/            单元测试
tests/contracts/<name>.test.js   文档契约测试（SKILL.md / methodology.md / report.md 的文本约束）
```

**契约测试一律独立成文件**，路径为 `tests/contracts/<name>.test.js`，`ROOT` 取 `path.join(__dirname, '..', '..')`。不要往别人的契约测试里加 `describe`。参照已交付的 [tests/contracts/bazi.test.js](../tests/contracts/bazi.test.js)。

## 三 · 路由：四技能互斥边界

`description` 走三段式，缺一不可：**输入形态 + 口语措辞 + 反向排除**。Task 8 会加路由测试逐条校验。

已交付的 `bazi` 是范式：

```
Use when the user supplies or wants to supply a 出生日期 and 出生时间 for a general
生辰八字 reading, including 看八字 or 算命; not for 手相 photos, 风水, 占卜, or
requests focused specifically on 婚恋, 事业, or 财运.
```

四路各自的边界**已划定，不得越界扩张触发词**：

| 技能 | 输入形态 | 必须命中的口语 | 必须反向排除 |
|---|---|---|---|
| `palm` | 手掌照片（掌心朝上），最好左右两张 | 看手相、掌纹、生命线、感情线、事业线 | 出生日期八字、面相、风水、占卜 |
| `qimen` | 奇门 APP 已起好的局盘截图或转录文本 | 奇门遁甲、局盘、九宫盘、看局 | **起局本身**（不自研）、只有出生日期、手相、风水 |
| `love-marriage` | 出生资料 **＋ 明确的婚恋问题**；可选叠加奇门局盘 | 姻缘、什么时候结婚、正缘、感情、复合、配偶、桃花 | 综合命理概览（转 `bazi`）、事业财运、手相 |
| `wealth-career` | 出生资料 **＋ 明确的事业或财运问题**；可选叠加奇门局盘 | 事业、跳槽、创业、财运、求财、升职、生意 | 综合命理概览（转 `bazi`）、婚恋、手相 |

**歧义消解（四路必须写进各自 SKILL.md 的「路由边界」节，口径一致）：**

1. 只给出生资料、没有具体领域问题 → `bazi`，不抢。
2. 给出生资料并明确问某一领域 → 对应领域技能。
3. 同时明确问事业与婚恋两个领域 → `bazi` 出概览，并说明可分别转两个领域技能深入。
4. 用户显式点名技能 → 覆盖自动判断。
5. 信息不足 → 一次性追问全部缺失项后停止，不猜测、不用常识补造。

## 四 · 共用措辞：唯一来源

免责声明、红线、三段式规则**一律从 [skills/_shared/safety.js](../skills/_shared/safety.js) 引入**，禁止各技能自写同义版本 —— 否则同一条红线会出现四套宽严不一的表述，而测试抓不到。

```js
const { DISCLAIMER_BASE, EVIDENCE_RULES, FORBIDDEN_CLAIMS, REDLINES, disclaimerFor }
  = require('../../_shared/safety');
```

各技能取用领域：

| 技能 | 调用 |
|---|---|
| `palm` | `disclaimerFor('健康')` |
| `qimen` | `disclaimerFor('奇门')` |
| `love-marriage` | `disclaimerFor('婚恋')` |
| `wealth-career` | `disclaimerFor('财经')` |

`templates/report.md` 的免责声明段落文字必须与 `disclaimerFor(...)` 的返回逐条对应；契约测试要能校验出不一致。

判读表达统一走 `EVIDENCE_RULES` 的三段式：**算出／看到的 → 依据 → 结论（可核验＋可行动）**。证据不足写「不足以判断」，不得补造。

## 五 · 跨任务接口冻结

### 5.1 Task 6 / 7 复用 `bazi`（只读，不重复排盘）

```js
const { analyze } = require('../../bazi/lib/analyze');
```

`analyze(input, { currentYear })` 的返回形态已由 [skills/bazi/__tests__/analyze.test.js](../skills/bazi/__tests__/analyze.test.js) 锁定：

- `status`: `'needs_input'` → 带 `missing` 与 `questions`；`'ready'` → 带下列字段
- `input`：含 `targetYearSource`（`'user'` 或 `'skill-current-year'`）
- `calculation`：`core/calendar.baziChart` 的完整命盘（`四柱结果` / `命盘详情` / `起运大运` / `目标流年`）
- `alternateCalculation`：换日导致日柱不同时为另一派完整命盘，否则 `null`
- `analysisContext`：依据链、报告契约、流派方法、表达规则

领域技能在此之上**只做领域信号提取与领域报告契约**，不得重排四柱、不得改写 `analysisContext` 里已有的判读边界。确定性的领域信号（配偶宫、桃花、财官印食伤比劫结构等）落在 `core/ganzhi/domains.js`（Task 6 建，Task 7 复用其中通用部分）。

### 5.2 Task 5 交付、Task 6 / 7 消费的奇门局盘契约

`qimen` 只做**外部 APP 局盘的标准化与判读**，不实现起局（决策 #8 / C4）。Task 6/7 的奇门增强按此契约调用，**Task 5 必须实现成这个形状**：

```js
const { normalizeChart } = require('../../qimen/lib/chart');
const { chart, safeChart, errors } = normalizeChart(transcribed);
```

`chart` 是保留外部原词的本地审计 DTO，不进入模型上下文或报告；`safeChart` 只含确认枚举、存在标志和稳定 `provenanceRef`。Task 6/7 只消费 `safeChart`，不得读取审计层的来源名称、`raw`、`source` 或 `school` 自由文本。

局盘输入的字段约束：

| 字段 | 约束 |
|---|---|
| 九宫 | 八方 + 中宫共 9 个，方向唯一且完整，缺一即进 `errors` |
| 每宫 `天盘干` / `地盘干` | 取值受十天干常量约束 |
| 每宫 `八门` | 开、休、生、伤、杜、景、死、惊 |
| 每宫 `九星` | 天蓬、天任、天冲、天辅、天英、天芮、天柱、天心 + 天禽 |
| 每宫 `八神` | 值符、腾蛇、太阴、六合、白虎、玄武、九地、九天 |
| 标记 | 击刑、入墓、门迫、空亡等按宫结构化保留 |
| 盘级字段 | 月令、值符、值使 |

**缺字段不猜**，一律进 `errors` 并要求用户补录。Task 6/7 在 `safeChart` 为 `null` 或 `errors` 非空时只输出八字侧概览，不得凭空补造局盘。

**并列口径（Task 5 不得静默择一）**：六害命名在资料内部不一致 —— [REFERENCES.md](REFERENCES.md) 4.1 写「**门破**」，本方案 Task 5 与 4.4 写「**门迫**」。两个名称分别保留；原始术语和来源只进入审计 `chart`，`safeChart` 与报告只保留各自确认枚举和安全溯源引用。

## 六 · 各路的提交约定

固定闭环，一步不省：

```
新增失败测试 → 确认因缺功能失败 → 最小实现 → 定向测试 → npm test → 提交
```

- 每个 worktree 需各自 `npm install`（jest 是 devDependency，worktree 不共享 `node_modules`）
- 提交身份只用 `konglong`、邮箱留空；message、注释、PR body 中不得出现任何 AI 工具标识
- 代码（`.js`）测试未通过禁止提交；纯文档改动可直接提交
- **各路只提交到自己的分支，不要 push 到 `main`，不要 rebase 别人的分支** —— 合并顺序由集成方统一决定
- 真机验收（`claude -p --plugin-dir .`）目前受登录阻塞：保留命令与真实错误写入 [TEST-CASES.md](TEST-CASES.md) 的对应小节，**不得伪造模型输出**
