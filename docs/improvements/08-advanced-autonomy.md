# Issue: Implement Advanced Agent Autonomy Features

## Priority: Medium

## Description
The agent autonomy features are partially implemented. We need to complete the autonomous agent system with scheduled execution, self-prompting, task prioritization, and learning capabilities.

## Current State
- Basic agent types defined (autonomous, reactive, collaborative)
- OpenAI integration for agent prompting
- Simple task creation and execution
- Agent status monitoring

## Missing Features
- Scheduled autonomous execution
- Agent learning and memory
- Task prioritization algorithms
- Multi-agent collaboration workflows
- Agent performance metrics
- Self-improvement capabilities

## Proposed Solution

### 1. Autonomous Agent Scheduler

Create `src/services/agent-scheduler.ts`:
```typescript
import { useAgentStore } from '@/stores/agents'
import { eventBus } from '@/services/event-bus'

export interface ScheduledTask {
  id: string
  agentId: string
  type: 'autonomous_prompt' | 'task_execution' | 'maintenance'
  scheduledAt: Date
  interval?: number // minutes
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'running' | 'completed' | 'failed'
  lastRun?: Date
  nextRun?: Date
}

export class AgentScheduler {
  private static instance: AgentScheduler
  private scheduledTasks: ScheduledTask[] = []
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  static getInstance(): AgentScheduler {
    if (!AgentScheduler.instance) {
      AgentScheduler.instance = new AgentScheduler()
    }
    return AgentScheduler.instance
  }

  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.scheduleAgentTasks()
    
    // Check for new agents every minute
    setInterval(() => {
      this.scheduleAgentTasks()
    }, 60000)

    eventBus.emit({
      type: 'notification',
      source: 'scheduler',
      data: { action: 'started' },
      severity: 'info',
      message: 'Agent scheduler started'
    })
  }

  stop(): void {
    this.isRunning = false
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()

    eventBus.emit({
      type: 'notification',
      source: 'scheduler',
      data: { action: 'stopped' },
      severity: 'info',
      message: 'Agent scheduler stopped'
    })
  }

  private scheduleAgentTasks(): void {
    const agentStore = useAgentStore()
    const autonomousAgents = agentStore.autonomousAgents

    autonomousAgents.forEach(agent => {
      if (!agent.runInterval) return

      const existingTask = this.scheduledTasks.find(
        task => task.agentId === agent.id && task.type === 'autonomous_prompt'
      )

      if (!existingTask) {
        this.scheduleAutonomousPrompt(agent.id, agent.runInterval)
      }
    })
  }

  private scheduleAutonomousPrompt(agentId: string, intervalMinutes: number): void {
    const task: ScheduledTask = {
      id: this.generateId(),
      agentId,
      type: 'autonomous_prompt',
      scheduledAt: new Date(),
      interval: intervalMinutes,
      priority: 'medium',
      status: 'pending',
      nextRun: new Date(Date.now() + intervalMinutes * 60000)
    }

    this.scheduledTasks.push(task)

    const timer = setTimeout(async () => {
      await this.executeAutonomousPrompt(task)
      
      // Reschedule if agent still exists and is autonomous
      const agentStore = useAgentStore()
      const agent = agentStore.agents.find(a => a.id === agentId)
      
      if (agent && agent.type === 'autonomous' && agent.status === 'active') {
        this.scheduleAutonomousPrompt(agentId, intervalMinutes)
      }
    }, intervalMinutes * 60000)

    this.timers.set(task.id, timer)
  }

  private async executeAutonomousPrompt(task: ScheduledTask): Promise<void> {
    const agentStore = useAgentStore()
    
    try {
      task.status = 'running'
      task.lastRun = new Date()

      // Generate and execute autonomous prompt
      const prompt = await agentStore.generateAutonomousPrompt(
        agentStore.agents.find(a => a.id === task.agentId)!
      )

      // Create a task for the agent to execute
      const agentTask = agentStore.createTask({
        agentId: task.agentId,
        projectId: agentStore.agents.find(a => a.id === task.agentId)?.projects[0] || '',
        type: 'create_content',
        description: prompt.content,
        status: 'pending',
        priority: 'medium',
        dependencies: []
      })

      // Execute the task
      await agentStore.executeTaskWithOpenAI(agentTask)

      task.status = 'completed'

      eventBus.emit({
        type: 'agent_action',
        source: `agent-${task.agentId}`,
        data: { 
          taskId: agentTask.id,
          promptId: prompt.id,
          action: 'autonomous_execution'
        },
        severity: 'success',
        message: `Agent executed autonomous task: ${prompt.content.slice(0, 50)}...`
      })

    } catch (error: any) {
      task.status = 'failed'
      
      eventBus.emit({
        type: 'error',
        source: `agent-${task.agentId}`,
        data: { 
          error: error.message,
          taskId: task.id
        },
        severity: 'error',
        message: `Autonomous agent execution failed: ${error.message}`
      })
    }

    // Remove completed timer
    this.timers.delete(task.id)
  }

  getScheduledTasks(agentId?: string): ScheduledTask[] {
    return agentId 
      ? this.scheduledTasks.filter(task => task.agentId === agentId)
      : this.scheduledTasks
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const agentScheduler = AgentScheduler.getInstance()
```

