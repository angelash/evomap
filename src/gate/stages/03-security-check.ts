/**
 * Stage 3: Security Policy Check
 * 检测危险命令、外连命令、验证计划白名单
 */

import { createPolicyError } from '../../errors/index.js';
import type { GateContext, SecurityReport } from '../types.js';

// 预置验证计划白名单
const ALLOWED_VALIDATION_TASKS = new Set([
  'build_win64',
  'build_linux',
  'build_macos',
  'run_unit_tests',
  'run_integration_tests',
  'lint_ts',
  'lint_cpp',
  'format_check',
  'static_analysis',
]);

// 危险命令模式
const DANGEROUS_COMMAND_PATTERNS = [
  /;\s*curl/i,
  /;\s*wget/i,
  /;\s*powershell/i,
  /;\s*pwsh/i,
  /;\s*bash/i,
  /;\s*sh/i,
  /;\s*cmd/i,
  /;\s*eval/i,
  /;\s*exec/i,
  /\|\s*curl/i,
  /\|\s*wget/i,
  /\|\s*powershell/i,
  /\|\s*pwsh/i,
  /\|\s*bash/i,
  /\|\s*sh/i,
  /\|\s*cmd/i,
  /\|\s*eval/i,
  /\|\s*exec/i,
  />\s*\//i,
  />\s*\\\s*/i,
];

// 外连命令模式
const EXTERNAL_CONNECTION_PATTERNS = [
  /curl\s+/i,
  /wget\s+/i,
  /powershell\s+.*invoke-webrequest/i,
  /pwsh\s+.*invoke-webrequest/i,
  /http(s)?:\/\//i,
  /ftp:\/\//i,
];

export async function executeStageSecurityCheck(
  context: GateContext,
  config: { blast_radius_limits: { max_files: number; max_lines: number } },
  signal: AbortSignal
): Promise<SecurityReport> {
  if (signal.aborted) {
    throw createPolicyError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  if (!context.parsed_bundle) {
    throw createPolicyError('E_SCHEMA_MISSING_FIELD', 'Parsed bundle not available');
  }

  const { gene, capsule } = context.parsed_bundle;
  const report: SecurityReport = {
    validation_plan_safe: true,
    dangerous_commands: [],
    external_commands: [],
    blast_radius_safe: true,
    risk_level: 'low',
    notes: [],
  };

  // 1. 验证计划白名单检查
  const validationPlan = gene.validation_plan;
  for (const task of validationPlan.tasks) {
    if (!ALLOWED_VALIDATION_TASKS.has(task.name)) {
      report.validation_plan_safe = false;
      report.dangerous_commands.push(task.name);
      report.notes.push(`Validation task "${task.name}" not in whitelist`);
    }
  }

  // 2. 检测危险命令（从 patch 和 validation_plan 中）
  const dangerousCommands = detectDangerousCommands(context);
  report.dangerous_commands.push(...dangerousCommands);

  // 3. 检测外连命令
  const externalCommands = detectExternalConnections(context);
  report.external_commands.push(...externalCommands);

  // 4. 校验 blast_radius 阈值
  if (capsule && capsule.blast_radius) {
    if (capsule.blast_radius.files > config.blast_radius_limits.max_files) {
      report.blast_radius_safe = false;
      report.notes.push(
        `Blast radius files (${capsule.blast_radius.files}) exceeds limit (${config.blast_radius_limits.max_files})`
      );
    }

    if (capsule.blast_radius.lines > config.blast_radius_limits.max_lines) {
      report.blast_radius_safe = false;
      report.notes.push(
        `Blast radius lines (${capsule.blast_radius.lines}) exceeds limit (${config.blast_radius_limits.max_lines})`
      );
    }
  }

  // 5. 计算风险等级
  report.risk_level = calculateRiskLevel(report);

  console.log(`[Stage 3] Security check for gate=${context.gate_id}, risk=${report.risk_level}`);
  return report;
}

/**
 * 检测危险命令
 */
function detectDangerousCommands(context: GateContext): string[] {
  const commands: string[] = [];

  // 检查 validation_plan 中的命令
  if (context.parsed_bundle?.gene.validation_plan.tasks) {
    for (const task of context.parsed_bundle.gene.validation_plan.tasks) {
      if (task.command) {
        for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
          if (pattern.test(task.command)) {
            commands.push(task.command);
            break;
          }
        }
      }
    }
  }

  // 检查 patch 内容（TODO: 实现后启用）
  // if (context.parsed_bundle?.artifacts.patch) {
  //   const patchContent = context.parsed_bundle.artifacts.patch.toString();
  //   for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
  //     if (pattern.test(patchContent)) {
  //       commands.push('patch:' + pattern.source);
  //     }
  //   }
  // }

  return commands;
}

/**
 * 检测外连命令
 */
function detectExternalConnections(context: GateContext): string[] {
  const commands: string[] = [];

  // 检查 validation_plan 中的命令
  if (context.parsed_bundle?.gene.validation_plan.tasks) {
    for (const task of context.parsed_bundle.gene.validation_plan.tasks) {
      if (task.command) {
        for (const pattern of EXTERNAL_CONNECTION_PATTERNS) {
          if (pattern.test(task.command)) {
            commands.push(task.command);
            break;
          }
        }
      }
    }
  }

  return commands;
}

/**
 * 计算风险等级
 */
function calculateRiskLevel(report: SecurityReport): 'low' | 'medium' | 'high' | 'critical' {
  let riskScore = 0;

  // 验证计划不安全
  if (!report.validation_plan_safe) {
    riskScore += 3;
  }

  // 危险命令数量
  riskScore += Math.min(report.dangerous_commands.length * 2, 4);

  // 外连命令数量
  riskScore += Math.min(report.external_commands.length * 3, 6);

  // blast_radius 超限
  if (!report.blast_radius_safe) {
    riskScore += 2;
  }

  if (riskScore >= 8) {
    return 'critical';
  } else if (riskScore >= 5) {
    return 'high';
  } else if (riskScore >= 2) {
    return 'medium';
  } else {
    return 'low';
  }
}
