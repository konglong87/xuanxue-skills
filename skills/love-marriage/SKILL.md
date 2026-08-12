---
name: love-marriage
description: Use when the user supplies 出生资料 and an explicit 婚恋问题 such as 姻缘、什么时候结婚、正缘、感情、复合、配偶 or 桃花; an external 奇门局盘 is optional as 可选增强; not for 综合命理概览, 事业财运, or 手相 requests.
---

# 婚恋与情感判读

## 核心边界

先执行 `../bazi/scripts/calculate.js`（通过 `bazi` 公共编排）取得完整命盘，再调用 `../bazi/lib/analyze.js` 和 `core/ganzhi/domains.js` 的 `marriageSignals` 提取确定性关系信号；不重排四柱。报告中的四柱和时间校正只能逐字段引用 `bazi.calculation` / `bazi.alternateCalculation`，不得根据出生资料自行换算。脚本失败、返回非 `ready` 或缺少四柱字段时必须停止判读并报告错误。若 `alternateCalculation` 非空，必须对另一派命盘再次独立调用，禁止把两派的日主、配偶宫或关系拼接。

运行资源必须从已安装本技能 `SKILL.md` 的真实路径解析，再定位同一安装包内的 `../bazi/`、`../qimen/`、`../_shared/` 与仓库 `core/`；不得依赖当前工作目录或 shell 工作目录。任一共享资源不可达时停止判读，不退化为模型心算。

奇门只接受 `qimen` 提供的外部 APP 或手工转录局盘，并调用 `../qimen/lib/chart.js` 校验。它是可选增强，不是出生资料报告的前置条件，也不自行起局。

## 执行流程

1. 一次性收齐 `bazi` 所需出生字段；目标年未给时沿用 `bazi` 技能边界注入并披露来源。
2. 调用本技能 `lib/analyze.js`。`status: needs_input` 时原样展示全部补充问题并停止。
3. `status: ready` 时分别引用 `marriageSignals` 与 `alternateMarriageSignals`，按 [methodology.md](methodology.md) 组织八字侧证据。
4. `qimenEnhancement.status: ready` 时追加盘面观察；`degraded` 时只展示错误清单和八字侧概览；`not_provided` 时照常交付八字侧概览。
5. 严格按 [templates/report.md](templates/report.md) 输出，并原样渲染 `REPORT_CONTRACT.evidenceRules`、`REPORT_CONTRACT.redlines` 与 `REPORT_CONTRACT.disclaimer`。

当 `alternateCalculation` 非空且 `qimenEnhancement.status: ready` 时，主派必须按自身 `dayBoundary` 和日干渲染 `干合宫位`，另一派必须按自身 `dayBoundary` 和日干渲染 `另一派干合宫位`；禁止跨派拼接，不得遗漏任一派。

`qimenEnhancement.status: ready` 时还必须原样应用 `qimenEnhancement.共享安全契约.evidenceRules` 与 `qimenEnhancement.共享安全契约.redlines`。免责声明可以与婚恋免责声明去重，但不能只应用 `REPORT_CONTRACT`。

## 路由边界

1. 只给出生资料、没有具体领域问题，转 `bazi`，本技能不抢综合概览。
2. 给出生资料并明确询问某一领域，转对应领域技能；明确婚恋问题才进入本技能。
3. 同时明确问事业与婚恋两个领域，转 `bazi` 输出概览，并说明可再分别进入两个领域技能深入。
4. 用户显式点名技能时覆盖自动判断，但不覆盖输入与安全边界。
5. 信息不足时一次性追问全部缺失项后停止，不猜测、不用常识补造。

事业、跳槽、创业、财运、求财、升职或生意问题转 `wealth-career`；手掌照片转 `palm`。

## 来源与安全唯一入口

桃花、红鸾与天喜使用传统查表口径，并以 [cantian-ai/bazi-mcp 固定提交](https://github.com/cantian-ai/bazi-mcp/blob/d5af26b043ac4ca62ef832179f700148285688e3/src/lib/god.ts) 作外部开源交叉验证。仓内无一手古籍页码，因此不把该表冒充师承资料的流派裁决。

安全文本来自 `lib/analyze.js` 的 `REPORT_CONTRACT`；当 `qimenEnhancement.status: ready` 时，同时来自 `qimenEnhancement.共享安全契约`。其中婚恋 `disclaimer` 由 `disclaimerFor('婚恋')` 生成，技能正文不维护同义副本。
