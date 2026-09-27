'use strict';

const { deepFreeze, isPlainObject } = require('../../skills/_shared/lib/objects');
const {
  BRANCH_ORDER,
  DIZHI,
  FIVE_ELEMENTS_CLASSES,
  LUCUN_BRANCH,
  PALACE_NAMES,
  STAR_SYSTEM,
  STEM_TRANSFORMATIONS,
  TIANMA_BRANCH,
  TIGER_STEM,
  TIANGAN,
  YANG_STEMS,
} = require('./constants');

const INPUT_LIMITS = Object.freeze({
  MAX_DECADES: 12,
  MAX_STARS_PER_PALACE: 8,
});

function mod(value, length = 12) {
  return ((value % length) + length) % length;
}

function assertInput(input) {
  if (!isPlainObject(input)) throw new TypeError('紫微斗数输入必须是普通对象');
  const required = ['lunarMonth', 'lunarDay', 'timeBranch', 'yearStem', 'yearBranch', 'gender'];
  required.forEach(field => {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      throw new Error(`紫微斗数缺少 ${field}`);
    }
  });
  if (!Number.isInteger(input.lunarMonth) || input.lunarMonth < 1 || input.lunarMonth > 12) {
    throw new Error(`lunarMonth 必须是 1~12 的整数，收到：${input.lunarMonth}`);
  }
  if (!Number.isInteger(input.lunarDay) || input.lunarDay < 1 || input.lunarDay > 30) {
    throw new Error(`lunarDay 必须是 1~30 的整数，收到：${input.lunarDay}`);
  }
  if (!DIZHI.includes(input.timeBranch)) throw new Error(`timeBranch 不是有效地支：${input.timeBranch}`);
  if (!TIANGAN.includes(input.yearStem)) throw new Error(`yearStem 不是有效天干：${input.yearStem}`);
  if (!DIZHI.includes(input.yearBranch)) throw new Error(`yearBranch 不是有效地支：${input.yearBranch}`);
  if (!['male', 'female'].includes(input.gender)) throw new Error(`gender 只能是 male 或 female：${input.gender}`);
  if (input.isLeapMonth !== undefined && typeof input.isLeapMonth !== 'boolean') {
    throw new Error(`isLeapMonth 必须是 boolean：${input.isLeapMonth}`);
  }
  if (input.options !== undefined && !isPlainObject(input.options)) {
    throw new Error('options 必须是普通对象');
  }
  const options = input.options || {};
  if (options.leapMonthPolicy !== undefined && options.leapMonthPolicy !== 'same-month') {
    throw new Error(`暂不支持的 leapMonthPolicy：${options.leapMonthPolicy}`);
  }
  if (options.transformationPolicy !== undefined && options.transformationPolicy !== 'traditional') {
    throw new Error(`暂不支持的 transformationPolicy：${options.transformationPolicy}`);
  }
}

function branchIndex(branch) {
  const index = BRANCH_ORDER.indexOf(branch);
  if (index < 0) throw new Error(`不是有效的紫微宫位地支：${branch}`);
  return index;
}

function palaceStemAt(yearStem, relativeIndex) {
  const tigerStem = TIGER_STEM[yearStem];
  return TIANGAN[mod(TIANGAN.indexOf(tigerStem) + relativeIndex, 10)];
}

function soulAndBody({ lunarMonth, timeBranch, yearStem }) {
  const timeIndex = branchIndex(timeBranch);
  const monthIndex = lunarMonth - 1;
  const soulIndex = mod(monthIndex - timeIndex);
  const bodyIndex = mod(monthIndex + timeIndex);
  return {
    soulIndex,
    bodyIndex,
    timeIndex,
    soulBranch: BRANCH_ORDER[soulIndex],
    bodyBranch: BRANCH_ORDER[bodyIndex],
    soulStem: palaceStemAt(yearStem, soulIndex),
  };
}

function fiveElementsClass(stem, branch) {
  const stemIndex = TIANGAN.indexOf(stem);
  const branchIndexFrom子 = DIZHI.indexOf(branch);
  if (stemIndex < 0 || branchIndexFrom子 < 0) throw new Error('命宫干支无效，无法定五行局');
  const stemNumber = Math.floor(stemIndex / 2) + 1;
  const branchNumber = Math.floor(mod(branchIndexFrom子, 6) / 2) + 1;
  let key = stemNumber + branchNumber;
  while (key > 5) key -= 5;
  return FIVE_ELEMENTS_CLASSES[key];
}

function ziweiAndTianfu(lunarDay, bureauValue) {
  let offset = 0;
  while (mod(lunarDay + offset, bureauValue) !== 0) offset += 1;
  const quotient = ((lunarDay + offset) / bureauValue) % 12;
  let ziweiIndex = mod(quotient - 1);
  ziweiIndex = mod(ziweiIndex + (offset % 2 === 0 ? offset : -offset));
  return { ziweiIndex, tianfuIndex: mod(12 - ziweiIndex) };
}

function pushStar(palaces, index, name, scope = '本命') {
  if (!name) return;
  const palace = palaces[index];
  if (palace.stars.length >= INPUT_LIMITS.MAX_STARS_PER_PALACE) {
    throw new Error(`宫位 ${palace.地支} 星曜数量超过上限`);
  }
  palace.stars.push({ name, scope, 四化: null });
}

function placeMainStars(palaces, ziweiIndex, tianfuIndex) {
  STAR_SYSTEM.紫微系.forEach((name, offset) => pushStar(palaces, mod(ziweiIndex - offset), name));
  STAR_SYSTEM.天府系.forEach((name, offset) => pushStar(palaces, mod(tianfuIndex + offset), name));
}

