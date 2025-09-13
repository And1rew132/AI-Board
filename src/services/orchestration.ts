import type { 
  AgentMessage, 
  AgentCommunicationChannel,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepExecution,
  BusinessProcess,
  AgentCapabilityRegistry,
  AgentOrchestrationMetrics
} from '@/types';

class AgentOrchestrationService {
  private messages: AgentMessage[] = [];
  private channels: AgentCommunicationChannel[] = [];
  private workflows: WorkflowDefinition[] = [];
  private executions: WorkflowExecution[] = [];
  private businessProcesses: BusinessProcess[] = [];
  private capabilityRegistry: AgentCapabilityRegistry[] = [];
  
  // Agent Communication Methods
  async sendMessage(message: Omit<AgentMessage, 'id' | 'createdAt' | 'status'>): Promise<AgentMessage> {
    const newMessage: AgentMessage = {
      ...message,
      id: this.generateId(),
      createdAt: new Date(),
      status: 'sent'
    };
    
    this.messages.push(newMessage);
    
    // Simulate message delivery
    setTimeout(() => {
      this.updateMessageStatus(newMessage.id, 'delivered');
    }, 100);
    
    return newMessage;
  }
  
  async getMessagesForAgent(agentId: string): Promise<AgentMessage[]> {
    return this.messages.filter(m => m.toAgentId === agentId || m.fromAgentId === agentId);
  }
  
  async createCommunicationChannel(channel: Omit<AgentCommunicationChannel, 'id' | 'createdAt'>): Promise<AgentCommunicationChannel> {
    const newChannel: AgentCommunicationChannel = {
      ...channel,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    this.channels.push(newChannel);
    return newChannel;
  }
  
  // Agent Discovery Methods
  async findAgentsByCapability(capability: string): Promise<string[]> {
    const registry = this.capabilityRegistry.find(c => c.capability === capability);
    return registry?.agentIds || [];
  }
  
  async registerAgentCapability(agentId: string, capability: string, description: string): Promise<void> {
    let registry = this.capabilityRegistry.find(c => c.capability === capability);
    
    if (!registry) {
      registry = {
        capability,
        description,
        agentIds: [],
        isCore: false
      };
      this.capabilityRegistry.push(registry);
    }
    
    if (!registry.agentIds.includes(agentId)) {
      registry.agentIds.push(agentId);
    }
  }
  
  async getAvailableAgents(requiredCapabilities?: string[]): Promise<string[]> {
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return this.capabilityRegistry.flatMap(c => c.agentIds);
    }
    
    const agentCounts: Record<string, number> = {};
    
    for (const capability of requiredCapabilities) {
      const registry = this.capabilityRegistry.find(c => c.capability === capability);
      if (registry) {
        for (const agentId of registry.agentIds) {
          agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
        }
      }
    }
    
    // Return agents that have all required capabilities
    return Object.entries(agentCounts)
      .filter(([_, count]) => count === requiredCapabilities.length)
      .map(([agentId]) => agentId);
  }
  
