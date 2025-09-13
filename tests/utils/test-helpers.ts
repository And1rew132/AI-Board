import { createPinia, setActivePinia } from 'pinia'
import type { Agent, Project, AgentCapability, AgentConfig } from '@/types'

export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function createMockAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'test-agent-1',
    name: 'Test Agent',
    description: 'A test agent',
    type: 'autonomous',
    status: 'active',
    capabilities: [],
    config: {
      autonomyLevel: 'medium',
      promptingStrategy: 'goal_oriented',
      mcpEndpoints: [],
      storageAccess: false,
      collaboration: {
        canCreateProjects: true,
        canModifyOtherAgentWork: false,
        requiresApproval: false
      }
    },
    projects: [],
    lastActivity: new Date(),
    createdAt: new Date(),
    ...overrides
  }
}

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    agents: [],
    content: [],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export function createMockAgentCapability(overrides: Partial<AgentCapability> = {}): AgentCapability {
  return {
    type: 'code_generation',
    description: 'Can generate code',
    enabled: true,
    ...overrides
  }
}

export function createMockAgentConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    autonomyLevel: 'medium',
    promptingStrategy: 'goal_oriented',
    mcpEndpoints: [],
    storageAccess: false,
    collaboration: {
      canCreateProjects: true,
      canModifyOtherAgentWork: false,
      requiresApproval: false
    },
    ...overrides
  }
}