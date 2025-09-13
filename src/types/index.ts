// Core types for the AI Board application

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed' | 'archived';
  agents: string[]; // Agent IDs assigned to this project
  content: ProjectContent[];
  tasks: ProjectTask[]; // Project tasks (Jira-like tickets)
  storageConfig?: StorageConfig;
}

export interface ProjectContent {
  id: string;
  projectId: string;
  type: 'file' | 'folder' | 'note' | 'code' | 'document';
  name: string;
  path: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Agent ID or 'user'
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'feature' | 'bug' | 'improvement' | 'documentation' | 'research';
  assigneeId?: string; // Agent ID or 'user'
  assigneeName?: string; // Display name for UI
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  tags: string[];
  comments: TaskComment[];
  attachments: string[]; // File paths or URLs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Agent ID or 'user'
  completedAt?: Date;
  blockedReason?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  authorId: string; // Agent ID or 'user'
  authorName: string; // Display name
  createdAt: Date;
  isSystemGenerated?: boolean; // For automated agent comments
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'autonomous' | 'reactive' | 'collaborative';
  status: 'active' | 'idle' | 'busy' | 'error' | 'offline';
  capabilities: AgentCapability[];
  config: AgentConfig;
  projects: string[]; // Project IDs this agent is working on
  lastActivity: Date;
  createdAt: Date;
  runInterval?: number; // Interval in seconds for agent execution
}

export interface AgentCapability {
  type: 'code_generation' | 'content_creation' | 'file_management' | 'api_integration' | 'analysis' | 'mcp_client' | 'ai_generation' | 'github_issues';
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  autonomyLevel: 'low' | 'medium' | 'high';
  promptingStrategy: 'goal_oriented' | 'task_driven' | 'exploratory';
  mcpEndpoints: MCPEndpoint[];
  storageAccess: boolean;
  collaboration: {
    canCreateProjects: boolean;
    canModifyOtherAgentWork: boolean;
    requiresApproval: boolean;
  };
}

export interface MCPEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'knowledge_base' | 'tool_server' | 'data_source' | 'api_gateway';
  auth?: {
    type: 'bearer' | 'api_key' | 'oauth';
    credentials: Record<string, string>;
  };
  capabilities: string[];
  isActive: boolean;
}

export interface StorageConfig {
  provider: 'minio' | 's3' | 'azure' | 'gcs' | 'local';
  endpoint?: string;
  bucket: string;
  credentials: {
    accessKey: string;
    secretKey: string;
    region?: string;
  };
  pathPrefix?: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  projectId: string;
  type: 'create_content' | 'modify_file' | 'analyze_data' | 'generate_code' | 'integrate_api';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dependencies: string[]; // Other task IDs
  result?: {
    success: boolean;
    data?: any;
    error?: string;
    artifacts?: string[]; // File paths or content IDs created
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentPrompt {
  id: string;
  agentId: string;
  content: string;
  context: {
    projectId?: string;
    previousTasks?: string[];
    availableResources?: string[];
  };
  generatedAt: Date;
  response?: string;
  responseAt?: Date;
}

export interface SystemEvent {
  id: string;
  type: 'agent_created' | 'project_created' | 'task_completed' | 'error' | 'system_status';
  source: string; // Agent ID or 'system'
  data: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

// GitHub MCP specific types
export interface GitHubIntegration {
  id: string;
  projectId: string;
  repositoryUrl: string;
  owner: string;
  repo: string;
  branch: string;
  lastSync: Date;
  syncEnabled: boolean;
  accessToken?: string;
}

export interface GitHubSyncTask {
  id: string;
  integrationId: string;
  type: 'pull' | 'push' | 'sync';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  changes: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

// GitHub Issue types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  html_url: string;
  user: GitHubUser;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  due_on?: string;
}

export interface CreateIssueRequest {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface GitHubAutoIssueConfig {
  id: string;
  agentId: string;
  repositoryOwner: string;
  repositoryName: string;
  enabled: boolean;
  analysisPrompt?: string;
  issueTemplate?: string;
  labels?: string[];
  assignees?: string[];
  scheduleInterval: number; // minutes
  lastRun?: Date;
  createdIssues: number;
  lastError?: string;
}

// OpenAI Integration types
export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface GenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  stop?: string[];
}

export interface OpenAIResponse {
  content: string;
  role: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  created: number;
}

export interface OpenAIIntegration {
  id: string;
  name: string;
  isConfigured: boolean;
  defaultModel: string;
  lastUsed: Date;
  usage: {
    totalTokens: number;
    totalRequests: number;
    totalCost: number; // Estimated cost in USD
  };
}

export interface AgentOpenAIConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  autonomousPrompting: boolean;
  promptInterval: number; // minutes between autonomous prompts
}

// Agent Communication & Orchestration Types
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: 'task_request' | 'task_response' | 'data_share' | 'status_update' | 'collaboration_invite';
  subject: string;
  content: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  responseId?: string; // ID of response message
}

export interface AgentCommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'broadcast' | 'workflow' | 'business_process';
  participants: string[]; // Agent IDs
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  type: 'customer_service' | 'content_creation' | 'data_analysis' | 'custom';
  category: 'sales' | 'marketing' | 'support' | 'operations' | 'finance' | 'hr' | 'general';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
  isTemplate: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent_task' | 'human_approval' | 'condition' | 'data_transform' | 'external_api';
  agentRole?: string; // Required role/capability for agent assignment
  agentId?: string; // Specific agent assignment (optional)
  description: string;
  config: WorkflowStepConfig;
  dependencies: string[]; // Step IDs that must complete first
  conditions?: WorkflowCondition[];
  timeout?: number; // seconds
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number; // seconds
  };
}

export interface WorkflowStepConfig {
  input?: Record<string, any>;
  output?: Record<string, any>;
  prompt?: string;
  requiredCapabilities?: string[];
  approvers?: string[]; // For human approval steps
  externalApiConfig?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    payload?: any;
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
  nextStepId?: string; // Step to execute if condition is true
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'event' | 'webhook' | 'file_upload' | 'message';
  config: {
    schedule?: string; // cron expression
    eventType?: string;
    webhookUrl?: string;
    conditions?: WorkflowCondition[];
  };
  isActive: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepId?: string;
  executionContext: Record<string, any>; // Data passed between steps
  steps: WorkflowStepExecution[];
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string; // Agent ID or 'system' or 'user'
  errorMessage?: string;
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    totalDuration?: number; // milliseconds
  };
}

export interface WorkflowStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  assignedAgentId?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  input?: any;
  output?: any;
  errorMessage?: string;
  retryCount: number;
}

export interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  category: 'customer_onboarding' | 'support_ticket' | 'content_pipeline' | 'data_analysis' | 'custom';
  workflowId: string;
  isActive: boolean;
  metrics: {
    totalExecutions: number;
    successRate: number;
    averageDuration: number; // milliseconds
    lastExecution?: Date;
  };
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCapabilityRegistry {
  capability: string;
  description: string;
  agentIds: string[]; // Agents that have this capability
  isCore: boolean; // Core capabilities vs custom ones
  examples?: string[];
  requiredConfig?: Record<string, any>;
}

export interface AgentOrchestrationMetrics {
  totalMessages: number;
  activeWorkflows: number;
  completedWorkflows: number;
  averageWorkflowDuration: number;
  agentUtilization: Record<string, number>; // agentId -> utilization percentage
  topPerformingAgents: Array<{
    agentId: string;
    score: number;
    completedTasks: number;
  }>;
  businessProcessMetrics: Record<string, {
    executions: number;
    successRate: number;
    averageDuration: number;
  }>;
}