# 奇门外部局盘方法论

## 输入边界

本技能只标准化外部 APP 或手工转录的既有局盘，不依据日期、时间自行起局。`normalizeChart` 只查表校验，不调用 `flyStars`，也不从相邻宫推回缺字。

## 九宫完整性

宫数与方向复用 `core/direction` 的洛书映射，固定检查：1 正北、2 西南、3 正东、4 东南、5 中宫、6 西北、7 正西、8 东北、9 正南。八方加中宫必须各出现一次；重复、缺一或多一都进入错误列表，不自动生成空缺宫。输入最多标准化冻结的 `INPUT_LIMITS.MAX_PALACES` 个宫；越界先报固定 `palace_count_exceeded`，再停止深遍历额外宫位。

每宫依次转录：天盘干、地盘干、八门、九星、八神、标记。允许的十天干复用 `core/ganzhi`；八门为开、休、生、伤、杜、景、死、惊；九星为天蓬、天任、天冲、天辅、天英、天芮、天柱、天心、天禽；八神为值符、腾蛇、太阴、六合、白虎、玄武、九地、九天。盘级另录月令、值符、值使。

## 原词与疑义

每个字段分为 `confirmed`、`missing`、`unreadable`、`uncertain`、`unknown`：

- 缺失：外部材料没有该字段。
- 不可读：截图存在文字，但画质不足以辨认。
- 不确定：可读出多个候选，无法唯一确认。
- 未知：原词清晰但不在冻结常量内。

后面三类都在审计 `chart` 保留原词 `raw`，不得按常见排盘补字。所有安全错误均包含 `path/code/message` 且不回显自由文本；未知字段名是 `untrusted-audit-only`，只留在调用方持有的原始输入。公共 safe errors 在每个父容器内只保留冻结上限内、可区分的 `$unexpected[n]`，其余以不含用户数据的固定 `$unexpected[truncated] / unexpected_fields_truncated` 收束；所有错误再由 `ERROR_LIMITS.MAX_PUBLIC_ERRORS` 封顶，溢出以固定 `$errors[truncated] / errors_truncated` 收束。只要 errors 非空，下游领域技能就降级为不使用奇门增强。

宫级六害相关标记保留击刑、入墓、庚、虎、门破、门迫、空亡。资料 R3 第 4.1 节写“门破”，实施方案与第 4.4 节写“门迫”；两者来源术语有分歧，分别保留，绝不等同或互换。每条标记必须在审计 `chart` 记录外部原文 `raw`、来源 `source`、流派或口径 `school`，未知派别也应如实写“APP未标派别”，不能替 APP 归派。单宫最多标准化冻结的 `INPUT_LIMITS.MAX_MARKERS_PER_PALACE` 条标记；越界先报固定 `marker_count_exceeded`，再停止深遍历额外标记。

`normalizeChart` 同时生成安全投影 `safeChart`。审计 `chart` 仅供本地核对，不进入模型或报告；只有 `safeChart` 可进入下游。安全投影保留确认枚举，并用固定信任标签、存在标志和稳定 `provenanceRef` 证明审计材料存在，不复制任何来源名称、`raw`、`source` 或 `school` 文本。

## 判读顺序

1. 先核对输入来源和局盘完整性，任何错误先补录。
2. 再从 `safeChart` 选取 `status: confirmed` 的宫位与符号，不引用疑义状态。
3. 每个所选字段只附带对应宫位、存在标志与 `provenanceRef`；`source` 与 `school` 只留在审计层。
4. 原样采用并渲染 `REPORT_CONTRACT.evidenceRules` 与 `REPORT_CONTRACT.redlines`，本文件不改写。

证据表达逐条采用 `REPORT_CONTRACT.evidenceRules`，不在方法论内另写同义规则。

## 流派与行动边界

流派不同则在审计层并列原词、来源和各自推演口径，不选一派冒充唯一答案；报告只显示相应存在标志和引用。全部行动边界与免责声明逐条采用 `REPORT_CONTRACT.redlines` 和由 `disclaimerFor('奇门')` 生成的 `REPORT_CONTRACT.disclaimer`，本文件不维护另一套措辞。
