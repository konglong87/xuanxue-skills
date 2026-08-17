<div align="center">

<h1>xuanxue-skills</h1>

<p><strong>让你的 AI Agent 读懂八字、婚恋、事业财运、手相与奇门局盘</strong></p>

<p>
  简体中文 · <a href="README_EN.md">English</a> ·
  <a href="#30-秒开始">快速开始</a> ·
  <a href="#当前能力">能力清单</a>
</p>

<p>
  <a href="https://github.com/konglong87/xuanxue-skills/tree/v0.2.1"><img alt="Version v0.2.1" src="https://img.shields.io/badge/version-v0.2.1-2563eb?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-16a34a?style=flat-square"></a>
  <a href="package.json"><img alt="Node.js 18 or newer" src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white"></a>
  <img alt="Zero runtime dependencies" src="https://img.shields.io/badge/runtime_dependencies-0-7c3aed?style=flat-square">
</p>

<p><sub>支持 Claude Code · Codex · Cursor · Trae · WorkBuddy</sub></p>

</div>

不需要记技能名称，也不需要懂命理术语。安装后，直接用日常语言提问即可。

## 30 秒开始

在 WorkBuddy、Codex、Claude Code、Cursor 或 Trae 里直接说：

```text
帮我安装 https://github.com/konglong87/xuanxue-skills
```

安装完成后，再说：

```text
请验证 xuanxue-skills 是否安装成功，并告诉我现在可以使用哪些能力。
```

