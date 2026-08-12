# 真实案例与测试口径

## 检索范围

- 联网检索日期：2026-08-11。
- 出生数据主来源统一使用 Astro-Databank 对应人物页；Rodden 评级用于说明出生时间证据等级。
- `oracleUrl` 是独立八字排盘或案例页，只用于交叉核对四柱，不反向证明出生时间可靠。
- 自动测试只断言可复算的民用时间字段、标准经线和四柱干支。旺衰、格局、喜用神与人生解释存在流派差异，不进入 fixture。

## 收录案例

| 人物 | Astro-Databank 来源 | 可靠度 | 民用时间与时间制 | 独立 oracle | 可自动断言 |
|---|---|---|---|---|---|
| Barack Obama | [Obama, Barack](https://www.astro.com/astro-databank/Obama,_Barack) | Rodden AA；出生证明/记录在手 | 1961-08-04 19:24，Honolulu，AHST UTC-10，无 DST | [Bazi Calculator 精确盘](https://bazi-calculator.com/?licz=1&n=Obama%2C+Barack&h=19%3A24&d=4&m=08&y=1961&l=-157.52&src=1&g=-10&ds=&s=&rr=AA) | 墙钟字段、标准经线 -150°、辛丑/乙未/己巳/癸酉 |
| Steve Jobs | [Jobs, Steve](https://www.astro.com/astro-databank/Jobs,_Steve) | Rodden AA；出生证明 | 1955-02-24 19:15，San Francisco，PST UTC-8，2 月无 DST | [Bazi Calculator 精确盘](https://bazi-calculator.com/?licz=1&n=Jobs%2C+Steve&h=19%3A15&d=24&m=02&y=1955&l=-122.25&src=1&g=-8&ds=&s=&rr=AA) | 墙钟字段、标准经线 -120°、乙未/戊寅/丙辰/丁酉 |
| Albert Einstein | [Einstein, Albert](https://www.astro.com/astro-databank/Einstein,_Albert) | Rodden AA；出生证明/记录在手 | 1879-03-14 11:30，Ulm，LMT | [参天案例页](https://www.cantian.ai/cases/detail/en/albert_einstein.html) | 墙钟字段、显式标准经线 10°、己卯/丁卯/丙申/甲午 |

完整机器可读数据见 [`tests/fixtures/celebrity-bazi.json`](../tests/fixtures/celebrity-bazi.json)。

### Steve Jobs 起运精度差异

外部 Bazi Calculator 页面按分钟输入/展示时，sect 2 起运记录为 `6 年 7 月 12 日 22 时`。本仓先把民用时间校正为带秒的真太阳时 `1955-02-24 18:51:28`，再按上一节（立春 `1955-02-04 22:17:36`）到出生时刻的精确有向秒差四舍五入到整分钟，结果为 `6 年 7 月 12 日 20 时`。这是输入精度与取整政策不同产生的两个结果，不能声称锁定同一 oracle；外部页面在 fixture 中只交叉核对四柱。

## 海外时间风险

1. 出生时间是出生地的民用墙钟字段，不能先拼成无 offset 的 ISO 字符串再交给 `new Date(string)`；宿主时区会改变日期或小时。
2. `utcOffsetMinutes` 必须是出生当日的法定 offset，不是出生地今天的 offset。DST 会使标准经线变化 15°，足以改变真太阳时和时柱。
3. 历史 LMT 不能伪装成现代时区。Einstein 的 `utcOffsetMinutes` 明确为 `null`，复算时用记录中的 LMT 经线 `standardMeridian: 10`；换算口径改变时必须重新审查时柱。
4. 海外排盘工具常默认北京时间 120°、当前时区或自动 DST。比较 oracle 前必须先对齐墙钟、历史 offset、真太阳时和换日规则。

## 未收录：Bill Gates

公开二手资料同时出现 20:58、22:00 等出生时间，且本次检索未取得可核验的原始出生记录。分钟差异虽然可能不改变部分排盘口径下的时支，但不能据此把精确时柱当成事实。因此 Bill Gates 不进入精确时柱 fixture；在获得出生证明或同等级记录前，只能使用不依赖出生时刻的安全断言。

## `bazi` 外部技能基线

2026-08-11 在创建 `skills/bazi/SKILL.md` 前，使用 `claude -p --plugin-dir .` 分别执行三组压力场景：

1. **完整出生资料**：要求根据完整出生日期、时间、出生地经度、时区、性别和目标年份给出综合报告。
2. **缺少经度与时区**：只给日期、时间和性别，观察是否会猜测真太阳时所需信息。
3. **23:00 附近流派分歧**：提供接近子时的出生时间，观察是否会并列 23:00 与 00:00 两种换日口径。

三次命令均在进入模型调用前返回 `Not logged in · Please run /login`。因此本次基线只确认了外部鉴权阻塞，**没有生成模型结果**，也不能据此声称无技能时出现了某种判读行为。创建技能后用完整出生资料再次调用，仍返回同一登录错误；可执行契约由 Jest 覆盖，登录后的同场景真机复测保留到最终端到端验收。

## `palm` 外部技能基线与图片样本

2026-08-11 在创建 `skills/palm/SKILL.md` 前计划以无图、单手图、双手图三类场景执行 `claude -p --plugin-dir .`。本机 Claude CLI 2.1.227 在进入模型调用前返回 `Not logged in · Please run /login`，因此**没有生成模型结果**；不能据此声称无技能时发生了何种行为，也不能伪称加载技能后的视觉判读通过。

公开样本首选 Wikimedia Commons 的 `Open_Palm_of_the_Left_Hand,_Fingers.jpg`（Eyefive45，CC BY-SA 4.0，4032 × 3024，双掌）。独立联网检索已核对页面资料，但本机访问 Commons 页面、API 和 upload 原图均在 30 秒内超时。备用 Pexels 双掌图（Luis Quintero，Pexels License）已真实下载为 1260 × 840 JPEG，转换为无 EXIF 的 PNG 后经人工视觉检查确认双掌完整、掌心朝上、主要掌纹可辨。图片均不提交仓库；完整来源、许可和隐私处理见 [`tests/fixtures/palm/README.md`](../tests/fixtures/palm/README.md)。

## 五技能最终外部复测

2026-08-12 在 rebase 到当时的 `origin/main@9514e04` 后，使用 Claude CLI 2.1.227 和 `claude -p --plugin-dir .` 实跑五个场景：Steve Jobs 完整出生资料的综合命理、明确婚恋、明确事业财运、事业加婚恋歧义路由，以及 `/tmp/xuanxue-palm-e2e.png` 本地许可双掌图。每条命令都提供了目标年份和领域边界；奇门未提供时明确禁止自行起局。

五条命令均先显示用户级 settings 中一条与本仓无关的 permission rule warning，随后返回 `Not logged in · Please run /login` 并退出 1；没有模型输出。较早的同日复测曾返回 `Failed to authenticate. API Error: 401 Invalid bearer token`，说明本机鉴权状态曾变化；两种真实错误都保留，最新复测状态为未登录。离线路由、脚本协议、安全与领域链路由 569 项 Jest 和 49 项 smoke 覆盖，但不能替代登录后的模型真机验收。

### `ccsd` 外部 Claude Router 复测（2026-08-12）

本机 `ccsd` 不是独立二进制，而是用户 shell 别名：`ccr code --dangerously-skip-permissions`；`ccr status` 实测 Router 在 `127.0.0.1:3456` 运行。为避免把仓库工作区暴露给模型，本轮从 `git archive HEAD` 解包到独立临时目录 `/tmp/xuanxue-ccsd-e2e.hEXpHR`，调用形态为：

```text
zsh -ic "cd /tmp/xuanxue-ccsd-e2e.hEXpHR && ccsd '<prompt>' --plugin-dir /tmp/xuanxue-ccsd-e2e.hEXpHR"
```

最小真实模型探针返回 `REAL_MODEL_OK`；带 `--plugin-dir` 的参数探针返回 `PLUGIN_ARG_OK`，证明 Router 登录态和模型调用链路可用。Steve Jobs 完整出生资料场景也成功生成真实模型报告，报告给出四柱 `乙未 / 戊寅 / 丙辰 / 丁酉`、真太阳时校正，并明确传统文化、安全免责、流派差异和不作确定性断言。

随后分别运行领域场景：`love-marriage` 成功返回婚恋结构、配偶星/桃花/夫妻宫信号、阶段核验、现实沟通建议，并明确不作必婚必离断言、没有外部奇门盘时不自行起局；`wealth-career` 成功返回 `visibleOnly` / `allPositions` 两套十神口径、职业组合、阶段信号、现实核验和行动建议，并明确不保证收益、投资、裁员或跳槽结果。

双领域路由和本地双掌图片场景在同一 Router 上未在等待窗口内返回正文（仅有启动 warning，未形成模型输出），因此不宣称这两个场景真机通过；对应路由、输入校验、safe DTO 和免责声明仍以离线 Jest / smoke 证据为准。原始临时输出未写入仓库。

#### 双领域路由专项复测（2026-08-12）

从当前 `HEAD` 重新归档到独立目录后，双领域路由最小探针成功返回 `BAZI_FIRST_LOVE_WEALTH`，证明模型理解“先 `bazi` 综合、再列 `love-marriage` / `wealth-career` 入口”的路由顺序。

完整短报告也返回了正文和免责声明，但出现确定性计算错误：模型给 Steve Jobs 输出时柱 `戊戌`，而仓库 `core/calendar` 和前述成功的单领域真机案例均锁定为 `丁酉`。因此本次结论是：**路由语义探针通过；完整双领域报告验收失败**。这正是项目要求确定性四柱必须由代码计算、领域技能只读复用 `bazi` 结果的风险证据；不能把模型自行心算的四柱视为通过结果。

#### 计算闸门修复后复测（2026-08-12）

修复 `bazi` / `love-marriage` / `wealth-career` 的技能契约和报告模板后，在新的独立临时副本中再次执行同类短报告，并在提示中要求先执行 `bazi/scripts/calculate.js`、逐字段复制 `calculation`、脚本失败则停止。真实模型返回：

```text
乙未 / 戊寅 / 丙辰 / 丁酉
真太阳时 18:51
```

同时按要求先给 `bazi` 综合概览，再列出 `love-marriage` 和 `wealth-career` 两个后续入口，并保留传统文化、不作必婚必离和收益保证的免责声明。该次修复后双领域场景通过；验收重点是确定性字段与脚本结果一致，不把模型自行推算的替代结果视为通过。

## 多 Agent 安装与真机验收（2026-08-12）

项目自带 npx 安装器在独立临时根目录实跑 Claude Code、Codex、Cursor、Trae、WorkBuddy 的 user/project 两种 scope，共 10 种组合。每种组合均完成 `install -> verify -> uninstall`，固定八字探针返回 `ready` 与 `乙未 / 戊寅 / 丙辰 / 丁酉`。这只证明安装路径、共享运行时与卸载所有权契约，不自动等于宿主已发现技能。

Claude Code 2.1.228 经 `ccsd` 在 npx project-scope 隔离安装目录中真实调用，返回：

```text
DISCOVERED=bazi,love-marriage,palm,qimen,wealth-career; STATUS=ready; PILLARS=乙未/戊寅/丙辰/丁酉
```

结合前述婚恋、事业财运和修复后的双领域真实模型正文，Claude Code 的 install / discovery / runtime 三类证据齐全。Cursor Agent 3.13.21 返回 `Authentication required`，未进入发现；本机 Codex CLI 的 `--version`、`--help` 与 `exec` 均在输出前退出 137；本机未安装 Trae。WorkBuddy v5.3.8 应用包包含 `.workbuddy/skills/` 路径及本地技能导入逻辑，真机可进入“专家·技能·连接器”管理页，但 UI 自动化未能稳定切入技能子页，未向真实用户目录写入测试技能，也未取得宿主调用结果。详细状态以 [`agent-compatibility.json`](agent-compatibility.json) 为准。
