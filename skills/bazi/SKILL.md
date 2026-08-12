---
name: bazi
description: Use when the user supplies or wants to supply a 出生日期 and 出生时间 for a general 生辰八字 reading, including 看八字 or 算命; not for 手相 photos, 风水, 占卜, or requests focused specifically on 婚恋, 事业, or 财运.
---

# 八字综合命理

## 核心原则

确定性排盘必须来自仓库计算内核，模型只负责解释。**必须调用** `scripts/calculate.js`，禁止心算四柱、十神、大运或流年，也禁止用常识补造缺失的出生资料。报告中的四柱、真太阳时、十神、大运和流年只能逐字段引用脚本 JSON 的 `calculation` / `alternateCalculation`，不得根据出生时间再次换算或改写；脚本失败、返回非 `ready` 或缺少所需字段时必须停止判读并报告错误。

## 执行流程

1. 把用户资料整理为 JSON：`birthDate`、`birthTime`、`longitude`、`utcOffsetMinutes` 或 `standardMeridian`、`gender`。`targetYear`（目标年份）可选，未提供时脚本按调用时当前公历年注入并在结果中披露。出生时间必须保留出生地当时的民用墙钟语义。
2. 将 JSON 送入脚本。所有宿主都必须从已安装的 `bazi` 技能目录取得脚本的绝对路径；不得依赖当前工作目录或 shell 工作目录猜测仓库位置。Claude Code 可以使用 `${CLAUDE_PLUGIN_ROOT}`，其他宿主使用其提供的技能真实路径：

```bash
# 通用宿主：把占位符替换为当前 bazi 技能目录的绝对路径
printf '%s\n' '{"birthDate":"1955-02-24","birthTime":"19:15","longitude":-122.4194,"utcOffsetMinutes":-480,"gender":"male"}' | node "<absolute-bazi-skill-directory>/scripts/calculate.js"

# Claude Code 插件
printf '%s\n' '{"birthDate":"1955-02-24","birthTime":"19:15","longitude":-122.4194,"utcOffsetMinutes":-480,"gender":"male"}' | node "${CLAUDE_PLUGIN_ROOT}/skills/bazi/scripts/calculate.js"
```

3. 若返回 `needs_input`，按 `questions` 一次性追问全部缺失信息并停止判读。信息不足时询问，不得猜测经度、历史时区或性别。
4. 若返回 `ready`，读取 [methodology.md](methodology.md)，严格使用 `calculation`、`alternateCalculation` 与 `analysisContext`；按 [templates/report.md](templates/report.md) 输出。输出前逐项核对报告四柱与 `calculation.四柱结果.{年,月,日,时}` 完全一致。
5. `alternateCalculation` 不为 `null` 时，说明日柱存在换日分歧；脚本已经用不同 `dayBoundary` 调用 core 复算另一派完整命盘。两派必须分别分析，禁止模型从主派心算或改写另一派十神、大运和流年。
6. 每个判断都写出“算出 -> 依据 -> 可供判读”，并给现实核验点和行动。换日、起运、旺衰、格局、喜用神的流派分歧全部呈现。

## 路由边界

本技能用于综合命理，事业财运和婚恋只给概览。用户明确要求深入事业/财富时转 `wealth-career`，明确要求深入婚姻/恋爱时转 `love-marriage`。手掌照片转 `palm`。住宅风水与占卜能力均为 future / 未交付，当前不支持且不得调用不存在的技能。

## 禁止事项

- 不把五行数量直接等同旺衰，不把任一格局或喜用神方法包装成唯一真相。
- 不断言疾病、寿命、灾祸、必婚必离、确定收入或投资收益。
- 不省略文化娱乐、非医疗和非投资职业建议的免责声明。
