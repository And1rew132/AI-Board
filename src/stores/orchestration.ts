import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  AgentMessage, 
  AgentCommunicationChannel,
  WorkflowDefinition,
  WorkflowExecution,
  BusinessProcess,
  AgentCapabilityRegistry,
  AgentOrchestrationMetrics
} from '@/types';
import { orchestrationService } from '@/services/orchestration';

export const useOrchestrationStore = defineStore('orchestration', () => {
  const messages = ref<AgentMessage[]>([]);
  const channels = ref<AgentCommunicationChannel[]>([]);
  const workflows = ref<WorkflowDefinition[]>([]);
  const executions = ref<WorkflowExecution[]>([]);
  const businessProcesses = ref<BusinessProcess[]>([]);
  const capabilityRegistry = ref<AgentCapabilityRegistry[]>([]);
  const metrics = ref<AgentOrchestrationMetrics | null>(null);
  
  // Computed values
  const activeWorkflows = computed(() => 
    workflows.value.filter(w => w.isActive)
  );
  
  const runningExecutions = computed(() =>
    executions.value.filter(e => e.status === 'running')
  );
  
  const recentMessages = computed(() =>
    messages.value
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
  );
  
  const activeBusinessProcesses = computed(() =>
    businessProcesses.value.filter(p => p.isActive)
  );
  
  // Message Management
  async function sendMessage(messageData: Omit<AgentMessage, 'id' | 'createdAt' | 'status'>) {
    try {
      const message = await orchestrationService.sendMessage(messageData);
      messages.value.push(message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  async function getMessagesForAgent(agentId: string) {
    try {
      const agentMessages = await orchestrationService.getMessagesForAgent(agentId);
      return agentMessages;
    } catch (error) {
      console.error('Error fetching messages for agent:', error);
      return [];
    }
  }
  
  async function createCommunicationChannel(channelData: Omit<AgentCommunicationChannel, 'id' | 'createdAt'>) {
    try {
      const channel = await orchestrationService.createCommunicationChannel(channelData);
      channels.value.push(channel);
      return channel;
    } catch (error) {
      console.error('Error creating communication channel:', error);
      throw error;
    }
  }
  
  // Agent Discovery
  async function findAgentsByCapability(capability: string) {
    try {
      return await orchestrationService.findAgentsByCapability(capability);
    } catch (error) {
      console.error('Error finding agents by capability:', error);
      return [];
    }
  }
  
  async function registerAgentCapability(agentId: string, capability: string, description: string) {
    try {
      await orchestrationService.registerAgentCapability(agentId, capability, description);
      // Refresh capability registry
      capabilityRegistry.value = orchestrationService.getCapabilityRegistry();
    } catch (error) {
      console.error('Error registering agent capability:', error);
      throw error;
    }
  }
  
  async function getAvailableAgents(requiredCapabilities?: string[]) {
    try {
      return await orchestrationService.getAvailableAgents(requiredCapabilities);
    } catch (error) {
      console.error('Error getting available agents:', error);
      return [];
    }
  }
  
  // Workflow Management
  async function createWorkflow(workflowData: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const workflow = await orchestrationService.createWorkflow(workflowData);
      workflows.value.push(workflow);
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }
  
  async function executeWorkflow(workflowId: string, context: Record<string, any> = {}, triggeredBy: string) {
    try {
      const execution = await orchestrationService.executeWorkflow(workflowId, context, triggeredBy);
      executions.value.push(execution);
      return execution;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }
  
  function updateWorkflow(id: string, updates: Partial<WorkflowDefinition>) {
    const index = workflows.value.findIndex(w => w.id === id);
    if (index !== -1) {
      workflows.value[index] = {
        ...workflows.value[index],
        ...updates,
        updatedAt: new Date()
      };
    }
  }
  
  function deleteWorkflow(id: string) {
    const index = workflows.value.findIndex(w => w.id === id);
    if (index !== -1) {
      workflows.value.splice(index, 1);
    }
  }
  
  // Business Process Management
  async function createBusinessProcess(processData: Omit<BusinessProcess, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) {
    try {
      const process = await orchestrationService.createBusinessProcess(processData);
      businessProcesses.value.push(process);
      return process;
    } catch (error) {
      console.error('Error creating business process:', error);
      throw error;
    }
  }
  
  async function executeBusinessProcess(processId: string, context: Record<string, any> = {}) {
    try {
      const execution = await orchestrationService.executeBusinessProcess(processId, context);
      executions.value.push(execution);
      return execution;
    } catch (error) {
      console.error('Error executing business process:', error);
      throw error;
    }
  }
  
  function updateBusinessProcess(id: string, updates: Partial<BusinessProcess>) {
    const index = businessProcesses.value.findIndex(p => p.id === id);
    if (index !== -1) {
      businessProcesses.value[index] = {
        ...businessProcesses.value[index],
        ...updates,
        updatedAt: new Date()
      };
    }
  }
  
  // Metrics and Monitoring
  async function refreshMetrics() {
    try {
      metrics.value = await orchestrationService.getOrchestrationMetrics();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }
  
  // Data Synchronization
  function syncData() {
    messages.value = orchestrationService.getMessages();
    channels.value = orchestrationService.getChannels();
    workflows.value = orchestrationService.getWorkflows();
    executions.value = orchestrationService.getExecutions();
    businessProcesses.value = orchestrationService.getBusinessProcesses();
    capabilityRegistry.value = orchestrationService.getCapabilityRegistry();
  }
  
  // Pre-built Workflow Templates
  function getWorkflowTemplates(): Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] {
    return [
      {
        name: 'Customer Support Ticket',
        description: 'Automated customer support ticket processing workflow',
        type: 'customer_service',
        category: 'support',
        isActive: true,
        isTemplate: true,
        steps: [
          {
            id: 'analyze_ticket',
            name: 'Analyze Ticket',
            type: 'agent_task',
            agentRole: 'analysis',
            description: 'Analyze customer ticket content and categorize the issue',
            config: {
              requiredCapabilities: ['content_analysis', 'ai_generation']
            },
            dependencies: []
          },
          {
            id: 'route_ticket',
            name: 'Route Ticket',
            type: 'condition',
            description: 'Route ticket based on analysis results',
            config: {},
            dependencies: ['analyze_ticket'],
            conditions: [
              {
                field: 'category',
                operator: 'equals',
                value: 'technical',
                nextStepId: 'technical_response'
              },
              {
                field: 'category',
                operator: 'equals',
                value: 'billing',
                nextStepId: 'billing_response'
              }
            ]
          },
          {
            id: 'technical_response',
            name: 'Generate Technical Response',
            type: 'agent_task',
            agentRole: 'code_generation',
            description: 'Generate technical solution for customer',
            config: {
              requiredCapabilities: ['code_generation', 'content_creation']
            },
            dependencies: ['route_ticket']
          },
          {
            id: 'billing_response',
            name: 'Generate Billing Response',
            type: 'agent_task',
            agentRole: 'content_creation',
            description: 'Generate billing-related response for customer',
            config: {
              requiredCapabilities: ['content_creation']
            },
            dependencies: ['route_ticket']
          },
          {
            id: 'send_response',
            name: 'Send Response',
            type: 'external_api',
            description: 'Send response to customer via email/chat',
            config: {
              externalApiConfig: {
                url: '/api/send-customer-response',
                method: 'POST'
              }
            },
            dependencies: ['technical_response', 'billing_response']
          }
        ],
        triggers: [
          {
            id: 'new_ticket',
            type: 'webhook',
            config: {
              webhookUrl: '/webhooks/support-ticket'
            },
            isActive: true
          }
        ]
      },
      {
        name: 'Content Creation Pipeline',
        description: 'Automated content creation and publishing workflow',
        type: 'content_creation',
        category: 'marketing',
        isActive: true,
        isTemplate: true,
        steps: [
          {
            id: 'research_topic',
            name: 'Research Topic',
            type: 'agent_task',
            agentRole: 'analysis',
            description: 'Research the given topic and gather relevant information',
            config: {
              requiredCapabilities: ['analysis', 'api_integration']
            },
            dependencies: []
          },
          {
            id: 'create_outline',
            name: 'Create Content Outline',
            type: 'agent_task',
            agentRole: 'content_creation',
            description: 'Create a structured outline for the content',
            config: {
              requiredCapabilities: ['content_creation', 'ai_generation']
            },
            dependencies: ['research_topic']
          },
          {
            id: 'write_content',
            name: 'Write Content',
            type: 'agent_task',
            agentRole: 'content_creation',
            description: 'Write the full content based on outline and research',
            config: {
              requiredCapabilities: ['content_creation', 'ai_generation']
            },
            dependencies: ['create_outline']
          },
          {
            id: 'review_content',
            name: 'Review Content',
            type: 'human_approval',
            description: 'Human review and approval of generated content',
            config: {
              approvers: ['content_manager']
            },
            dependencies: ['write_content']
          },
          {
            id: 'publish_content',
            name: 'Publish Content',
            type: 'external_api',
            description: 'Publish approved content to website/blog',
            config: {
              externalApiConfig: {
                url: '/api/publish-content',
                method: 'POST'
              }
            },
            dependencies: ['review_content']
          }
        ],
        triggers: [
          {
            id: 'content_schedule',
            type: 'schedule',
            config: {
              schedule: '0 9 * * MON' // Every Monday at 9 AM
            },
            isActive: true
          }
        ]
      },
      {
        name: 'Data Analysis & Reporting',
        description: 'Automated data analysis and report generation workflow',
        type: 'data_analysis',
        category: 'operations',
        isActive: true,
        isTemplate: true,
        steps: [
          {
            id: 'collect_data',
            name: 'Collect Data',
            type: 'external_api',
            description: 'Collect data from various sources',
            config: {
              externalApiConfig: {
                url: '/api/collect-analytics-data',
                method: 'GET'
              }
            },
            dependencies: []
          },
          {
            id: 'analyze_data',
            name: 'Analyze Data',
            type: 'agent_task',
            agentRole: 'analysis',
            description: 'Perform statistical analysis and identify trends',
            config: {
              requiredCapabilities: ['analysis', 'ai_generation']
            },
            dependencies: ['collect_data']
          },
          {
            id: 'generate_insights',
            name: 'Generate Insights',
            type: 'agent_task',
            agentRole: 'analysis',
            description: 'Generate actionable insights from analysis',
            config: {
              requiredCapabilities: ['analysis', 'content_creation']
            },
            dependencies: ['analyze_data']
          },
          {
            id: 'create_report',
            name: 'Create Report',
            type: 'agent_task',
            agentRole: 'content_creation',
            description: 'Create formatted report with charts and recommendations',
            config: {
              requiredCapabilities: ['content_creation', 'file_management']
            },
            dependencies: ['generate_insights']
          },
          {
            id: 'distribute_report',
            name: 'Distribute Report',
            type: 'external_api',
            description: 'Send report to stakeholders',
            config: {
              externalApiConfig: {
                url: '/api/send-report',
                method: 'POST'
              }
            },
            dependencies: ['create_report']
          }
        ],
        triggers: [
          {
            id: 'weekly_report',
            type: 'schedule',
            config: {
              schedule: '0 8 * * FRI' // Every Friday at 8 AM
            },
            isActive: true
          }
        ]
      }
    ];
  }
  
  async function createWorkflowFromTemplate(templateName: string, customizations: Record<string, any> = {}) {
    const templates = getWorkflowTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    const workflowData: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
      ...template,
      ...customizations,
      isTemplate: false,
      createdBy: 'user'
    };
    
    return await createWorkflow(workflowData);
  }
  
  return {
    // State
    messages,
    channels,
    workflows,
    executions,
    businessProcesses,
    capabilityRegistry,
    metrics,
    
    // Computed
    activeWorkflows,
    runningExecutions,
    recentMessages,
    activeBusinessProcesses,
    
    // Actions
    sendMessage,
    getMessagesForAgent,
    createCommunicationChannel,
    findAgentsByCapability,
    registerAgentCapability,
    getAvailableAgents,
    createWorkflow,
    executeWorkflow,
    updateWorkflow,
    deleteWorkflow,
    createBusinessProcess,
    executeBusinessProcess,
    updateBusinessProcess,
    refreshMetrics,
    syncData,
    getWorkflowTemplates,
    createWorkflowFromTemplate
  };
});