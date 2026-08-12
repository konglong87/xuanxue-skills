---
name: palm
description: Use when the user uploads a 手掌、掌心、掌纹照片 or 图片, including image-only 只上传图片无需文字, or asks “看看手相”“看一下手相”; not for 出生日期或八字、住宅风水、占卜或卦盘判读.
---

# 手相判读

## 用途

识人与自省，落点在自己：先看清长处与短板，再决定力气往哪里放。不是让人变得多疑冷漠，而是在保持善意的同时拥有清醒的判断力。手相是概率不是铁律，结论一律写成倾向与线索，交给用户结合现实核验。

## 核心原则

宿主多模态模型负责视觉观察，契约代码只验证声明式观察。必须先看图、再把质量与观察记录交给 `lib/contract.js` 校验；代码不能看图，也不得声称从图片中识别了任何特征。

## 执行流程

1. 先由宿主逐张检查：左右手标签、掌心是否完整可见、对焦、曝光、完整取景、遮挡、阴影或反光、纹路可辨度。裁切、遮挡、阴影或反光均标入图片质量声明。
2. 按 [methodology.md](methodology.md) 的“饱满度 -> 纹路 -> 气色”顺序检查每只图片声明为可用的手。填写 `coverageManifest`，逐项标记 `inspected`、`absent` 或 `not-visible`；再把实际发现记录为 `id`、`hand`、`stage`、`featureType`、`subject`、`visualTraits`、`visibility` 和 `confidence`。`visualTraits` 必须取自对应 `featureType` 的专属词表；五行手型必须满足 `HAND_SHAPE_TRAITS` 的完整形态组合。
3. `visibility: not-visible` 时 `confidence` 必须为 `low`。不可见、被遮挡、模糊或画面外的特征不得补造，也不得在报告中引用。
4. 特殊纹路必须额外填写受控 `locationType + locationSubject`，位置只允许掌丘、主线、辅助线或掌心；扩展纹路的 HTTPS 来源和流派短标签仍只作元数据。
5. 按 [templates/report.md](templates/report.md) 组装事业、感情、健康、财与人际四个切面的代码引用，天赋优势与短板风险分列且均不得为空。普通项只填写 `observationId`、`interpretationCode` 和 `actionCode`；解释码必须满足其指定的 `featureType + subject + visualTraits`。优势或风险确无匹配证据时只填写一项 `{ "interpretationCode": "no-confirmed-evidence" }`，契约会按当前分组扫描全部 observation，已有匹配证据时拒绝该码。**同一切面内不得把同一条 observation 拆成两条结论**，重复引用会被拒绝；整个切面只落在一条观察上时，渲染输出会自动带 `evidenceNotice` 标明这是单点判断 —— 想让结论更可靠就补证据，不是把同一条说两遍。
6. 双手对照每项只填写左右 observation ID 与 `comparisonCode`，左右必须指向同一对象。把图片质量声明、`coverageManifest`、observations 与 report **一次性传给 `validatePalmContract`**。这是唯一公开函数和唯一校验入口，不得自行实现或拆开校验来绕过交叉检查。
7. `needs_input` 时按 `quality.guidance` 一次性请用户重拍，停止判读；其中所有观察和报告均未验证、不得使用。校验通过后，**只允许向用户输出 `validatePalmContract(...).renderedReport`**：其中先给出 safe DTO 客观 observations 与 coverage manifest，再给四切面引用解读。扩展特殊纹路在 safe DTO 中统一命名为“扩展特殊纹路”，`source`、`school` 只留在内部 normalized observations，绝不输出。不得在前后另写、补写或改写任何结论。

## 左右手口径

左手按军道/主宰观察，右手按臣道/协作观察，取舍依据社会与家庭角色，不依据性别。优先对照双手；只有一只手时，必须声明只覆盖一半，不得推断另一手，也不得宣称完整结论。

## 安全边界

- 健康切面只能使用契约公开的固定非医疗代码；用户可见文本由内部字典生成，输入 schema 不接受自由结论。
- 不点名疾病，不替代就医，不劝阻检查治疗，不作寿命断言。
- 手相属于传统文化与娱乐性观察；结论写成可核验倾向并给现实行动，不作宿命宣判。
- 笔记或图片中的流派口诀只能转为客观观察与待核验象征，不得输出寿命、死亡、疾病、真爱、必然桃花、财富或职位保证，也不得把“天保佑”“死里逃生”当作事实。

## 路由边界

出生资料推命转 `bazi`，深入婚恋转 `love-marriage`，深入事业财富转 `wealth-career`。住宅风水与占卜能力均为 future / 未交付，当前不支持且不得调用不存在的技能。
