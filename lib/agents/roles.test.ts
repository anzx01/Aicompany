/**
 * Agent Role Configuration Tests
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the LLM module to avoid Anthropic client initialization
vi.mock('@/lib/llm', () => ({
  generateText: vi.fn(),
  generateStructuredOutput: vi.fn(),
  generateEmbedding: vi.fn(),
}));

import { getAgentConfig, getAgentsByCompanyType, ROLE_CONFIGS } from '@/lib/agents/roles';
import type { CompanyType } from '@/lib/platform/types';

describe('Agent Roles', () => {
  describe('getAgentConfig', () => {
    it('should return config for valid role', () => {
      const config = getAgentConfig('CEO');

      expect(config).toBeDefined();
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.systemPrompt).toBeTruthy();
    });

    it('should return config for all roles', () => {
      const roles = Object.keys(ROLE_CONFIGS);

      roles.forEach((role) => {
        const config = getAgentConfig(role as any);
        expect(config).toBeDefined();
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.systemPrompt).toBeTruthy();
      });
    });
  });

  describe('getAgentsByCompanyType', () => {
    it('should return correct agents for MARKETING company', () => {
      const agents = getAgentsByCompanyType('MARKETING');

      expect(agents).toContain('CEO');
      expect(agents.length).toBeGreaterThan(1);
    });

    it('should return correct agents for CONTENT company', () => {
      const agents = getAgentsByCompanyType('CONTENT');

      expect(agents).toContain('CEO');
      expect(agents.length).toBeGreaterThan(1);
    });

    it('should return correct agents for CUSTOMER_SERVICE company', () => {
      const agents = getAgentsByCompanyType('CUSTOMER_SERVICE');

      expect(agents).toContain('CEO');
      expect(agents.length).toBeGreaterThan(1);
    });

    it('should return correct agents for DEVELOPMENT company', () => {
      const agents = getAgentsByCompanyType('DEVELOPMENT');

      expect(agents).toContain('CEO');
      expect(agents.length).toBeGreaterThan(1);
    });

    it('should always include CEO for all company types', () => {
      const companyTypes: CompanyType[] = [
        'MARKETING',
        'CONTENT',
        'CUSTOMER_SERVICE',
        'DEVELOPMENT',
      ];

      companyTypes.forEach((type) => {
        const agents = getAgentsByCompanyType(type);
        expect(agents).toContain('CEO');
      });
    });

    it('should return unique agents', () => {
      const agents = getAgentsByCompanyType('MARKETING');
      const uniqueAgents = [...new Set(agents)];

      expect(agents.length).toBe(uniqueAgents.length);
    });
  });

  describe('Agent Role Completeness', () => {
    it('should have all roles defined in AgentRole enum', () => {
      const roles = Object.keys(ROLE_CONFIGS);

      expect(roles.length).toBeGreaterThan(10);
      expect(roles).toContain('CEO');
    });

    it('should have system prompts for all roles', () => {
      const roles = Object.keys(ROLE_CONFIGS);

      roles.forEach((role) => {
        const config = getAgentConfig(role as any);
        expect(config.systemPrompt.length).toBeGreaterThan(50);
      });
    });
  });
});
