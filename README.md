# xuanxue-skills

[English](README_EN.md) | 当前版本 `v0.1.0`

面向 Claude Code、Codex、Cursor、Trae 与 WorkBuddy 的中国传统术数技能包。确定性排盘由共享代码内核完成，Agent 负责解释、核验与安全表达。

## 为什么不是普通提示词

- **代码计算**：四柱、节气、真太阳时、大运流年、干支关系和方位规则必须调用 `core/`，禁止模型心算替代。
- **流派并列**：换日、起运、旺衰、格局、喜用等分歧同时展示方法、依据与结果，不把一派包装成唯一答案。
- **现实核验**：判读写成用户可验证的倾向与问题，不把象征性解释伪装成已经发生的事实。
- **安全边界**：不保证收益，不断言必婚必离，不作医疗诊断；图片观察与确定性计算各有明确责任边界。

## 能做什么

| 能力 | 状态 | 输入与边界 |
|---|---|---|
| `bazi` 八字综合 | 已开放 | 完整出生日期、时间、经度、出生当日时区与性别；代码排盘，流派并列 |
| `love-marriage` 婚恋情感 | 已开放 | 完整出生资料 + 婚恋问题；不声称必婚、必离或未经证实的他人事实 |
| `wealth-career` 事业财运 | 已开放 | 完整出生资料 + 事业财运问题；不保证收益，不替代职业或投资建议 |
| `palm` 手相 | 已开放 | 清晰左右双手掌心照片；宿主多模态观察，代码验证观察结构与安全输出 |
| `qimen` 外部奇门局盘 | 已开放 | 可信外部 APP 已起局盘截图或逐宫转录；只校验判读，不自行起局 |
| `face-reading` 面相 | 规划中，暂不开放 | **因人脸隐私暂不开放** |
| `fengshui-naqi` 风水纳气 | future | 内核已有部分方位/纳气能力，用户技能受 C1/C2 决策阻塞 |
| `divination` 占卜 | future | 尚未实现，不进入当前发布清单 |

直接描述目标即可：出生资料综合分析进入 `bazi`；明确婚恋进入 `love-marriage`；明确事业财运进入 `wealth-career`；掌图进入 `palm`；外部奇门局盘进入 `qimen`。同时深入询问婚恋和事业时，先由 `bazi` 给概览，再选择领域继续。

## Agent 兼容状态

状态来自 [机器可读验收记录](docs/agent-compatibility.json)，不以“目录能复制”冒充“宿主已发现并调用”。

| Agent | 状态 | 当前证据 |
|---|---|---|
| `claude-code` | `verified` | npx project 安装后真机发现五技能，脚本返回固定四柱；婚恋、事业财运与双领域路由已有真实模型验收 |
| `codex` | `experimental` | 官方 `.agents/skills` 路径与安装器运行探针已验证；本机 CLI 异常退出 137，宿主发现未通过 |
| `cursor` | `experimental` | 安装生命周期与运行探针已验证；Cursor Agent 未登录，真实发现被鉴权阻塞 |
| `trae` | `experimental` | 官方 `.trae/skills` 路径与安装生命周期已验证；本机无 Trae 真机 |
| `workbuddy` | `experimental` | v5.3.8 应用包确认 `.workbuddy/skills` 与本地导入逻辑；真机发现/调用仍未完成 |

## 安装

### 最简单：直接让 Agent 安装

在 WorkBuddy、Codex、Claude Code、Cursor 或 Trae 里直接说：

```text
帮我安装 https://github.com/konglong87/xuanxue-skills
```

只要当前 Agent 能执行终端命令，它就可以读取本仓库说明并完成安装。安装后可继续让它运行 `verify` 检查。若当前 Agent 不能执行终端命令，请使用下面的手动命令。

### 手动安装

需要 Node.js 18 或更高版本。通用首选方式是直接从 GitHub 运行本项目安装器：

```bash
npx --yes github:konglong87/xuanxue-skills install --agent codex --scope user
npx --yes github:konglong87/xuanxue-skills verify --agent codex --scope user
```

把 `codex` 替换为 `claude-code`、`cursor`、`trae` 或 `workbuddy`。`--scope user` 安装到个人范围；在目标项目目录执行并改为 `--scope project` 可安装到项目范围。

安装器把完整的 `core/`、`vendor/`、`skills/` 复制到稳定的版本目录，再为五个技能创建宿主入口；链接不会指向 npx 临时缓存。普通的单 skill 安装工具只复制叶子目录，会遗漏共享内核，因此当前不适用于本项目。

安全卸载：

```bash
npx --yes github:konglong87/xuanxue-skills uninstall --agent codex --scope user
```

卸载只删除 manifest 中由本项目拥有且仍指向原目标的链接；用户改写的路径和其他技能会保留。

Claude Code 也可通过 marketplace 安装：

```bash
claude plugin marketplace add konglong87/xuanxue-skills
claude plugin install xuanxue-skills@xuanxue-skills
```

本地开发加载不等于安装：

```bash
git clone https://github.com/konglong87/xuanxue-skills.git
claude --plugin-dir /absolute/path/to/xuanxue-skills
```

## 使用示例

安装并通过 `verify` 后，直接向 Agent 提问：

```text
请根据以下资料做综合八字分析，并列出换日、起运、旺衰和格局的流派差异：
出生日期 1990-01-01，出生时间 12:00，出生地上海，性别男，目标年份 2026。
```

缺少出生时间、经度、历史时区或性别时，技能会一次性询问全部缺项并停止，不猜数据。婚恋或事业问题附带奇门盘时仍进入领域技能，奇门只作可选增强。

## 架构与证据

```text
core/ganzhi <- core/calendar <- skills/bazi
                                <- skills/love-marriage
                                <- skills/wealth-career

core/direction <- core/naqi
core/ganzhi + core/direction <- skills/qimen
host vision -> skills/palm contract
```

`core/` 不依赖 skills；五个宿主共享同一份 `core/`、`vendor/` 与 `skills/`。运行时零外部依赖，内联的 `lunar-javascript` 保留 MIT 许可证与来源。

可复算测试案例包括 Barack Obama、Steve Jobs 与 Albert Einstein 的公开出生资料。案例来源、历史时区和 oracle 口径见 [docs/TEST-CASES.md](docs/TEST-CASES.md)；规则来源见 [docs/REFERENCES.md](docs/REFERENCES.md)。这些案例锁定排盘，不用于证明人生事件。

开发验证：

```bash
npm install
npm test -- --runInBand
node scripts/e2e-smoke.js
```

路线与未决项见 [docs/ROADMAP.md](docs/ROADMAP.md)，架构约束见 [CLAUDE.md](CLAUDE.md)。欢迎提交可复算 fixture、规则来源、宿主兼容证据与安全边界修复。

## 声明与许可证

本项目用于中国传统术数文化研究与娱乐，不构成医疗、投资、职业、法律或其他专业建议。项目不上传或持久化出生资料、掌图或局盘；实际宿主的数据处理政策由对应平台负责。

[MIT](LICENSE)