只要当前 Agent 能执行终端命令，它就可以读取本仓库说明并完成安装。如果它不能执行终端命令，请使用后面的[手动安装](#手动安装)。

## 你可以问什么

直接复制下面的话，再换成你自己的资料。

| 你想了解 | 可以这样问 | 需要准备 |
|---|---|---|
| 八字综合 | `请根据我的出生资料，做一次完整的八字综合分析，并说明不同流派的差异。` | 出生日期、时间、地点、性别 |
| 婚恋情感 | `请分析我的婚恋情感倾向、相处模式和阶段变化，不要下必婚必离的结论。` | 完整出生资料 + 具体问题 |
| 事业财运 | `请分析我的事业方向、工作特点和财运节奏，不要承诺收益。` | 完整出生资料 + 具体问题 |
| 手相 | `请根据这两张手掌照片分析手型、掌丘、主线和特殊纹路。` | 清晰的双手掌心照片 |
| 奇门局盘 | `请判读这张奇门局盘，并逐宫说明判断依据。` | 外部奇门 APP 已排好的完整局盘 |

八字提问示例：

```text
请根据我的出生资料，做一次完整的八字综合分析。
出生日期：1990-01-01
出生时间：12:00
出生地点：上海
性别：男
重点想看：性格、婚恋、事业财运，以及 2026 年趋势
请列出换日、起运、旺衰和格局的不同流派结论，不要替我偷偷选择流派。
```

资料不完整时，技能会一次问清缺少的信息，不会自行猜测出生时间或地点。

## 使用前准备

| 场景 | 最好提供什么 |
|---|---|
| 八字、婚恋、事业财运 | 公历出生日期、尽量准确的出生时间、出生城市、性别；海外或历史出生记录最好补充当时的时区 |
| 手相 | 左右手分别拍摄，掌心朝上，自然光，画面清晰，不开美颜，不遮挡掌纹 |
| 奇门 | 可信 APP 已生成的完整局盘截图，或逐宫文字转录；本项目当前不自行起局 |

## 当前能力

| 能力 | 状态 | 普通用户需要知道的边界 |
|---|---|---|
| `bazi` 八字综合 | 已开放 | 代码排盘，并列展示换日、起运、旺衰、格局和喜用等流派差异 |
| `love-marriage` 婚恋情感 | 已开放 | 分析倾向和相处模式，不断言必婚、必离或他人的隐私事实 |
| `wealth-career` 事业财运 | 已开放 | 分析方向、节奏和风险，不保证收益，不替代投资或职业建议 |
| `palm` 手相 | 已开放 | 宿主 Agent 负责多模态观察（看图），代码负责验证观察结构；结论必须对应照片中的实际特征 |
| `qimen` 外部奇门局盘 | 已开放 | 只判读可信外部 APP 已起好的局盘，当前不自行起局 |
| `face-reading` 面相 | 规划中，暂不开放 | **因人脸隐私暂不开放** |
| `fengshui-naqi` 风水纳气 | future | 计算内核已有部分能力，完整用户技能尚未开放 |
| `divination` 占卜 | future | 尚未实现，不在当前安装清单中 |

## 为什么不是普通提示词

- **代码计算**：四柱、节气、真太阳时、大运流年和干支关系由共享计算内核完成，不让模型凭印象心算。
- **流派并列**：遇到换日、起运、旺衰、格局和喜用等分歧时，同时展示方法、依据与结果。
- **现实核验**：把判读写成你可以结合现实检查的倾向和问题，不虚构已经发生的人生事件。
- **安全边界**：不保证收益，不断言必婚必离，不作医疗诊断，不把传统文化解释包装成确定事实。

## 请先了解这些边界

- 本项目用于中国传统术数文化研究与娱乐，不构成医疗、投资、职业、法律或其他专业建议。
- 出生资料、手掌照片和局盘由你选择的 Agent 宿主处理。本项目本身不上传或持久化这些资料，宿主平台的数据政策仍然适用。
- 名人案例只用于检查排盘计算是否正确，不用于证明人生经历可以被命理准确预测。
- 手相中的健康相关观察只可表达体质或精力倾向，不构成医疗诊断。

## 给技术用户

### 手动安装

需要 Node.js 18 或更高版本。下面以 Codex 的个人安装为例：

```bash
npx --yes github:konglong87/xuanxue-skills install --agent codex --scope user
npx --yes github:konglong87/xuanxue-skills verify --agent codex --scope user
```

把 `codex` 替换为 `claude-code`、`cursor`、`trae` 或 `workbuddy`。使用 `--scope user` 安装到个人环境；在目标项目目录中使用 `--scope project` 安装到当前项目。

安装器会把完整的 `core/`、`vendor/` 和 `skills/` 复制到稳定的版本目录，再创建宿主可发现的技能入口。普通的单 skill 复制工具会遗漏共享计算内核，因此不适用于本项目。

安全卸载：

```bash
npx --yes github:konglong87/xuanxue-skills uninstall --agent codex --scope user
```

卸载器只删除仍由本项目拥有的入口，不会删除用户改写的路径或其他技能。

### Claude Code marketplace

```bash
claude plugin marketplace add konglong87/xuanxue-skills
claude plugin install xuanxue-skills@xuanxue-skills
```

本地开发加载：

```bash
git clone https://github.com/konglong87/xuanxue-skills.git
claude --plugin-dir /absolute/path/to/xuanxue-skills
```

### Agent 兼容状态

`verified` 表示已完成宿主发现和真实调用；`experimental` 表示安装器已验证，但宿主真机证据仍不完整。详细记录见 [agent-compatibility.json](docs/agent-compatibility.json)。

| Agent | 状态 | 当前证据 |
|---|---|---|
| `claude-code` | `verified` | 已发现五个技能；八字、婚恋、事业财运和双领域路由通过真实模型验收 |
| `codex` | `experimental` | 官方路径和安装器探针通过；当前测试机的 CLI 异常退出，未完成宿主发现 |
| `cursor` | `experimental` | 安装生命周期和运行探针通过；真实发现受测试机登录状态阻塞 |
| `trae` | `experimental` | 路径映射和安装生命周期通过；当前没有可用的 Trae 真机 |
| `workbuddy` | `experimental` | 已确认技能目录和导入逻辑；宿主内真实发现与调用仍待完成 |

### 架构与验证

```text
core/ganzhi <- core/calendar <- skills/bazi
                                <- skills/love-marriage
                                <- skills/wealth-career

core/direction <- core/naqi
core/ganzhi + core/direction <- skills/qimen
host vision -> skills/palm contract
```

`core/` 不依赖 skills。五个宿主共享同一份计算内核和运行时，运行时零外部依赖；内联的 `lunar-javascript` 保留 MIT 许可证与来源。

开发验证：

```bash
npm install
npm test -- --runInBand
node scripts/e2e-smoke.js
```

可复算案例、历史时区和对照口径见 [测试案例](docs/TEST-CASES.md)；后续能力见 [路线图](docs/ROADMAP.md)；架构约束见 [CLAUDE.md](CLAUDE.md)。规则来源为第三方师承资料，不随本仓库分发；每条判据的适用范围写在对应技能的 `methodology.md` 内。

## 许可证

[MIT](LICENSE) - 可以免费下载、使用、修改和分发，请保留许可证声明。
