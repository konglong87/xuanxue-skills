# 奇门外部局盘报告模板

## 输入来源

- 来源类型：仅填写 `safeChart` 标准化后的“外部APP”或“手工转录”
- 来源名称：只显示 `safeChart.来源.名称` 的存在标志与 `provenanceRef`，不显示名称文本
- 原始材料说明：说明截图或用户转录，不声称由本技能起局

## 局盘完整性

- `errors` 为空：九宫方向与必填字段通过结构校验
- `errors` 非空：逐条展示安全的 `path / code / message`，一次性请求补录并停止判读；只显示稳定 `$unexpected[n]` 引用，不得显示未知字段名；`unexpected_fields_truncated`、`errors_truncated`、`palace_count_exceeded`、`marker_count_exceeded` 是固定有界哨兵，不得展开或回读越界输入
- 疑义字段：只列结构化 `status / path / code / message` 并请求补录，不把审计原词带入报告

## 九宫转录

只从 `safeChart` 按宫数 1 至 9 展示方向、天盘干、地盘干、八门、九星、八神与标记。标记只展示确认枚举、存在标志与 `provenanceRef`；门破与门迫分别展示，不能合并。

## 证据与判读

- 数据项：仅引用 `safeChart` 中 `status: confirmed` 的盘级或宫级字段。
- 溯源项：附带宫位、符号、存在标志和稳定 `provenanceRef`，不显示审计自由文本。
- 表达与行动：原样采用并渲染 `REPORT_CONTRACT.evidenceRules` 与 `REPORT_CONTRACT.redlines`，本模板不改写。

## 流派与原词

并列所有已确认的用语分歧。特别分别列出门破/门迫及其安全溯源引用，不把一词静默改写成另一词；`raw`、`source`、`school` 仅留在本地审计 `chart`。

## 行动边界

逐条原样输出 `REPORT_CONTRACT.redlines`，不得增删或同义改写。

## 免责声明

逐条原样输出由共享 `disclaimerFor('奇门')` 生成的 `REPORT_CONTRACT.disclaimer`，不得在模板中复制或维护另一份文本。
