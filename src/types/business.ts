// Business automation specific types

export interface BusinessWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'customer_service' | 'sales' | 'marketing' | 'operations' | 'development' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'draft';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    estimatedDuration?: number; // minutes
    successRate?: number; // percentage
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent_action' | 'decision' | 'user_input' | 'external_api' | 'condition' | 'notification';
  config: {
    agentId?: string;
    prompt?: string;
    condition?: string;
    apiEndpoint?: string;
    notificationTarget?: string;
    requiresApproval?: boolean;
  };
  nextSteps: string[]; // Step IDs for branching
  position: { x: number; y: number }; // For visual workflow designer
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'webhook' | 'email' | 'file_upload' | 'manual' | 'agent_event';
  config: {
    schedule?: string; // cron expression
    webhookUrl?: string;
    emailPattern?: string;
    eventType?: string;
  };
  isActive: boolean;
}

export interface CustomerInquiry {
  id: string;
  source: 'email' | 'webhook' | 'form' | 'chat' | 'phone' | 'social';
  subject: string;
  content: string;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    customerId?: string;
  };
  category: 'support' | 'sales' | 'billing' | 'feedback' | 'feature_request' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedAgentId?: string;
  assignedHumanId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags: string[];
  responses: InquiryResponse[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    responseTime?: number; // minutes
    resolutionTime?: number; // minutes
  };
}

export interface InquiryResponse {
  id: string;
  inquiryId: string;
  content: string;
  sender: {
    type: 'agent' | 'human' | 'customer';
    id: string;
    name: string;
  };
  isPublic: boolean; // whether visible to customer
  attachments: string[];
  createdAt: Date;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: 'task_delegation' | 'information_request' | 'approval_request' | 'status_update' | 'collaboration';
  content: string;
  context: {
    projectId?: string;
    taskId?: string;
    workflowId?: string;
    inquiryId?: string;
    [key: string]: any; // Allow additional properties
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'responded' | 'completed';
  requiresResponse: boolean;
  response?: string;
  createdAt: Date;
  readAt?: Date;
  respondedAt?: Date;
}

export interface BusinessMetrics {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  metrics: {
    customerInquiries: {
      total: number;
      resolved: number;
      avgResponseTime: number; // minutes
      avgResolutionTime: number; // hours
      satisfactionScore?: number; // 1-5
      byCategory: Record<string, number>;
      bySource: Record<string, number>;
    };
    agentPerformance: {
      totalTasks: number;
      completedTasks: number;
      avgTaskTime: number; // minutes
      successRate: number; // percentage
      collaborations: number;
      autonomousActions: number;
    };
    workflows: {
      totalExecutions: number;
      successfulExecutions: number;
      avgDuration: number; // minutes
      byCategory: Record<string, number>;
    };
    business: {
      revenue?: number;
      costs?: number;
      automationSavings?: number; // estimated time saved in hours
      processEfficiency?: number; // percentage improvement
    };
  };
}

export interface ExternalIntegration {
  id: string;
  name: string;
  type: 'email' | 'crm' | 'calendar' | 'communication' | 'payment' | 'storage' | 'analytics' | 'custom';
  provider: string; // e.g., 'gmail', 'salesforce', 'slack', 'stripe'
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  config: {
    endpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    credentials?: Record<string, string>;
    settings?: Record<string, any>;
  };
  capabilities: string[]; // e.g., ['send_email', 'read_calendar', 'create_contact']
  isActive: boolean;
  lastSync?: Date;
  errorMessage?: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface BusinessAgent extends Omit<import('@/types').Agent, 'type' | 'capabilities'> {
  type: 'customer_service' | 'sales' | 'marketing' | 'development' | 'operations' | 'analytics' | 'general';
  specialization: string; // e.g., 'email_support', 'lead_qualification', 'content_creation'
  businessCapabilities: BusinessCapability[];
  performanceMetrics: {
    tasksCompleted: number;
    avgResponseTime: number; // minutes
    customerSatisfaction?: number; // 1-5 rating
    collaborationScore: number; // based on successful inter-agent interactions
    learningProgress: number; // percentage of improvement over time
  };
  workingHours?: {
    timezone: string;
    schedule: Record<string, { start: string; end: string }>; // day of week -> hours
  };
  escalationRules: {
    maxAttempts: number;
    escalateToAgent?: string;
    escalateToHuman?: boolean;
    escalationConditions: string[];
  };
}

export interface BusinessCapability {
  type: 'customer_communication' | 'data_analysis' | 'content_generation' | 'process_automation' | 'decision_making' | 'quality_assurance';
  description: string;
  enabled: boolean;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  metrics: {
    usageCount: number;
    successRate: number;
    avgExecutionTime: number;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  currentStep: string;
  context: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // minutes
  executedBy: string; // agent or user ID
  results: {
    success: boolean;
    output?: any;
    error?: string;
    stepsCompleted: number;
    totalSteps: number;
  };
}

export interface BusinessProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessWorkflow['category'];
  workflow: Omit<BusinessWorkflow, 'id' | 'metadata'>;
  requiredAgents: string[]; // agent types or specific IDs
  requiredIntegrations: string[]; // integration types
  estimatedSetupTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isPublic: boolean;
}