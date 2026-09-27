---
name: ziwei
description: Use when the user explicitly asks for 紫微斗数、紫微命盘、十二宫、命宫身宫、四化或大限，并提供出生日期、出生时间、出生地点和性别；不用于仅有卦象、奇门局盘、手相照片或住宅风水的问题。
---

# 紫微斗数命盘

## 核心原则

必须调用 `scripts/calculate.js`。历法转换和安星由 `core/ziwei` 执行；模型不得心算、修改星曜或把符号当作现实事实。结构校验通过不代表术数具有科学预测能力。

## 执行流程

1. 一次性收集 `birthDate`（公历 YYYY-MM-DD，1900–2100）、`birthTime`（出生地民用 HH:mm[:ss]）、`longitude`、出生当日 `utcOffsetMinutes` 或 `standardMeridian`、`gender`（male/female）。不要猜历史时区、夏令时或缺失出生资料。
2. 取得已安装技能目录的**绝对路径**，不得依赖当前工作目录或 shell 工作目录。通用宿主从技能实际路径定位；Claude Code 可用 `${CLAUDE_PLUGIN_ROOT}/skills/ziwei/scripts/calculate.js`。

```bash
printf '%s\n' '{"birthDate":"2024-02-10","birthTime":"00:30","longitude":120,"utcOffsetMinutes":480,"gender":"male","options":{"useTrueSolar":false,"dayBoundary":"23:00","yearBoundary":"lunar-new-year","leapMonthPolicy":"same-month","transformationPolicy":"traditional"}}' | node "<absolute-ziwei-skill-directory>/scripts/calculate.js"
```

3. `needs_input`：按 `missing`/`questions` 一次问全并停止判读。脚本非零退出、`status:error`、缺字段或验证非 `passed` 时同样停止，不得补造命盘。
4. `ready`：同时检查 `supplement.verification.status`、`supplement.calculation.verification.status`，均为 `passed` 才解读。只引用 `supplement.calculation` 的宫位、星曜、四化、大限；按 [templates/report.md](templates/report.md) 输出。
5. 读取 [methodology.md](methodology.md)。披露 `输入口径.policies` 和 `calendar`。三个 `supplement.alternatives` 是另外三种已支持年界/日界组合的完整盘；对 `differs:true` 的盘分别展示，不得跨盘拼接。

## 口径与能力

- 默认真太阳时、23:00换日、农历新年分年。可选 `useTrueSolar:false`、`dayBoundary:"00:00"`、`yearBoundary:"lichun"`。
- 晚子换日先移动完整日期，再转农历；立春以实际瞬间判定，按出生UTC偏移换算至节气表时区，不套用当地墙钟。
- 闰月仅支持 `same-month`；四化仅支持 `traditional`。未实现的选项报错，不宣称覆盖全部流派。
- 命宫、身宫、十二宫、五行局、十四主星、昌曲辅弼、禄存羊陀天马、生年四化、三方四正和大限宫位骨架。
- 当前不覆盖完整辅星亮度、流年流月流日、小限、飞星及图片识盘。

## 路由与安全

只给出生资料且未点名体系的综合问题转 `bazi`；明确点名紫微时使用本技能。深入婚恋、事业财运可转 `love-marriage` / `wealth-career`，但当前领域技能没有自动消费紫微盘的接口，不伪称已融合。

住宅风水和占卜技能仍是 future / 未交付，不得调用不存在的技能；奇门和手掌照片不在本技能范围。显式点名只覆盖自动路由，仍须遵守输入和安全边界。

报告原样使用运行时 `边界` 以及共享 `EVIDENCE_RULES`，不另改免责声明。不得断言必婚必离、出轨、疾病、寿命、灾祸、确定收益或他人隐私事实。
