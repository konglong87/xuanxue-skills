---
name: wealth-career
description: Use when the user supplies 出生日期 and 出生时间 and explicitly asks about 事业、财运、工作、赚钱、跳槽、创业、求财、生意 or 升职; an external 奇门局盘 is optional as 可选增强; not for 综合命理, 婚恋, 手相, or 奇门起局 requests.
---

# 事业财运判读

## 核心边界

先执行 `../bazi/scripts/calculate.js`（通过 `bazi` 公共编排）取得完整命盘，再调用 `../bazi/lib/analyze.js` 和 `core/ganzhi` 公共入口的 `tenGodStructure`。本技能只组装已有命盘和确定性十神位置，不直接调用历法内核，不重复排盘。报告中的四柱和时间校正只能逐字段引用 `bazi.calculation` / `bazi.alternateCalculation`，不得根据出生资料自行换算；脚本失败、返回非 `ready` 或缺少四柱字段时必须停止判读并报告错误。奇门只接受用户提供的外部 APP 或手工转录盘，并交给 `../qimen/lib/chart.js` 的 `normalizeChart`；本技能不自行起局。

运行资源必须从已安装本技能 `SKILL.md` 的真实路径解析，再定位同一安装包内的 `../bazi/`、`../qimen/`、`../_shared/` 与仓库 `core/`；不得依赖当前工作目录或 shell 工作目录。任一共享资源不可达时停止判读，不退化为模型心算。

## 执行流程

1. 一次性收齐 `bazi` 所需出生字段。`status: needs_input` 时原样展示全部补充问题并停止。
2. `status: ready` 时分别使用 `wealthCareerSignals` 与 `alternateWealthCareerSignals`。若 `alternateCalculation` 非空，换日两派必须各自从对应完整命盘生成信号，不得跨派拼接。
3. 同时展示 `visibleOnly` 和 `allPositions`，只谈位置、数量和是否出现；不得用计数裁决旺衰、等级、收入或职业结果。
4. `qimenEnhancement.status: ready` 时追加外部盘观察；每宫一次预计算共享 `同宫标记摘要表`，表项只含安全枚举 `名称` 与稳定 `provenanceRef`。每个 observation 只带常量大小的 `count + summaryRef`，标记 observation 再带 `excludedRef`；报告按 `summaryRef` 查表并排除自身，不嵌套复制标记 DTO。`errors` 非空导致 `degraded` 时只展示有界错误并继续八字报告；`not_provided` 时正常交付八字报告。
5. 按 [methodology.md](methodology.md) 和 [templates/report.md](templates/report.md) 输出，并原样应用 `REPORT_CONTRACT.evidenceRules`、`REPORT_CONTRACT.redlines` 与 `REPORT_CONTRACT.disclaimer`。

当 `qimenEnhancement.status: ready` 时，还要原样应用 `qimenEnhancement.共享安全契约.evidenceRules`、`qimenEnhancement.共享安全契约.redlines` 和其免责声明。两份免责声明可去重，但不能只应用财经 `REPORT_CONTRACT`。

## 路由边界

1. 只给出生资料、没有具体领域问题，转 `bazi`，本技能不抢综合命理概览。
2. 给出生资料并明确询问某一领域，转对应领域技能；明确事业财运问题才进入本技能。
3. 同时明确问事业与婚恋两个领域，转 `bazi` 输出概览，再按用户后续选择分别深入。
4. 用户显式点名技能时覆盖自动判断，但不覆盖输入要求、证据边界与安全边界。
5. 信息不足时一次性追问全部缺失项后停止，不猜测、不用常识补造。

婚姻、姻缘、感情、复合或配偶问题转 `love-marriage`；手掌照片转 `palm`；只给外部奇门局盘且要求看局转 `qimen`。

## 来源与安全唯一入口

职业组合来自师承资料的十神组合赛道表。资料中的等级化修辞不进入事实字段，命中只表示指定十神条件同时出现，不等于确定天赋或必然适职。

财经安全文本由代码中的 `disclaimerFor('财经')`、`REPORT_CONTRACT.evidenceRules` 与 `REPORT_CONTRACT.redlines` 统一提供，技能正文不维护同义副本。`qimenEnhancement.status: ready` 时同时使用隔离的奇门共享安全快照。
