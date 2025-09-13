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
  type: 'code_generation' | 'content_creation' | 'file_management' | 'api_integration' | 'analysis' | 'mcp_client' | 'ai_generation';
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