function placeAuxiliaryStars(palaces, yearStem, yearBranch) {
  const luIndex = branchIndex(LUCUN_BRANCH[yearStem]);
  pushStar(palaces, luIndex, '禄存', '辅星');
  pushStar(palaces, mod(luIndex + 1), '擎羊', '煞曜');
  pushStar(palaces, mod(luIndex - 1), '陀罗', '煞曜');
  pushStar(palaces, branchIndex(TIANMA_BRANCH[yearBranch]), '天马', '辅星');
}

function addTransformations(palaces, yearStem) {
  const mapping = STEM_TRANSFORMATIONS[yearStem];
  Object.entries(mapping).forEach(([label, starName]) => {
    palaces.forEach(palace => {
      palace.stars.forEach(star => {
        if (star.name === starName) star.四化 = label;
      });
    });
  });
  return Object.freeze(Object.entries(mapping).map(([label, star]) => ({ 星曜: star, 四化: label })));
}

function buildDecades({ soulIndex, yearStem, gender, bureauValue }) {
  const isForward = (YANG_STEMS.includes(yearStem) && gender === 'male')
    || (!YANG_STEMS.includes(yearStem) && gender === 'female');
  const direction = isForward ? 1 : -1;
  return Array.from({ length: INPUT_LIMITS.MAX_DECADES }, (_, index) => {
    const startAge = bureauValue + index * 10;
    return Object.freeze({
      序号: index + 1,
      宫位索引: mod(soulIndex + direction * index),
      起始虚岁: startAge,
      结束虚岁: startAge + 9,
      顺逆: isForward ? '顺行' : '逆行',
    });
  });
}

function createPalaces({ soulIndex, bodyIndex, yearStem }) {
  return Array.from({ length: 12 }, (_, index) => ({
    索引: index,
    宫名: PALACE_NAMES[mod(index - soulIndex)],
    天干: palaceStemAt(yearStem, index),
    地支: BRANCH_ORDER[index],
    命宫: index === soulIndex,
    身宫: index === bodyIndex,
    关系: {
      三方: [4, 8].map(offset => BRANCH_ORDER[mod(index + offset)]),
      对宫: BRANCH_ORDER[mod(index + 6)],
      四正: [0, 4, 6, 8].map(offset => BRANCH_ORDER[mod(index + offset)]),
    },
    星曜: [],
    stars: [],
  }));
}

function simplifyPalaces(palaces) {
  return palaces.map(palace => {
    const { stars, ...rest } = palace;
    return {
      ...rest,
      星曜: stars.map(star => ({ ...star })),
    };
  });
}

function ziweiChart(input) {
  assertInput(input);
  const soulBody = soulAndBody(input);
  const bureau = fiveElementsClass(soulBody.soulStem, soulBody.soulBranch);
  const { ziweiIndex, tianfuIndex } = ziweiAndTianfu(input.lunarDay, bureau.value);
  const palaces = createPalaces(soulBody);
  placeMainStars(palaces, ziweiIndex, tianfuIndex);
  placeAuxiliaryStars(palaces, input.yearStem, input.yearBranch);
  const transformations = addTransformations(palaces, input.yearStem);
  const result = {
    status: 'ready',
    schemaVersion: 1,
    输入: {
      农历月份: input.lunarMonth,
      农历日: input.lunarDay,
      时支: input.timeBranch,
      生年干: input.yearStem,
      生年支: input.yearBranch,
      性别: input.gender,
      闰月: input.isLeapMonth === true,
    },
    命身: {
      命宫: soulBody.soulBranch,
      身宫: soulBody.bodyBranch,
      命宫天干: soulBody.soulStem,
    },
    五行局: bureau,
    安星: {
      紫微宫位: BRANCH_ORDER[ziweiIndex],
      天府宫位: BRANCH_ORDER[tianfuIndex],
      四化: transformations,
    },
    宫位: simplifyPalaces(palaces),
    三方四正: Object.fromEntries(palaces.map(palace => [palace.宫名, palace.关系])),
    大限: buildDecades({
      soulIndex: soulBody.soulIndex,
      yearStem: input.yearStem,
      gender: input.gender,
      bureauValue: bureau.value,
    }),
    规则说明: [
      '命宫按寅起正月、顺数生月、逆数生时；身宫改为顺数生时。',
      '五行局按命宫干支的干支取数定局，紫微与天府按农历日和五行局安置。',
      '闰月按同月宫位处理；如需其他口径，应通过独立策略配置并列输出。',
      '四化采用生年天干常见口径；不同流派可能存在星曜与四化差异，应并列说明。',
    ],
  };
  return deepFreeze(result);
}

function format(chart) {
  if (!chart || !chart.命身) return JSON.stringify(chart, null, 2);
  const lines = [
    `命宫：${chart.命身.命宫天干}${chart.命身.命宫}；身宫：${chart.命身.身宫}`,
    `五行局：${chart.五行局.name}`,
    `紫微：${chart.安星.紫微宫位}；天府：${chart.安星.天府宫位}`,
    `四化：${chart.安星.四化.map(item => `${item.星曜}${item.四化}`).join('、')}`,
    '十二宫：',
    ...chart.宫位.map(palace => `${palace.宫名}（${palace.天干}${palace.地支}）${palace.星曜.map(star => `${star.name}${star.四化 || ''}`).join('、')}`),
  ];
  return lines.join('\n');
}

module.exports = {
  format,
  fiveElementsClass,
  soulAndBody,
  ziweiChart,
};
