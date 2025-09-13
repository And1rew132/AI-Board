# Issue: Implement Comprehensive Testing Infrastructure

## Priority: High

## Description
The project currently has no testing infrastructure, which makes it difficult to ensure code quality, prevent regressions, and maintain confidence in changes. We need to establish a comprehensive testing setup.

## Current Issues
- No unit tests
- No integration tests
- No E2E tests
- No test coverage reporting
- No testing utilities or setup

## Proposed Solution

### 1. Unit Testing with Vitest
```bash
npm install --save-dev vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### 2. Example Tests to Create

#### Store Tests (`tests/stores/agents.test.ts`)
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentStore } from '@/stores/agents'

describe('Agent Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates an agent with correct data', () => {
    const store = useAgentStore()
    const agentData = {
      name: 'Test Agent',
      description: 'A test agent',
      type: 'autonomous' as const,
      status: 'active' as const,
      capabilities: [],
      config: {
        autonomyLevel: 'medium' as const,
        promptingStrategy: 'goal_oriented' as const,
        mcpEndpoints: [],
        storageAccess: false,
        collaboration: {
          canCreateProjects: true,
          canModifyOtherAgentWork: false,
          requiresApproval: false
        }
      },
      projects: []
    }

    const agent = store.createAgent(agentData)
    
    expect(agent).toBeDefined()
    expect(agent.name).toBe('Test Agent')
    expect(agent.id).toBeDefined()
    expect(store.agents).toHaveLength(1)
  })
})
```

#### Component Tests (`tests/components/AgentManager.test.ts`)
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AgentManager from '@/components/AgentManager.vue'

describe('AgentManager Component', () => {
  it('renders properly', () => {
    const wrapper = mount(AgentManager, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    expect(wrapper.text()).toContain('Agent Manager')
  })
})
```

#### Service Tests (`tests/services/openai.test.ts`)
```typescript
import { describe, it, expect, vi } from 'vitest'
import { OpenAIService } from '@/services/openai'

describe('OpenAI Service', () => {
  it('initializes correctly', () => {
    const service = new OpenAIService()
    expect(service.isConfigured()).toBe(false)
  })

  it('validates configuration properly', async () => {
    const service = new OpenAIService()
    const config = {
      apiKey: 'test-key',
      defaultModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    }
    
    // Mock the configure method for testing
    vi.spyOn(service, 'configure')
    await service.configure(config)
    
    expect(service.configure).toHaveBeenCalledWith(config)
  })
})
```

### 3. E2E Testing with Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
```

Example E2E test (`tests/e2e/agent-management.spec.ts`):
```typescript
import { test, expect } from '@playwright/test'

test('can create and manage agents', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to agent manager
  await page.click('text=Agents')
  
  // Create new agent
  await page.click('text=Create Agent')
  await page.fill('[data-testid="agent-name"]', 'Test Agent')
  await page.fill('[data-testid="agent-description"]', 'Test Description')
  await page.click('[data-testid="save-agent"]')
  
  // Verify agent was created
  await expect(page.locator('text=Test Agent')).toBeVisible()
})
```

### 4. Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 5. Testing Utilities
Create `tests/utils/test-helpers.ts`:
```typescript
import { createPinia, setActivePinia } from 'pinia'
import type { Agent, Project } from '@/types'

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
```

## Benefits
- Early bug detection
- Regression prevention
- Improved code quality
- Better refactoring confidence
- Documentation through tests
- CI/CD integration ready

## Test Coverage Goals
- Stores: 90%+ coverage
- Services: 85%+ coverage
- Components: 70%+ coverage
- Critical user flows: 100% E2E coverage

## Acceptance Criteria
- [ ] Vitest unit testing setup complete
- [ ] Playwright E2E testing setup complete
- [ ] Test utilities and helpers created
- [ ] Store tests implemented (agents, projects)
- [ ] Service tests implemented (openai, storage, mcp)
- [ ] Component tests for critical components
- [ ] E2E tests for main user flows
- [ ] Coverage reporting configured
- [ ] CI integration ready
- [ ] Testing documentation added to README

## Estimated Effort
Large (12-16 hours)