### 2. Agent Memory System

Create `src/services/agent-memory.ts`:
```typescript
export interface AgentMemory {
  agentId: string
  type: 'task_result' | 'interaction' | 'learning' | 'preference'
  timestamp: Date
  data: Record<string, any>
  importance: number // 0-10 scale
  tags: string[]
  expiresAt?: Date
}

export interface AgentContext {
  agentId: string
  recentMemories: AgentMemory[]
  taskHistory: any[]
  preferences: Record<string, any>
  performance: {
    tasksCompleted: number
    successRate: number
    averageTime: number
    lastActive: Date
  }
}

export class AgentMemoryService {
  private static instance: AgentMemoryService
  private memories: Map<string, AgentMemory[]> = new Map()
  private contexts: Map<string, AgentContext> = new Map()

  static getInstance(): AgentMemoryService {
    if (!AgentMemoryService.instance) {
      AgentMemoryService.instance = new AgentMemoryService()
    }
    return AgentMemoryService.instance
  }

  addMemory(memory: Omit<AgentMemory, 'timestamp'>): void {
    const fullMemory: AgentMemory = {
      ...memory,
      timestamp: new Date()
    }

    if (!this.memories.has(memory.agentId)) {
      this.memories.set(memory.agentId, [])
    }

    const agentMemories = this.memories.get(memory.agentId)!
    agentMemories.unshift(fullMemory)

    // Limit memory size and remove expired memories
    this.cleanupMemories(memory.agentId)
    this.updateContext(memory.agentId)
  }

  getMemories(
    agentId: string,
    filter?: {
      type?: string
      tags?: string[]
      minImportance?: number
      limit?: number
    }
  ): AgentMemory[] {
    const memories = this.memories.get(agentId) || []
    
    let filtered = memories.filter(memory => {
      if (memory.expiresAt && memory.expiresAt < new Date()) return false
      if (filter?.type && memory.type !== filter.type) return false
      if (filter?.minImportance && memory.importance < filter.minImportance) return false
      if (filter?.tags && !filter.tags.some(tag => memory.tags.includes(tag))) return false
      return true
    })

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit)
    }

    return filtered
  }

  getContext(agentId: string): AgentContext | null {
    return this.contexts.get(agentId) || null
  }

  updatePerformance(agentId: string, metrics: {
    taskCompleted?: boolean
    executionTime?: number
    success?: boolean
  }): void {
    let context = this.contexts.get(agentId)
    
    if (!context) {
      context = this.createInitialContext(agentId)
      this.contexts.set(agentId, context)
    }

    if (metrics.taskCompleted) {
      context.performance.tasksCompleted++
      context.performance.lastActive = new Date()
    }

    if (metrics.success !== undefined) {
      // Update success rate using moving average
      const currentRate = context.performance.successRate
      const newRate = (currentRate * 0.9) + (metrics.success ? 0.1 : 0)
      context.performance.successRate = Math.max(0, Math.min(1, newRate))
    }

    if (metrics.executionTime) {
      // Update average time using moving average
      const currentAvg = context.performance.averageTime
      context.performance.averageTime = (currentAvg * 0.8) + (metrics.executionTime * 0.2)
    }

    // Add performance memory
    this.addMemory({
      agentId,
      type: 'task_result',
      data: metrics,
      importance: 5,
      tags: ['performance']
    })
  }

  generateContextualPrompt(agentId: string, basePrompt: string): string {
    const context = this.getContext(agentId)
    if (!context) return basePrompt

    const recentMemories = this.getMemories(agentId, { 
      limit: 5,
      minImportance: 6
    })

    const memoryContext = recentMemories.length > 0 
      ? `\n\nRecent relevant context:\n${recentMemories.map(m => 
          `- ${m.type}: ${JSON.stringify(m.data)}`
        ).join('\n')}`
      : ''

    const performanceContext = `\n\nPerformance context:\n- Tasks completed: ${context.performance.tasksCompleted}\n- Success rate: ${Math.round(context.performance.successRate * 100)}%\n- Average execution time: ${Math.round(context.performance.averageTime)}ms`

    return basePrompt + memoryContext + performanceContext
  }

  private cleanupMemories(agentId: string): void {
    const memories = this.memories.get(agentId)!
    
    // Remove expired memories
    const validMemories = memories.filter(memory => 
      !memory.expiresAt || memory.expiresAt > new Date()
    )

    // Keep only the most recent 1000 memories, prioritizing by importance
    if (validMemories.length > 1000) {
      validMemories.sort((a, b) => {
        if (a.importance !== b.importance) {
          return b.importance - a.importance
        }
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
      
      this.memories.set(agentId, validMemories.slice(0, 1000))
    } else {
      this.memories.set(agentId, validMemories)
    }
  }

  private updateContext(agentId: string): void {
    const memories = this.getMemories(agentId, { limit: 50 })
    
    let context = this.contexts.get(agentId)
    if (!context) {
      context = this.createInitialContext(agentId)
      this.contexts.set(agentId, context)
    }

    context.recentMemories = memories.slice(0, 10)
    
    // Extract task history from memories
    context.taskHistory = memories
      .filter(m => m.type === 'task_result')
      .map(m => m.data)
      .slice(0, 20)

    // Extract preferences from learning memories
    const learningMemories = memories.filter(m => m.type === 'learning')
    context.preferences = learningMemories.reduce((prefs, memory) => {
      return { ...prefs, ...memory.data }
    }, context.preferences)
  }

  private createInitialContext(agentId: string): AgentContext {
    return {
      agentId,
      recentMemories: [],
      taskHistory: [],
      preferences: {},
      performance: {
        tasksCompleted: 0,
        successRate: 0.5,
        averageTime: 0,
        lastActive: new Date()
      }
    }
  }
}

export const agentMemory = AgentMemoryService.getInstance()
```

