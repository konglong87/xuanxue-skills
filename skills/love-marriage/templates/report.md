# 婚恋与情感报告

> 确定性闸门：四柱和时间校正只能原样引用 `bazi.calculation` / `bazi.alternateCalculation`。不得根据出生资料自行换算；计算脚本失败或字段缺失时停止判读。

## 输入与口径

列出出生民用时间、地点经度、历史时区、性别、目标年、换日口径与目标年来源。外部奇门局盘存在时列出来源和校验状态。

## 八字婚恋信号

分别引用主派 `marriageSignals` 与可选 `alternateMarriageSignals`，展示配偶宫、配偶星位置、两套桃花、红鸾天喜及夫妻宫关系。每项按 `REPORT_CONTRACT.evidenceRules` 装配。

## 奇门可选增强

按 `qimenEnhancement.status` 展示未提供、降级错误或已确认盘面。可用时列出干合双方天/地盘宫位、同宫或分宫状态、六合宫与六害观察；不足项保留候选和问题。

当 `alternateCalculation` 非空且 `qimenEnhancement.status: ready` 时，主派按自身 `dayBoundary` 和日干渲染 `干合宫位`，另一派按自身 `dayBoundary` 和日干渲染 `另一派干合宫位`；禁止跨派拼接，不得遗漏任一派。

`qimenEnhancement.status: ready` 时原样应用 `qimenEnhancement.共享安全契约.evidenceRules` 与 `qimenEnhancement.共享安全契约.redlines`。免责声明可以与婚恋免责声明去重，但不能只应用 `REPORT_CONTRACT`。

## 现实核验与行动

只基于前两节证据提出由用户在现实关系中核验的问题与自身可执行选择，并逐项采用 `REPORT_CONTRACT.evidenceRules` 和 `REPORT_CONTRACT.redlines`。

## 流派与限制

并列换日两派；披露传统神煞口径的来源边界。外部交叉验证见 `cantian-ai/bazi-mcp@d5af26b0`，仓内无一手古籍页码，不作为 R3/R5 裁决。奇门不足项不补造。

## 免责声明

逐条原样渲染 `REPORT_CONTRACT.disclaimer`，其唯一来源为 `disclaimerFor('婚恋')`。