  // Workflow Management Methods
  async createWorkflow(workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> {
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.workflows.push(newWorkflow);
    return newWorkflow;
  }
  
  async executeWorkflow(workflowId: string, context: Record<string, any> = {}, triggeredBy: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }
    
    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'pending',
      executionContext: { ...context },
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        retryCount: 0
      })),
      startedAt: new Date(),
      triggeredBy,
      metrics: {
        totalSteps: workflow.steps.length,
        completedSteps: 0,
        failedSteps: 0
      }
    };
    
    this.executions.push(execution);
    
    // Start execution asynchronously
    this.processWorkflowExecution(execution.id);
    
    return execution;
  }
  
  private async processWorkflowExecution(executionId: string): Promise<void> {
    const execution = this.executions.find(e => e.id === executionId);
    if (!execution) return;
    
    const workflow = this.workflows.find(w => w.id === execution.workflowId);
    if (!workflow) return;
    
    execution.status = 'running';
    
    try {
      for (const step of workflow.steps) {
        if (execution.status !== 'running') break;
        
        // Check dependencies
        const dependenciesMet = step.dependencies.every(depId => {
          const depStep = execution.steps.find(s => s.stepId === depId);
          return depStep?.status === 'completed';
        });
        
        if (!dependenciesMet) {
          continue; // Skip this step for now
        }
        
        const stepExecution = execution.steps.find(s => s.stepId === step.id);
        if (!stepExecution || stepExecution.status !== 'pending') continue;
        
        await this.executeWorkflowStep(execution, step, stepExecution);
      }
      
      // Check if all steps are completed
      const allCompleted = execution.steps.every(s => s.status === 'completed' || s.status === 'skipped');
      const anyFailed = execution.steps.some(s => s.status === 'failed');
      
      if (allCompleted && !anyFailed) {
        execution.status = 'completed';
        execution.completedAt = new Date();
      } else if (anyFailed) {
        execution.status = 'failed';
        execution.completedAt = new Date();
      }
      
    } catch (error) {
      execution.status = 'failed';
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
    }
  }
  
  private async executeWorkflowStep(
    execution: WorkflowExecution, 
    step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    stepExecution.status = 'running';
    stepExecution.startedAt = new Date();
    
    try {
      switch (step.type) {
        case 'agent_task':
          await this.executeAgentTask(execution, step, stepExecution);
          break;
        case 'condition':
          await this.executeCondition(execution, step, stepExecution);
          break;
        case 'data_transform':
          await this.executeDataTransform(execution, step, stepExecution);
          break;
        case 'human_approval':
          await this.executeHumanApproval(execution, step, stepExecution);
          break;
        case 'external_api':
          await this.executeExternalAPI(execution, step, stepExecution);
          break;
      }
      
      stepExecution.status = 'completed';
      stepExecution.completedAt = new Date();
      stepExecution.duration = stepExecution.completedAt.getTime() - (stepExecution.startedAt?.getTime() || 0);
      execution.metrics.completedSteps++;
      
    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stepExecution.completedAt = new Date();
      execution.metrics.failedSteps++;
      
      // Retry logic
      if (step.retryPolicy && stepExecution.retryCount < step.retryPolicy.maxRetries) {
        stepExecution.retryCount++;
        stepExecution.status = 'pending';
        
        setTimeout(() => {
          this.executeWorkflowStep(execution, step, stepExecution);
        }, step.retryPolicy.retryDelay * 1000);
      }
    }
  }
  
  private async executeAgentTask(
    execution: WorkflowExecution, 
    step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    // Find available agent
    let agentId = step.agentId;
    
    if (!agentId && step.agentRole) {
      const availableAgents = await this.getAvailableAgents([step.agentRole]);
      agentId = availableAgents[0]; // Simple assignment, could be more sophisticated
    }
    
    if (!agentId) {
      throw new Error(`No agent available for step ${step.name}`);
    }
    
    stepExecution.assignedAgentId = agentId;
    
    // Send task message to agent
    const message = await this.sendMessage({
      fromAgentId: 'orchestrator',
      toAgentId: agentId,
      type: 'task_request',
      subject: `Workflow Task: ${step.name}`,
      content: step.description,
      data: {
        workflowExecutionId: execution.id,
        stepId: step.id,
        context: execution.executionContext,
        config: step.config
      },
      priority: 'medium'
    });
    
    // In a real implementation, we'd wait for the agent to respond
    // For now, simulate task completion
    setTimeout(() => {
      stepExecution.output = { result: 'Task completed successfully', messageId: message.id };
    }, 1000);
  }
  
  private async executeCondition(
    execution: WorkflowExecution, 
    step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    // Evaluate conditions and route to next step
    if (step.conditions) {
      for (const condition of step.conditions) {
        const value = execution.executionContext[condition.field];
        let conditionMet = false;
        
        switch (condition.operator) {
          case 'equals':
            conditionMet = value === condition.value;
            break;
          case 'not_equals':
            conditionMet = value !== condition.value;
            break;
          case 'contains':
            conditionMet = String(value).includes(String(condition.value));
            break;
          case 'greater_than':
            conditionMet = Number(value) > Number(condition.value);
            break;
          case 'less_than':
            conditionMet = Number(value) < Number(condition.value);
            break;
          case 'exists':
            conditionMet = value !== undefined && value !== null;
            break;
        }
        
        if (conditionMet && condition.nextStepId) {
          execution.executionContext._nextStepId = condition.nextStepId;
          break;
        }
      }
    }
    
    stepExecution.output = { conditionResult: execution.executionContext._nextStepId };
  }
  
  private async executeDataTransform(
    execution: WorkflowExecution, 
    step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    // Simple data transformation
    const input = step.config.input || {};
    const transformedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Template variable resolution
        const varName = value.slice(2, -2).trim();
        transformedData[key] = execution.executionContext[varName];
      } else {
        transformedData[key] = value;
      }
    }
    
    // Merge transformed data back into context
    Object.assign(execution.executionContext, transformedData);
    stepExecution.output = transformedData;
  }
  
  private async executeHumanApproval(
    _execution: WorkflowExecution, 
    _step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    // In a real implementation, this would create an approval request
    // For now, simulate auto-approval
    stepExecution.output = { approved: true, approver: 'system' };
  }
  
  private async executeExternalAPI(
    _execution: WorkflowExecution, 
    step: WorkflowStep, 
    stepExecution: WorkflowStepExecution
  ): Promise<void> {
    const apiConfig = step.config.externalApiConfig;
    if (!apiConfig) {
      throw new Error('External API configuration missing');
    }
    
    // Simulate API call
    stepExecution.output = { 
      status: 'success', 
      data: { message: 'API call completed' },
      url: apiConfig.url 
    };
  }
  
  // Business Process Methods
  async createBusinessProcess(process: Omit<BusinessProcess, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<BusinessProcess> {
    const newProcess: BusinessProcess = {
      ...process,
      id: this.generateId(),
      metrics: {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.businessProcesses.push(newProcess);
    return newProcess;
  }
  
  async executeBusinessProcess(processId: string, context: Record<string, any> = {}): Promise<WorkflowExecution> {
    const process = this.businessProcesses.find(p => p.id === processId);
    if (!process) {
      throw new Error(`Business process ${processId} not found`);
    }
    
    if (!process.isActive) {
      throw new Error(`Business process ${processId} is not active`);
    }
    
    // Merge process configuration with context
    const mergedContext = { ...process.configuration, ...context };
    
    return this.executeWorkflow(process.workflowId, mergedContext, 'business_process');
  }
  
  // Metrics and Monitoring
  async getOrchestrationMetrics(): Promise<AgentOrchestrationMetrics> {
    const activeWorkflows = this.executions.filter(e => e.status === 'running').length;
    const completedWorkflows = this.executions.filter(e => e.status === 'completed').length;
    
    const completedExecutions = this.executions.filter(e => e.status === 'completed');
    const averageWorkflowDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          return sum + (e.completedAt!.getTime() - e.startedAt.getTime());
        }, 0) / completedExecutions.length
      : 0;
    
    return {
      totalMessages: this.messages.length,
      activeWorkflows,
      completedWorkflows,
      averageWorkflowDuration,
      agentUtilization: {}, // Would calculate based on actual agent activity
      topPerformingAgents: [], // Would calculate based on task completion rates
      businessProcessMetrics: {} // Would calculate based on business process executions
    };
  }
  
  // Utility Methods
  private updateMessageStatus(messageId: string, status: AgentMessage['status']): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      if (status === 'delivered') {
        message.deliveredAt = new Date();
      } else if (status === 'read') {
        message.readAt = new Date();
      }
    }
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Getters for data access
  getMessages(): AgentMessage[] {
    return [...this.messages];
  }
  
  getChannels(): AgentCommunicationChannel[] {
    return [...this.channels];
  }
  
  getWorkflows(): WorkflowDefinition[] {
    return [...this.workflows];
  }
  
  getExecutions(): WorkflowExecution[] {
    return [...this.executions];
  }
  
  getBusinessProcesses(): BusinessProcess[] {
    return [...this.businessProcesses];
  }
  
  getCapabilityRegistry(): AgentCapabilityRegistry[] {
    return [...this.capabilityRegistry];
  }
}

export const orchestrationService = new AgentOrchestrationService();