### 3. Multi-Agent Collaboration

Create `src/services/agent-collaboration.ts`:
```typescript
import { useAgentStore } from '@/stores/agents'
import { useProjectStore } from '@/stores/projects'
import { eventBus } from '@/services/event-bus'
import type { Agent, ProjectTask } from '@/types'

export interface CollaborationRequest {
  id: string
  requestingAgentId: string
  targetAgentId: string
  type: 'review' | 'assistance' | 'handoff' | 'approval'
  taskId?: string
  projectId: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: Date
  respondedAt?: Date
  response?: string
}

export class AgentCollaborationService {
  private static instance: AgentCollaborationService
  private requests: CollaborationRequest[] = []

  static getInstance(): AgentCollaborationService {
    if (!AgentCollaborationService.instance) {
      AgentCollaborationService.instance = new AgentCollaborationService()
    }
    return AgentCollaborationService.instance
  }

  async requestCollaboration(request: Omit<CollaborationRequest, 'id' | 'createdAt' | 'status'>): Promise<CollaborationRequest> {
    const fullRequest: CollaborationRequest = {
      ...request,
      id: this.generateId(),
      createdAt: new Date(),
      status: 'pending'
    }

    this.requests.push(fullRequest)

    // Notify target agent
    eventBus.emit({
      type: 'notification',
      source: `agent-${request.requestingAgentId}`,
      data: {
        collaborationRequestId: fullRequest.id,
        type: request.type,
        taskId: request.taskId
      },
      severity: 'info',
      message: `Collaboration request: ${request.message}`
    })

    // Auto-handle based on agent configuration
    await this.autoHandleRequest(fullRequest)

    return fullRequest
  }

  respondToRequest(requestId: string, response: 'accept' | 'reject', message?: string): void {
    const request = this.requests.find(r => r.id === requestId)
    if (!request || request.status !== 'pending') return

    request.status = response === 'accept' ? 'accepted' : 'rejected'
    request.respondedAt = new Date()
    request.response = message

    eventBus.emit({
      type: 'agent_action',
      source: `agent-${request.targetAgentId}`,
      data: {
        collaborationRequestId: requestId,
        response,
        originalRequestType: request.type
      },
      severity: response === 'accept' ? 'success' : 'warning',
      message: `Collaboration request ${response}ed: ${request.message}`
    })

    if (response === 'accept') {
      this.executeCollaboration(request)
    }
  }

  private async autoHandleRequest(request: CollaborationRequest): Promise<void> {
    const agentStore = useAgentStore()
    const targetAgent = agentStore.agents.find(a => a.id === request.targetAgentId)
    
    if (!targetAgent) return

    const config = targetAgent.config.collaboration

    // Auto-accept based on agent configuration
    if (!config.requiresApproval) {
      this.respondToRequest(request.id, 'accept', 'Auto-accepted based on agent configuration')
    }
  }

  private async executeCollaboration(request: CollaborationRequest): Promise<void> {
    const agentStore = useAgentStore()
    const projectStore = useProjectStore()

    try {
      switch (request.type) {
        case 'review':
          await this.executeReview(request)
          break
        case 'assistance':
          await this.executeAssistance(request)
          break
        case 'handoff':
          await this.executeHandoff(request)
          break
        case 'approval':
          await this.executeApproval(request)
          break
      }

      request.status = 'completed'

      eventBus.emit({
        type: 'task_completed',
        source: `collaboration-${request.id}`,
        data: {
          collaborationType: request.type,
          requestingAgent: request.requestingAgentId,
          targetAgent: request.targetAgentId
        },
        severity: 'success',
        message: `Collaboration completed: ${request.type}`
      })

    } catch (error: any) {
      eventBus.emit({
        type: 'error',
        source: `collaboration-${request.id}`,
        data: { error: error.message },
        severity: 'error',
        message: `Collaboration failed: ${error.message}`
      })
    }
  }

  private async executeReview(request: CollaborationRequest): Promise<void> {
    if (!request.taskId) return

    const projectStore = useProjectStore()
    const agentStore = useAgentStore()
    
    // Find the task and project
    const project = projectStore.projects.find(p => p.id === request.projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === request.taskId)
    if (!task) return

    // Add review comment
    projectStore.addTaskComment(request.projectId, request.taskId, {
      content: `Review completed by agent. Status: ${task.status}`,
      authorId: request.targetAgentId,
      authorName: agentStore.agents.find(a => a.id === request.targetAgentId)?.name || 'Agent',
      isSystemGenerated: true
    })
  }

  private async executeAssistance(request: CollaborationRequest): Promise<void> {
    const agentStore = useAgentStore()
    
    // Create assistance task for target agent
    const assistanceTask = agentStore.createTask({
      agentId: request.targetAgentId,
      projectId: request.projectId,
      type: 'create_content',
      description: `Provide assistance: ${request.message}`,
      status: 'pending',
      priority: 'medium',
      dependencies: request.taskId ? [request.taskId] : []
    })

    // Execute the assistance task
    await agentStore.executeTaskWithOpenAI(assistanceTask)
  }

  private async executeHandoff(request: CollaborationRequest): Promise<void> {
    if (!request.taskId) return

    const projectStore = useProjectStore()
    const agentStore = useAgentStore()
    
    const targetAgent = agentStore.agents.find(a => a.id === request.targetAgentId)
    if (!targetAgent) return

    // Update task assignment
    projectStore.updateTask(request.projectId, request.taskId, {
      assigneeId: request.targetAgentId,
      assigneeName: targetAgent.name,
      status: 'todo'
    })

    // Add handoff comment
    projectStore.addTaskComment(request.projectId, request.taskId, {
      content: `Task handed off from agent ${request.requestingAgentId} to ${targetAgent.name}`,
      authorId: 'system',
      authorName: 'System',
      isSystemGenerated: true
    })
  }

  private async executeApproval(request: CollaborationRequest): Promise<void> {
    if (!request.taskId) return

    const projectStore = useProjectStore()
    
    // Move task to review status
    projectStore.updateTask(request.projectId, request.taskId, {
      status: 'review'
    })

    // Add approval comment
    projectStore.addTaskComment(request.projectId, request.taskId, {
      content: 'Task approved and moved to review',
      authorId: request.targetAgentId,
      authorName: 'Reviewing Agent',
      isSystemGenerated: true
    })
  }

  getPendingRequests(agentId?: string): CollaborationRequest[] {
    return this.requests.filter(r => {
      if (r.status !== 'pending') return false
      if (agentId && r.targetAgentId !== agentId) return false
      return true
    })
  }

  getRequestHistory(agentId: string): CollaborationRequest[] {
    return this.requests.filter(r => 
      r.requestingAgentId === agentId || r.targetAgentId === agentId
    )
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const agentCollaboration = AgentCollaborationService.getInstance()
```

