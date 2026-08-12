# 事业财运方法论

## 一、输入与依赖

唯一调用链是 `wealth-career/lib/analyze -> bazi/lib/analyze -> core/ganzhi.tenGodStructure`。可选奇门输入只走 `qimen/lib/chart.normalizeChart`，不得直接调用 `baziChart`，不得复制四柱计算，也不得从出生资料起奇门局。

`bazi.status: needs_input` 时原样返回。`alternateCalculation` 非空时，主派和另一换日派分别调用公共 `tenGodStructure`；两派各自形成完整信号，禁止跨派拼接。奇门 `errors` 非空时降级为 `degraded`，只保留错误，八字侧仍交付。

## 二、十神双口径

五组固定为：财取正财、偏财；官杀取正官、七杀；印取正印、偏印；食伤取食神、伤官；比劫取比肩、劫财。

- `visibleOnly`：只收原局年、月、时三柱天干，不含日干，不含藏干，不含流年或大运。
- `allPositions`：同一原局的 `visibleOnly` 加四支藏干；每一个藏干位置分别保留。

两套口径只输出位置、计数和是否存在，均不加权。藏干不能冒充透干，计数不得裁决旺衰、喜忌、职业等级、收入或结果。

五组解释必须从 `analysisContext.十神双向语义` 读取并同时写收益面与代价面：财是资源掌控及占有维护成本；官杀是规则、压力、塑形机会及被约束重塑；印是支持、名声、学术背景及获取支持的环境成本；食伤是产出、创意、表达及精力消耗；比劫是同侪合作及资源竞争。每组都只能写成待核验假设，不得伪装成确定事实。

## 三、职业组合

条件按组间 AND、组内 OR：

| 组合 | 条件组 | 资料类型与赛道 |
|---|---|---|
| 偏财与七杀 | 偏财 AND 七杀 | 创业型；复杂经营和新市场探索 |
| 伤官与偏财 | 伤官 AND 偏财 | 创意技术型；技术、创意和独立业务 |
| 食神与七杀 | 食神 AND 七杀 | 对抗型人才；危机处理和高压攻坚 |
| 偏财与正印 | 偏财 AND 正印 | 名利协同型；资源经营和社会声望协同 |
| 比肩或劫财 | 比肩 OR 劫财 | 身体执行型；运动和身体执行行业 |
| 印星 | 正印 OR 偏印 | 学术型；理论与深入研究 |

每项必须分别展示 `visible-only` 与 `all-positions` 的分组证据。资料中的等级词不进入输出；组合命中只表示符号条件出现，不推旺衰、不推必然适职。

## 四、奇门财富七项

七项顺序固定：戊、生门、六合、月令、行业、实干、干财。每项统一为 `{id, 名称, status, observations, problems, requiredContext, limitation}`。

- 戊：天盘干和地盘干分别找宫位；任一层不是唯一候选则 `ambiguous`。
- 生门、六合：只记录所在宫；缺失或重复时 `ambiguous`。
- 月令：只保留原值。仓内没有月令生克与成本推导算法。
- 行业：需要用户行业或目标岗位及所用取象来源，状态为 `needs_context`。
- 实干：需要现实市场需求、平台和资源承载证据，状态为 `needs_context`。
- 干财：仓内没有确定性算法，状态为 `unsupported`。

## 五、奇门事业七项

七项顺序固定：开门、景门、玄武、庚/虎、行业、符使、诸干。

- 开门、景门、玄武只记录盘面位置；缺失或重复时 `ambiguous`。
- 庚/虎必须分开记录庚的天盘、庚的地盘、白虎的八神位置和虎的原始标记，四者不得互换；任一子来源出现 0 次或大于 1 次时均为 `ambiguous`。
- 行业需要用户岗位语境和取象来源，状态为 `needs_context`。
- 符使以盘头值符定位九星候选，以盘头值使定位八门候选；候选不唯一时 `ambiguous`，不得由此推出现实领导态度。
- 诸干需要起局年干、月干、时干，但标准 qimen DTO 不提供这些字段，状态为 `unsupported`；不得拿出生八字替代起局信息。

每宫的 confirmed 标记只扫描和预计算一次，生成共享 `qimenEnhancement.同宫标记摘要表`。表以 `summaryRef` 为键，每条仅含 safeChart 冻结枚举 `名称` 与稳定 `provenanceRef`；每条标记在表中只出现一次。审计 `raw`、`source`、`school` 和来源名称不进入共享表或判读。

凡 observation 或候选包含宫位，必须同时显示常量大小的 `同宫标记摘要: { count, summaryRef }`。标记 observation 再带自身 `excludedRef`；`count` 是该宫表项总数，报告按 `summaryRef` 查 `同宫标记摘要表` 后排除 `excludedRef`，既保留其他标记的安全枚举语义，也不得为每个 observation 复制标记 DTO。戊、生门、六合、开门、景门、玄武、庚/虎和值符值使候选统一适用，不得只挑资料中的风险标记。

所有奇门项只形成盘面观察；同宫标记摘要只记录盘面事实和安全引用，不把符号翻译成已发生的人物动机、合同、健康、裁员、投资或职业事件。

## 六、报告与安全

每项按 `REPORT_CONTRACT.evidenceRules` 原样组织，财经边界原样取 `REPORT_CONTRACT.redlines`，免责声明来自 `disclaimerFor('财经')`。不得另写同义安全文本。

`qimenEnhancement.status: ready` 时还要原样采用 `qimenEnhancement.共享安全契约.evidenceRules` 与 `qimenEnhancement.共享安全契约.redlines`；两份免责声明去重呈现，不能只使用财经契约。
