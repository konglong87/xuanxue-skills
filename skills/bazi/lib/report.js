'use strict';

const { deepFreeze } = require('../../_shared/lib/objects');
const { standardReport } = require('../../_shared/report');
const { EVIDENCE_RULES } = require('../../_shared/safety');

function buildReport(result) {
  if (!result || result.status !== 'ready') return result;
  const calculation = result.calculation;
  const pillars = calculation.四柱结果;
  const cycles = calculation.起运大运;
  return deepFreeze({
    status: 'ready',
    sections: [...(result.analysisContext?.报告契约?.章节 || [])],
    输入与口径: result.input,
    计算核验: {
      模式: result.research?.模式 || 'research',
      版本: result.research?.版本 || 1,
      计算计划: result.research?.计算计划 || null,
      一致性校验: result.research?.一致性校验 || null,
    },
    综合: {
      算出: `四柱为 ${pillars.年}、${pillars.月}、${pillars.日}、${pillars.时}`,
      依据: pillars.采用规则.说明,
      可供判读: '日主作为观察原点，四柱提供阶段、环境与关系结构的符号证据。',
    },
    性格与资源: {
      算出: calculation.命盘详情.十神统计,
      依据: '十神由日干与其余天干、藏干的五行生克及阴阳关系确定。',
      可供判读: '用于观察支持、产出、约束、资源掌控与同侪互动。',
      建议行动: '选一项现实目标，用经历记录核验资源与代价。',
    },
    事业财运概览: {
      算出: calculation.命盘详情.五行统计,
      依据: calculation.命盘详情.五行统计.说明,
      可供判读: '本节只作结构概览，不保证职业结果、收入或投资收益。',
      建议行动: '用工作反馈和收支记录核验，不把象征关系当作结果保证。',
    },
    婚恋概览: {
      算出: calculation.命盘详情.地支关系,
      依据: '关系项来自地支结构与十神证据。',
      可供判读: '只讨论互动倾向，不断言必婚、必离或他人事实。',
      建议行动: '把倾向转成沟通问题，在真实互动中核验。',
    },
    阶段趋势: {
      算出: {
        主派完整命盘: calculation,
        另一派完整命盘: result.alternateCalculation,
        起运大运: cycles,
        目标流年: calculation.目标流年,
      },
      依据: '大运顺逆取年干阴阳与性别，起运保留既定折算口径。',
      可供判读: '阶段信息用于提出窗口与风险假设，不直接断言具体事件。',
      建议行动: '把阶段假设与项目、关系和收支记录逐项核验。',
    },
    流派差异: {
      换日主派: pillars.采用规则.dayBoundary,
      换日另一派: result.alternateCalculation
        ? result.alternateCalculation.四柱结果.采用规则.dayBoundary
        : null,
      说明: result.alternateCalculation
        ? '两套命盘独立保留，后续判读不得跨派拼接。'
        : '本例两种换日口径结果相同。',
      方法: result.analysisContext?.流派方法 || {},
    },
    免责声明: result.analysisContext?.报告契约?.免责声明 || [],
  });
}

function toStandardReport(result) {
  if (!result || result.status !== 'ready') {
    return standardReport({
      status: result?.status || 'needs_input',
      input: result?.input,
      missing: result?.missing || [],
      questions: result?.questions || [],
      boundaries: result?.analysisContext?.报告契约?.免责声明 || [],
    });
  }
  const report = buildReport(result);
  return standardReport({
    input: report.输入与口径,
    calculated: [report.综合.算出, report.阶段趋势.算出],
    evidence: [
      ...EVIDENCE_RULES,
      report.计算核验,
      ...(result.research?.证据包 || []),
      report.综合.依据,
      report.性格与资源.依据,
    ],
    interpretation: [report.综合.可供判读, report.事业财运概览.可供判读],
    actions: [report.阶段趋势.建议行动, report.婚恋概览.建议行动],
    boundaries: report.免责声明,
  });
}

module.exports = { buildReport, toStandardReport };
