# 手相受控报告模板

## 输入契约

笔记中的手型、粗细、深浅、分叉、星纹和九宫星丘只作为可见结构或流派象征记录；报告不得把它们升级为寿命、疾病、真爱、必然桃花、财富、职位或超自然结果。

观察只提交客观结构：`id`、`hand`、`stage`、`featureType`、`subject`、`visualTraits`、`visibility`、`confidence`。`visualTraits` 必须来自 `VISUAL_TRAITS_BY_FEATURE[featureType]`；五行手型必须精确满足 `HAND_SHAPE_TRAITS[subject]`。特殊纹路必须包含受控 `locationType + locationSubject`，扩展纹路另附 HTTPS `source` 与短标签 `school`。

四个切面固定为 `career`、`relationships`、`health`、`wealth-social`，每个切面固定分为 `strengths` 与 `risks`。每条报告输入只能包含：

切面展示顺序固定为：事业（`career`）-> 感情（`relationships`）-> 健康（`health`）-> 财与人际（`wealth-social`）。`strengths` 展示天赋与优势，`risks` 展示短板与风险。

- `observationId`
- `interpretationCode`
- `actionCode`

每个 `interpretationCode` 只能引用其规则支持的 `featureType + subject + visualTraits`。`strengths` 或 `risks` 没有可靠证据时只提交：

```json
{ "interpretationCode": "no-confirmed-evidence" }
```

该固定码只能作为当前分组的唯一一项；契约若在全部 observations 中找到符合该切面与优势/风险分组规则的证据，会拒绝该码。

双手对照的每个 pair 只能包含：

- `leftObservationId`
- `rightObservationId`
- `comparisonCode`

代码值必须取自 `INTERPRETATION_CODES`、`ACTION_CODES` 与 `COMPARISON_CODES`。左右 ID 必须引用相同 `featureType + subject` 的可见观察。

## 输出契约

唯一用户输出是 `validatePalmContract(input).renderedReport`。契约内部固定生成：

- `coverageNotice`
- 完整 safe DTO `observations` 客观清单（按三看与左右手排序；扩展特殊纹路不输出自定义名称、`source`、`school`）
- 完整 `coverageManifest`（保留 `absent` / `not-visible`）
- 四切面的 `seen / basis / conclusion / action`
- 双手存在时的 `handComparison`
- `SAFE_HEALTH_TEXT`
- `REQUIRED_DISCLAIMER`

每条内容的展示顺序固定为：看到的（`seen`）-> 依据（`basis`）-> 结论（`conclusion`）-> 行动（`action`）。这些文字来自契约内部字典，不是宿主自由文本。

技能不得把输入代码直接展示给用户，不得在 `renderedReport` 前后追加自由判断，也不得改写固定健康文本、免责声明或一半覆盖提示。
