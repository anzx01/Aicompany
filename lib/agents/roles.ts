/**
 * Agent Roles - Compatibility Layer
 *
 * This file provides a compatibility layer for tests and external modules
 * that expect roles to be in lib/agents/roles.ts
 */

import { AgentRole } from '@/lib/agent/roles/types';
import { ROLE_CONFIGS, AgentRoleExecutor } from '@/lib/agent/roles';
import type { CompanyType } from '@/lib/platform/types';

/**
 * Get agent configuration by role
 */
export function getAgentConfig(role: AgentRole) {
  return AgentRoleExecutor.getRoleConfig(role);
}

/**
 * Get all agents for a company type
 */
export function getAgentsByCompanyType(companyType: CompanyType): AgentRole[] {
  return AgentRoleExecutor.getRolesForCompanyType(companyType);
}

/**
 * Export AgentRole type
 */
export type { AgentRole };

/**
 * Export all role configs
 */
export { ROLE_CONFIGS };
