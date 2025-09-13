import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentStore } from '@/stores/agents'
import { createMockAgent, createMockAgentConfig } from '../utils/test-helpers'

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
      config: createMockAgentConfig(),
      projects: []
    }

    const agent = store.createAgent(agentData)
    
    expect(agent).toBeDefined()
    expect(agent.name).toBe('Test Agent')
    expect(agent.id).toBeDefined()
    expect(agent.createdAt).toBeInstanceOf(Date)
    expect(agent.lastActivity).toBeInstanceOf(Date)
    expect(store.agents).toHaveLength(1)
  })

  it('updates an agent correctly', () => {
    const store = useAgentStore()
    const agent = createMockAgent()
    store.agents.push(agent)

    store.updateAgent(agent.id, { name: 'Updated Agent', status: 'busy' })

    const updatedAgent = store.agents.find(a => a.id === agent.id)
    expect(updatedAgent?.name).toBe('Updated Agent')
    expect(updatedAgent?.status).toBe('busy')
    expect(updatedAgent?.lastActivity).toBeInstanceOf(Date)
  })

  it('deletes an agent correctly', () => {
    const store = useAgentStore()
    const agent = createMockAgent()
    store.agents.push(agent)

    expect(store.agents).toHaveLength(1)
    
    store.deleteAgent(agent.id)
    
    expect(store.agents).toHaveLength(0)
  })

  it('filters active agents correctly', () => {
    const store = useAgentStore()
    const activeAgent = createMockAgent({ status: 'active' })
    const idleAgent = createMockAgent({ id: 'agent-2', status: 'idle' })
    
    store.agents.push(activeAgent, idleAgent)
    
    expect(store.activeAgents).toHaveLength(1)
    expect(store.activeAgents[0].id).toBe(activeAgent.id)
  })

  it('filters autonomous agents correctly', () => {
    const store = useAgentStore()
    const autonomousAgent = createMockAgent({ type: 'autonomous', status: 'active' })
    const reactiveAgent = createMockAgent({ id: 'agent-2', type: 'reactive', status: 'active' })
    
    store.agents.push(autonomousAgent, reactiveAgent)
    
    expect(store.autonomousAgents).toHaveLength(1)
    expect(store.autonomousAgents[0].id).toBe(autonomousAgent.id)
  })

  it('creates and manages tasks', () => {
    const store = useAgentStore()
    const agent = createMockAgent()
    store.agents.push(agent)

    const taskData = {
      agentId: agent.id,
      projectId: 'test-project',
      description: 'Test task',
      status: 'pending' as const,
      type: 'code_generation' as const,
      priority: 'medium' as const,
      dependencies: []
    }

    const task = store.createTask(taskData)
    
    expect(task).toBeDefined()
    expect(task.id).toBeDefined()
    expect(task.createdAt).toBeInstanceOf(Date)
    expect(store.tasks).toHaveLength(1)
  })

  it('gets tasks for specific agent', () => {
    const store = useAgentStore()
    const agent1 = createMockAgent({ id: 'agent-1' })
    const agent2 = createMockAgent({ id: 'agent-2' })
    
    store.agents.push(agent1, agent2)
    
    const task1 = store.createTask({
      agentId: agent1.id,
      projectId: 'test-project',
      description: 'Task for agent 1',
      status: 'pending',
      type: 'code_generation',
      priority: 'medium',
      dependencies: []
    })
    
    const task2 = store.createTask({
      agentId: agent2.id,
      projectId: 'test-project',
      description: 'Task for agent 2',
      status: 'pending',
      type: 'code_generation',
      priority: 'medium',
      dependencies: []
    })

    const agent1Tasks = store.getTasksForAgent(agent1.id)
    expect(agent1Tasks).toHaveLength(1)
    expect(agent1Tasks[0].id).toBe(task1.id)
  })

  it('manages MCP endpoints', () => {
    const store = useAgentStore()
    
    const endpointData = {
      name: 'Test Endpoint',
      url: 'http://localhost:3000',
      type: 'api_gateway' as const,
      capabilities: ['search', 'retrieve'],
      isActive: true
    }

    const endpoint = store.addMCPEndpoint(endpointData)
    
    expect(endpoint).toBeDefined()
    expect(endpoint.id).toBeDefined()
    expect(store.mcpEndpoints).toHaveLength(1)
    expect(store.getActiveMCPEndpoints()).toHaveLength(1)
  })

  it('updates MCP endpoints', () => {
    const store = useAgentStore()
    
    const endpoint = store.addMCPEndpoint({
      name: 'Test Endpoint',
      url: 'http://localhost:3000',
      type: 'api_gateway',
      capabilities: ['search'],
      isActive: true
    })

    store.updateMCPEndpoint(endpoint.id, { isActive: false })
    
    const updatedEndpoint = store.mcpEndpoints.find(e => e.id === endpoint.id)
    expect(updatedEndpoint?.isActive).toBe(false)
    expect(store.getActiveMCPEndpoints()).toHaveLength(0)
  })
})