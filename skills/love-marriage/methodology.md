# 婚恋判读方法论

## 八字信号顺序

先从 `bazi` 的 `calculation` 读取原局四柱与目标流年，再引用 `marriageSignals`。依次展示配偶宫、按性别并列的两类传统配偶星及显干/藏干位置、年支起与日支起两套桃花、红鸾天喜、夫妻宫对原局和目标流年的刑冲合害。确定性层只列位置和关系，不从单个符号推出具体事件。

`alternateCalculation` 存在时，另一换日派有独立的 `alternateMarriageSignals`。两派按各自日柱、日主和目标流年完整展开，差异并列，不选一派替用户裁决。

桃花、红鸾与天喜属于传统神煞查表口径；外部开源交叉验证固定为 `cantian-ai/bazi-mcp` 提交 `d5af26b0` 的 `src/lib/god.ts`。仓内无一手古籍页码，这组信号只作传统口径披露，不作为师承资料的流派裁决。

## 奇门可选增强

仅在 `normalizeChart` 返回 `chart` 且 `errors` 为空时使用奇门。`errors` 非空则降级，只保留错误清单，八字侧继续交付。

当 `alternateCalculation` 非空且 `qimenEnhancement.status: ready` 时，主派按自身 `dayBoundary` 和日干读取并渲染 `干合宫位`，另一派按自身 `dayBoundary` 和日干读取并渲染 `另一派干合宫位`；禁止跨派拼接，不得遗漏任一派。

日干与所合之干分别查找天盘、地盘的确认宫位。每个符号在每层必须唯一：缺失或重复均记为“不足”，保留全部候选并停止宫位比较，不猜寄宫。唯一后比较日干天盘与所合干地盘、日干地盘与所合干天盘；跨层落在同一宫记“同宫”，否则记“分宫”。

六合宫只按 `safeChart` 八神栏中确认的“六合”定位，缺失或重复同样记“不足”。六害观察只抄录安全盘面事实：标记字段保留名称、宫位、存在标志与 `provenanceRef`；审计 `raw/source/school` 不进入判读。门破、门迫各自保留；庚按天盘干或地盘干位置列出，白虎按八神位置列出，不把出现本身改写成事件结论。

## 报告装配

每一节逐项采用 `REPORT_CONTRACT.evidenceRules`。行动与安全边界逐项采用 `REPORT_CONTRACT.redlines`，免责声明逐项采用 `REPORT_CONTRACT.disclaimer`；本方法论不另建同义规则。

`qimenEnhancement.status: ready` 时，另须原样应用 `qimenEnhancement.共享安全契约.evidenceRules` 和 `qimenEnhancement.共享安全契约.redlines`。两边免责声明可以去重，但不能只应用 `REPORT_CONTRACT`。
