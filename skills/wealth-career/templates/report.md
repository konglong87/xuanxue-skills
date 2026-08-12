# 事业财运报告

> 确定性闸门：四柱和时间校正只能原样引用 `bazi.calculation` / `bazi.alternateCalculation`。不得根据出生资料自行换算；计算脚本失败或字段缺失时停止判读。

## 输入与口径

- 出生资料、目标年与时间校正口径：{{bazi.input}}
- 主派 `dayBoundary`：{{bazi.calculation.四柱结果.采用规则.dayBoundary}}
- `alternateCalculation`：{{bazi.alternateCalculation}}
- 双口径说明：{{wealthCareerSignals.口径}}

若 `alternateCalculation` 非空，主派和另一换日派分别渲染，禁止跨派拼接。

## 八字事业财运信号

- 主派日主与十神结构：{{wealthCareerSignals.十神结构}}
- 主派五组：{{wealthCareerSignals.十神分组}}
- 另一派：{{alternateWealthCareerSignals}}
- 五组双向语义：{{analysisContext.十神双向语义}}

按 `visibleOnly` 和 `allPositions` 分开引用位置；不以藏干冒充透干，不据数量裁决旺衰或收入。

财、官杀、印、食伤、比劫均须同时报告收益面与代价面，并明确写成待核验假设，不得把双向语义写成确定事实。

## 职业组合与限制

{{wealthCareerSignals.职业组合}}

逐项列出条件组和两套口径的分组证据。命中只表示资料条件出现，不代表确定天赋、职业等级或必然适职。

## 奇门可选增强

- 状态：{{qimenEnhancement.status}}
- 同宫标记摘要表：{{qimenEnhancement.同宫标记摘要表}}
- 财富七项：{{qimenEnhancement.财富七项}}
- 事业七项：{{qimenEnhancement.事业七项}}
- 错误：{{qimenEnhancement.errors}}

`qimenEnhancement.status: ready` 时只写 observations、problems、requiredContext 与 limitation，不从盘面补造现实事件；`degraded` 时只列 errors，继续八字侧报告。

每宫只预计算一次共享 `同宫标记摘要表`，表项仅显示 safeChart 枚举 `名称` 与稳定 `provenanceRef`；审计 `raw`、`source`、`school` 和来源名称不进入报告。所有带宫位的 observation 和候选只显示常量大小的 `count + summaryRef`，标记 observation 再显示 `excludedRef`。报告按 `summaryRef` 查摘要表，标记 observation 排除 `excludedRef` 后展示其余同宫枚举；不得嵌套复制其他标记 DTO，安全引用不得升级为现实事件。

`qimenEnhancement.status: ready` 时原样应用 `qimenEnhancement.共享安全契约.evidenceRules` 与 `qimenEnhancement.共享安全契约.redlines`，其免责声明与财经免责声明去重；不能只应用 `REPORT_CONTRACT`。

## 现实核验与行动

- 可核验的当前资源、约束与岗位事实：{{现实核验}}
- 低成本、可撤销的下一步：{{行动}}
- 需要专业意见或更多数据的决策：{{待补证据}}

所有建议按 `REPORT_CONTRACT.evidenceRules` 原样展开，不输出收益承诺、投资标的或确定职业结果。

## 流派与限制

- 两个 `dayBoundary` 的结果差异：{{流派差异}}
- `visibleOnly` 与 `allPositions` 的差异：{{位置口径差异}}
- 未支持规则与所需上下文：{{限制}}

奇门只复用 `qimen/lib/chart.normalizeChart` 的外部盘；八字只复用 `bazi/lib/analyze` 和 `core/ganzhi.tenGodStructure`，不得跨派拼接。

## 免责声明

原样输出 `REPORT_CONTRACT.disclaimer`。该字段由 `disclaimerFor('财经')` 生成，同时原样应用 `REPORT_CONTRACT.redlines`；奇门 ready 时合并其共享安全契约并对免责声明去重。
