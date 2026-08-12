---
name: qimen
description: Use when the user supplies a 奇门 APP 已起好的局盘截图 or 转录文本 and asks 奇门遁甲、局盘、九宫盘 or 看局; not for 起局 itself, 只有出生日期, 手相, or 风水 requests.
---

# 奇门外部局盘判读

## 核心原则

本技能只接收外部 APP 已起好的局盘截图或用户提供的手工转录，不自行起局。宿主先逐宫转录，再把对象交给 `lib/chart.js` 的 `normalizeChart(transcribed)`；不得调用 `flyStars`，不得用模型心算补盘。

## 执行流程

1. 确认来源为“外部APP”或“手工转录”，记录来源名称。截图由宿主读取；代码不声称具备图片识别能力。
2. 按 [methodology.md](methodology.md) 转录盘级 `月令`、`值符`、`值使`，以及八方加中宫共九宫的 `方向`、`天盘干`、`地盘干`、`八门`、`九星`、`八神`、`标记`。
3. 每个标记都在审计 `chart` 中保留 `raw`、`source`、`school`。门破和门迫按不同原词分别记录，不互换、不归并。
4. 调用 `normalizeChart(transcribed)`。`errors` 非空时只展示结构化 safe errors 与一次性补录清单并停止奇门判读；未知字段名属于 `untrusted-audit-only` 输入，不进入公共错误，错误只给父容器下稳定 `$unexpected[n]` 引用。每容器未知字段、公共错误总数、九宫数量和单宫标记数量均受冻结常量限制；超限分别给固定 `unexpected_fields_truncated`、`errors_truncated`、`palace_count_exceeded` 或 `marker_count_exceeded`，不深遍历越界内容。`chart` 仅供本地审计，不进入模型上下文或报告。
5. `errors` 为空时，只把 `safeChart` 交给判读和报告。`safeChart` 只含确认枚举、存在标志及稳定 `provenanceRef`，不含来源名称、`raw`、`source`、`school` 自由文本；表达与行动原样渲染 `REPORT_CONTRACT.evidenceRules` 和 `REPORT_CONTRACT.redlines`，本文件不改写。

## 状态输入

明确值可直接转录为字符串。截图缺失或有疑义时使用 `{ "status": "missing|unreadable|uncertain|unknown", "raw": "外部盘原词" }`。`raw` 只在审计 `chart` 保留原图文字；禁止为通过校验而把疑义字段改成确定值。确认无宫级标记时必须明确填写空数组，不能省略字段。

## 路由边界

只有出生资料且未提供外部奇门局盘时转 `bazi`；明确婚恋问题转 `love-marriage`，明确事业财运问题转 `wealth-career`，其中奇门只作为可选外部增强。同时明确询问事业与婚恋时转 `bazi` 输出概览，并说明可再分别进入两个领域技能深入。手掌照片转 `palm`。住宅风水与占卜能力均为 future / 未交付，当前不支持且不得调用不存在的技能。

用户显式点名技能时覆盖自动路由，但仍须遵守本技能不自研起局的边界。信息不足时一次性追问全部缺失项并停止；用户要求本技能起局时说明当前不实现起局，并请其提供可信外部 APP 局盘。

## 安全唯一来源

从 `lib/chart.js` 读取 `REPORT_CONTRACT`。其 `disclaimer` 由共享 `disclaimerFor('奇门')` 生成，`evidenceRules` 与 `redlines` 也是共享安全快照。报告必须逐条原样输出这些字段，不在技能内另写或改写同义安全措辞。
