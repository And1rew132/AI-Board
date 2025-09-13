import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  BusinessWorkflow, 
  WorkflowExecution, 
  CustomerInquiry, 
  InquiryResponse,
  BusinessProcessTemplate 
} from '@/types/business';

export const useBusinessStore = defineStore('business', () => {
  const workflows = ref<BusinessWorkflow[]>([]);
  const executions = ref<WorkflowExecution[]>([]);
  const inquiries = ref<CustomerInquiry[]>([]);
  const templates = ref<BusinessProcessTemplate[]>([]);

  // Computed properties
  const activeWorkflows = computed(() => 
    workflows.value.filter(w => w.status === 'active')
  );

  const runningExecutions = computed(() =>
    executions.value.filter(e => e.status === 'running')
  );

  const openInquiries = computed(() =>
    inquiries.value.filter(i => ['new', 'assigned', 'in_progress'].includes(i.status))
  );

  const urgentInquiries = computed(() =>
    inquiries.value.filter(i => i.priority === 'urgent' && i.status !== 'resolved' && i.status !== 'closed')
  );

  // Workflow functions
  function createWorkflow(workflowData: Omit<BusinessWorkflow, 'id' | 'metadata'>): BusinessWorkflow {
    const newWorkflow: BusinessWorkflow = {
      ...workflowData,
      id: generateId(),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    };
    
    workflows.value.push(newWorkflow);
    return newWorkflow;
  }

  function updateWorkflow(id: string, updates: Partial<BusinessWorkflow>) {
    const index = workflows.value.findIndex(w => w.id === id);
    if (index !== -1) {
      workflows.value[index] = {
        ...workflows.value[index],
        ...updates,
        metadata: {
          ...workflows.value[index].metadata,
          updatedAt: new Date()
        }
      };
    }
  }

  function deleteWorkflow(id: string) {
    const index = workflows.value.findIndex(w => w.id === id);
    if (index !== -1) {
      workflows.value.splice(index, 1);
    }
  }

  function getWorkflowById(id: string) {
    return workflows.value.find(w => w.id === id);
  }

  // Customer inquiry functions
  function createInquiry(inquiryData: Omit<CustomerInquiry, 'id' | 'responses' | 'metadata'>): CustomerInquiry {
    const newInquiry: CustomerInquiry = {
      ...inquiryData,
      id: generateId(),
      responses: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    inquiries.value.push(newInquiry);
    
    // Auto-categorize and prioritize if not specified
    if (!inquiryData.category || inquiryData.category === 'other') {
      newInquiry.category = categorizeInquiry(inquiryData.content, inquiryData.subject);
    }
    
    if (!inquiryData.priority) {
      newInquiry.priority = prioritizeInquiry(inquiryData.content, inquiryData.subject);
    }

    // Trigger automated response workflow
    triggerInquiryWorkflow(newInquiry.id);

    return newInquiry;
  }

  function updateInquiry(id: string, updates: Partial<CustomerInquiry>) {
    const index = inquiries.value.findIndex(i => i.id === id);
    if (index !== -1) {
      inquiries.value[index] = {
        ...inquiries.value[index],
        ...updates,
        metadata: {
          ...inquiries.value[index].metadata,
          updatedAt: new Date(),
          ...(updates.status === 'resolved' && { resolvedAt: new Date() })
        }
      };
    }
  }

  function addInquiryResponse(inquiryId: string, responseData: Omit<InquiryResponse, 'id' | 'inquiryId' | 'createdAt'>): InquiryResponse {
    const inquiry = inquiries.value.find(i => i.id === inquiryId);
    if (!inquiry) throw new Error('Inquiry not found');

    const response: InquiryResponse = {
      ...responseData,
      id: generateId(),
      inquiryId,
      createdAt: new Date()
    };

    inquiry.responses.push(response);
    inquiry.metadata.updatedAt = new Date();

    // Update response time if this is the first response
    if (inquiry.responses.length === 1 && responseData.sender.type !== 'customer') {
      inquiry.metadata.responseTime = Math.floor(
        (response.createdAt.getTime() - inquiry.metadata.createdAt.getTime()) / (1000 * 60)
      );
    }

    return response;
  }

  // Workflow execution functions
  function executeWorkflow(workflowId: string, context: Record<string, any> = {}, executedBy: string = 'system'): WorkflowExecution {
    const workflow = getWorkflowById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId,
      status: 'running',
      currentStep: workflow.steps[0]?.id || '',
      context,
      startedAt: new Date(),
      executedBy,
      results: {
        success: false,
        stepsCompleted: 0,
        totalSteps: workflow.steps.length
      }
    };

    executions.value.push(execution);
    
    // Start async execution
    processWorkflowExecution(execution.id);
    
    return execution;
  }

  async function processWorkflowExecution(executionId: string) {
    const execution = executions.value.find(e => e.id === executionId);
    if (!execution) return;

    const workflow = getWorkflowById(execution.workflowId);
    if (!workflow) return;

    try {
      // Process each step sequentially
      for (const step of workflow.steps) {
        if (execution.status !== 'running') break;

        execution.currentStep = step.id;
        
        // Execute step based on type
        await executeWorkflowStep(step, execution);
        
        execution.results.stepsCompleted++;
      }

      // Mark as completed
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = Math.floor(
        (execution.completedAt.getTime() - execution.startedAt.getTime()) / (1000 * 60)
      );
      execution.results.success = true;

    } catch (error: any) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.results.success = false;
      execution.results.error = error.message;
    }
  }

  async function executeWorkflowStep(step: any, execution: WorkflowExecution) {
    switch (step.type) {
      case 'agent_action':
        await executeAgentAction(step, execution);
        break;
      case 'notification':
        await sendNotification(step, execution);
        break;
      case 'decision':
        await processDecision(step, execution);
        break;
      // Add more step types as needed
      default:
        console.log(`Executing step: ${step.name}`);
    }
  }

  async function executeAgentAction(step: any, execution: WorkflowExecution) {
    if (!step.config.agentId) return;

    // Import agent store to create tasks
    const { useAgentStore } = await import('@/stores/agents');
    const agentStore = useAgentStore();

    // Create a task for the agent
    agentStore.createTask({
      agentId: step.config.agentId,
      projectId: execution.context.projectId || '',
      description: step.config.prompt || step.name,
      status: 'pending',
      type: 'create_content',
      priority: 'medium',
      dependencies: []
    });
  }

  async function sendNotification(step: any, execution: WorkflowExecution) {
    const target = step.config.notificationTarget;
    const message = `Workflow notification: ${step.name}`;
    
    // In a real implementation, this would send to Slack, email, etc.
    console.log(`Notification sent to ${target}: ${message}`);
    
    // Store notification in execution context
    execution.context.notifications = execution.context.notifications || [];
    execution.context.notifications.push({
      target,
      message,
      sentAt: new Date()
    });
  }

  async function processDecision(step: any, execution: WorkflowExecution) {
    // Simple condition evaluation - in production this would be more sophisticated
    const condition = step.config.condition || 'true';
    const result = evaluateCondition(condition, execution.context);
    
    execution.context.lastDecision = {
      stepId: step.id,
      result,
      evaluatedAt: new Date()
    };
  }

  function evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simple evaluation - in production use a proper expression evaluator
    try {
      // Replace context variables in condition
      let evaluatedCondition = condition;
      Object.keys(context).forEach(key => {
        evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\{${key}\\}`, 'g'), context[key]);
      });
      
      // Basic evaluations
      if (evaluatedCondition === 'true') return true;
      if (evaluatedCondition === 'false') return false;
      if (evaluatedCondition.includes('>') || evaluatedCondition.includes('<') || evaluatedCondition.includes('===')) {
        // For demo purposes, randomly return true/false for complex conditions
        return Math.random() > 0.5;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Auto-categorization functions
  function categorizeInquiry(content: string, subject: string): CustomerInquiry['category'] {
    const text = (content + ' ' + subject).toLowerCase();
    
    if (text.includes('billing') || text.includes('payment') || text.includes('invoice')) {
      return 'billing';
    }
    if (text.includes('bug') || text.includes('error') || text.includes('problem') || text.includes('issue')) {
      return 'support';
    }
    if (text.includes('feature') || text.includes('request') || text.includes('enhancement')) {
      return 'feature_request';
    }
    if (text.includes('sales') || text.includes('pricing') || text.includes('purchase') || text.includes('buy')) {
      return 'sales';
    }
    if (text.includes('complain') || text.includes('dissatisfied') || text.includes('upset')) {
      return 'complaint';
    }
    if (text.includes('feedback') || text.includes('suggestion') || text.includes('review')) {
      return 'feedback';
    }
    
    return 'support'; // default fallback
  }

  function prioritizeInquiry(content: string, subject: string): CustomerInquiry['priority'] {
    const text = (content + ' ' + subject).toLowerCase();
    
    if (text.includes('urgent') || text.includes('emergency') || text.includes('critical') || text.includes('down')) {
      return 'urgent';
    }
    if (text.includes('important') || text.includes('asap') || text.includes('priority')) {
      return 'high';
    }
    if (text.includes('when possible') || text.includes('no rush') || text.includes('low priority')) {
      return 'low';
    }
    
    return 'medium'; // default
  }

  function triggerInquiryWorkflow(inquiryId: string) {
    // Find appropriate workflow for customer inquiries
    const customerServiceWorkflow = workflows.value.find(w => 
      w.category === 'customer_service' && w.status === 'active'
    );
    
    if (customerServiceWorkflow) {
      executeWorkflow(customerServiceWorkflow.id, { inquiryId }, 'system');
    }
  }

  // Template functions
  function getTemplatesByCategory(category: BusinessWorkflow['category']) {
    return templates.value.filter(t => t.category === category);
  }

  function createWorkflowFromTemplate(templateId: string, customizations: Partial<BusinessWorkflow> = {}) {
    const template = templates.value.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    return createWorkflow({
      ...template.workflow,
      ...customizations,
      name: customizations.name || `${template.name} - Instance`,
    });
  }

  // Initialize with default templates
  function initializeDefaultTemplates() {
    const defaultTemplates: BusinessProcessTemplate[] = [
      {
        id: 'customer-inquiry-basic',
        name: 'Basic Customer Inquiry Handler',
        description: 'Automatically categorize, prioritize, and route customer inquiries to appropriate agents.',
        category: 'customer_service',
        workflow: {
          name: 'Customer Inquiry Processing',
          description: 'Automated customer inquiry handling workflow',
          category: 'customer_service',
          status: 'active',
          steps: [
            {
              id: 'categorize',
              name: 'Categorize Inquiry',
              type: 'agent_action',
              config: {
                agentId: 'customer-service-agent',
                prompt: 'Analyze the customer inquiry and categorize it appropriately.'
              },
              nextSteps: ['prioritize'],
              position: { x: 100, y: 100 }
            },
            {
              id: 'prioritize',
              name: 'Set Priority',
              type: 'decision',
              config: {
                condition: '{category} === "billing" || {category} === "complaint"'
              },
              nextSteps: ['assign-agent'],
              position: { x: 300, y: 100 }
            },
            {
              id: 'assign-agent',
              name: 'Assign to Agent',
              type: 'agent_action',
              config: {
                agentId: 'customer-service-agent',
                prompt: 'Assign this inquiry to the most appropriate agent based on category and workload.'
              },
              nextSteps: ['send-notification'],
              position: { x: 500, y: 100 }
            },
            {
              id: 'send-notification',
              name: 'Notify Team',
              type: 'notification',
              config: {
                notificationTarget: 'customer-service-team'
              },
              nextSteps: [],
              position: { x: 700, y: 100 }
            }
          ],
          triggers: [
            {
              id: 'email-trigger',
              type: 'email',
              config: {
                emailPattern: 'support@*'
              },
              isActive: true
            }
          ]
        },
        requiredAgents: ['customer_service'],
        requiredIntegrations: ['email'],
        estimatedSetupTime: 15,
        difficulty: 'beginner',
        tags: ['customer-service', 'automation', 'email'],
        isPublic: true
      }
    ];

    templates.value = defaultTemplates;
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Initialize templates on store creation
  initializeDefaultTemplates();

  return {
    workflows,
    executions,
    inquiries,
    templates,
    activeWorkflows,
    runningExecutions,
    openInquiries,
    urgentInquiries,
    // Workflow functions
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getWorkflowById,
    // Inquiry functions
    createInquiry,
    updateInquiry,
    addInquiryResponse,
    // Execution functions
    executeWorkflow,
    // Template functions
    getTemplatesByCategory,
    createWorkflowFromTemplate,
  };
}, {
  persist: {
    storage: localStorage,
    pick: ['workflows', 'inquiries']
  }
});