### 4. Update Agent Store with Advanced Features

Update `src/stores/agents.ts`:
```typescript
import { agentScheduler } from '@/services/agent-scheduler'
import { agentMemory } from '@/services/agent-memory'
import { agentCollaboration } from '@/services/agent-collaboration'

// Add to existing store
function startAutonomousAgent(agentId: string): void {
  const agent = agents.value.find(a => a.id === agentId)
  if (!agent || agent.type !== 'autonomous') return

  updateAgent(agentId, { status: 'active' })
  
  // Start scheduler if not already running
  agentScheduler.start()

  eventBus.emit({
    type: 'agent_status',
    source: `agent-${agentId}`,
    data: { agentId, action: 'started_autonomous' },
    severity: 'success',
    message: `Autonomous agent ${agent.name} started`
  })
}

function stopAutonomousAgent(agentId: string): void {
  const agent = agents.value.find(a => a.id === agentId)
  if (!agent) return

  updateAgent(agentId, { status: 'idle' })

  eventBus.emit({
    type: 'agent_status',
    source: `agent-${agentId}`,
    data: { agentId, action: 'stopped_autonomous' },
    severity: 'info',
    message: `Autonomous agent ${agent.name} stopped`
  })
}

async function executeTaskWithMemory(task: AgentTask): Promise<void> {
  const agent = agents.value.find(a => a.id === task.agentId)
  if (!agent) return

  const startTime = Date.now()
  
  try {
    // Get contextual prompt using memory
    const contextualPrompt = agentMemory.generateContextualPrompt(
      task.agentId,
      task.description
    )

    // Update task with contextual description
    const contextualTask = { ...task, description: contextualPrompt }
    
    await executeTaskWithOpenAI(contextualTask)
    
    const executionTime = Date.now() - startTime
    
    // Update performance metrics
    agentMemory.updatePerformance(task.agentId, {
      taskCompleted: true,
      executionTime,
      success: task.result?.success || false
    })

    // Add task result to memory
    agentMemory.addMemory({
      agentId: task.agentId,
      type: 'task_result',
      data: {
        taskId: task.id,
        description: task.description,
        result: task.result,
        executionTime
      },
      importance: task.result?.success ? 7 : 4,
      tags: ['task', task.type]
    })

  } catch (error: any) {
    const executionTime = Date.now() - startTime
    
    agentMemory.updatePerformance(task.agentId, {
      taskCompleted: true,
      executionTime,
      success: false
    })

    throw error
  }
}

async function requestAgentCollaboration(
  requestingAgentId: string,
  targetAgentId: string,
  type: 'review' | 'assistance' | 'handoff' | 'approval',
  projectId: string,
  message: string,
  taskId?: string
): Promise<void> {
  await agentCollaboration.requestCollaboration({
    requestingAgentId,
    targetAgentId,
    type,
    projectId,
    message,
    taskId
  })
}

// Export new functions
return {
  // ... existing exports
  startAutonomousAgent,
  stopAutonomousAgent,
  executeTaskWithMemory,
  requestAgentCollaboration,
  getAgentMemory: (agentId: string) => agentMemory.getContext(agentId),
  getCollaborationRequests: (agentId: string) => agentCollaboration.getPendingRequests(agentId)
}
```

## Benefits
- Truly autonomous agent execution
- Agent learning and improvement over time
- Multi-agent collaboration workflows
- Performance tracking and optimization
- Contextual task execution
- Memory-based decision making

## Features
- Scheduled autonomous execution
- Agent memory and context system
- Performance metrics and learning
- Collaboration request system
- Auto-approval based on configuration
- Task handoff and review workflows

## Acceptance Criteria
- [ ] Agent scheduler implemented and working
- [ ] Memory system storing and retrieving context
- [ ] Performance metrics tracking agent improvement
- [ ] Collaboration system enabling multi-agent workflows
- [ ] Autonomous agents executing on schedule
- [ ] Memory-based contextual prompting
- [ ] Agent handoff and review processes
- [ ] Performance dashboard for monitoring
- [ ] Configuration for autonomy levels
- [ ] Error handling and recovery

## Estimated Effort
Large (16-20 hours)