<template>
  <div class="agent-manager">
    <UICard variant="elevated" class="page-header">
      <template #header>
        <div class="header-content">
          <div class="header-navigation">
            <UIButton @click="$router.back()" variant="ghost" size="sm" class="back-button">
              <span class="back-icon">←</span>
              <span>Back</span>
            </UIButton>
            <nav class="breadcrumb" aria-label="Breadcrumb">
              <ol class="breadcrumb-list">
                <li><router-link to="/" class="breadcrumb-link">Home</router-link></li>
                <li><span class="breadcrumb-separator">/</span></li>
                <li><span class="breadcrumb-current" aria-current="page">Agent Manager</span></li>
              </ol>
            </nav>
          </div>
          <div class="header-title-section">
            <h1 class="page-title">
              <span class="title-icon">🤖</span>
              Agent Manager
            </h1>
            <p class="page-description">Create, configure, and manage your AI agents</p>
          </div>
          <div class="header-actions">
            <UIButton @click="showCreateDialog = true" size="lg" class="primary-action">
              <span class="action-icon">+</span>
              New Agent
            </UIButton>
          </div>
        </div>
      </template>
    </UICard>

    <UICard variant="elevated" class="agent-content" v-if="agentStore.agents.length > 0">
      <template #header>
        <div class="agents-section-header">
          <div class="section-title">
            <h2>Your Agents</h2>
            <UIBadge variant="primary" size="sm">{{ agentStore.agents.length }} Active</UIBadge>
          </div>
          <div class="section-filters">
            <UISelect v-model="statusFilter" class="filter-select">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </UISelect>
          </div>
        </div>
      </template>
      
      <div class="agents-grid">
        <UICard 
          v-for="agent in filteredAgents" 
          :key="agent.id"
          variant="outlined"
          class="agent-card"
          :class="{ 'agent-card--featured': agent.status === 'active' }"
        >
          <template #header>
            <div class="agent-header">
              <div class="agent-title-section">
                <div class="agent-avatar" :class="`agent-avatar--${agent.type}`">
                  <span class="avatar-emoji">{{ getAgentEmoji(agent.type) }}</span>
                </div>
                <div class="agent-name-section">
                  <h3 class="agent-name">{{ agent.name }}</h3>
                  <span class="agent-type">{{ formatAgentType(agent.type) }}</span>
                </div>
              </div>
              <div class="agent-status-section">
                <UIBadge 
                  :variant="getStatusVariant(agent.status)" 
                  class="status-badge"
                  :class="`status-badge--${agent.status}`"
                >
                  <span class="status-indicator"></span>
                  {{ formatStatus(agent.status) }}
                </UIBadge>
              </div>
            </div>
          </template>
          
          <div class="agent-content-body">
            <p class="agent-description">{{ agent.description }}</p>
            
            <div class="agent-metrics">
              <div class="metric-item">
                <span class="metric-icon">📊</span>
                <div class="metric-content">
                  <span class="metric-label">Projects</span>
                  <span class="metric-value">{{ agent.projects.length }}</span>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-icon">⚙️</span>
                <div class="metric-content">
                  <span class="metric-label">Autonomy</span>
                  <span class="metric-value">{{ formatAutonomy(agent.config.autonomyLevel) }}</span>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-icon">🕒</span>
                <div class="metric-content">
                  <span class="metric-label">Last Active</span>
                  <span class="metric-value">{{ formatRelativeTime(agent.lastActivity) }}</span>
                </div>
              </div>
            </div>
            
            <div class="capabilities-section">
              <h4 class="capabilities-title">Capabilities</h4>
              <div class="capability-tags">
                <UIBadge
                  v-for="capability in agent.capabilities.filter(c => c.enabled).slice(0, 3)" 
                  :key="capability.type"
                  variant="success"
                  size="sm"
                  class="capability-badge"
                >
                  <span class="capability-icon">{{ getCapabilityIcon(capability.type) }}</span>
                  {{ formatCapability(capability.type) }}
                </UIBadge>
                <UIBadge
                  v-if="agent.capabilities.filter(c => c.enabled).length > 3"
                  variant="gray"
                  size="sm"
                  class="capability-badge capability-badge--more"
                >
                  +{{ agent.capabilities.filter(c => c.enabled).length - 3 }} more
                </UIBadge>
              </div>
            </div>
          </div>
          
          <template #footer>
            <div class="agent-actions">
              <div class="action-group action-group--primary">
                <UIButton @click="editAgent(agent)" variant="secondary" size="sm" class="action-button">
                  <span class="action-icon">✏️</span>
                  Edit
                </UIButton>
                <UIButton 
                  @click="toggleAgentStatus(agent)" 
                  :variant="agent.status === 'active' ? 'warning' : 'success'" 
                  size="sm" 
                  class="action-button"
                >
                  <span class="action-icon">{{ agent.status === 'active' ? '⏸️' : '▶️' }}</span>
                  {{ agent.status === 'active' ? 'Pause' : 'Activate' }}
                </UIButton>
              </div>
              <div class="action-group action-group--secondary">
                <UIButton @click="deleteAgent(agent.id)" variant="danger" size="sm" class="action-button action-button--danger">
                  <span class="action-icon">🗑️</span>
                  Delete
                </UIButton>
              </div>
            </div>
          </template>
        </UICard>
      </div>
      <div v-if="agentStore.agents.length === 0" class="empty-state">
        <div class="empty-state-content">
          <div class="empty-state-visual">
            <div class="empty-state-icon">🤖</div>
            <div class="empty-state-animation"></div>
          </div>
          <div class="empty-state-text">
            <h3 class="empty-state-title">Welcome to Agent Management</h3>
            <p class="empty-state-description">
              Create your first AI agent to start automating tasks and workflows. 
              Choose from our pre-built templates or create a custom agent tailored to your needs.
            </p>
          </div>
          <div class="empty-state-actions">
            <UIButton @click="showCreateDialog = true" size="lg" class="primary-action">
              <span class="action-icon">✨</span>
              Create Your First Agent
            </UIButton>
            <p class="empty-state-hint">
              Or choose from our <a href="#templates" class="hint-link">templates below</a> to get started quickly
            </p>
          </div>
          <div class="empty-state-features">
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">🚀</span>
                <span class="feature-text">Automated task execution</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔗</span>
                <span class="feature-text">API integrations</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span class="feature-text">Performance monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UICard>

    <!-- Create/Edit Agent Dialog -->
    <UIModal 
      v-model="showCreateDialog"
      :title="editingAgent ? 'Edit Agent' : 'Create New Agent'"
      size="lg"
    >
      <form @submit.prevent="saveAgent" class="agent-form">
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-row">
            <UIInput 
              v-model="agentForm.name"
              label="Agent Name"
              placeholder="e.g., Content Creator Pro"
              required
              class="form-field"
            />
            
            <UISelect 
              v-model="agentForm.status"
              label="Initial Status"
              class="form-field"
            >
              <option value="active">🟢 Active</option>
              <option value="idle">🟡 Idle</option>
              <option value="offline">🔴 Offline</option>
            </UISelect>
          </div>
          
          <UITextarea 
            v-model="agentForm.description"
            label="Description"
            placeholder="Describe what this agent will do and its primary purpose..."
            :rows="3"
            class="form-field-full"
          />
        </div>
        
        <div class="form-section">
          <h3>Agent Configuration</h3>
          <div class="form-row">
            <UISelect 
              v-model="agentForm.type"
              label="Agent Type"
              class="form-field"
            >
              <option value="autonomous">🤖 Autonomous - Works independently</option>
              <option value="reactive">⚡ Reactive - Responds to events</option>
              <option value="collaborative">🤝 Collaborative - Works with others</option>
            </UISelect>
            
            <UISelect 
              v-model="agentForm.autonomyLevel"
              label="Autonomy Level"
              class="form-field"
            >
              <option value="low">🔒 Low - Requires approval</option>
              <option value="medium">⚖️ Medium - Balanced control</option>
              <option value="high">🚀 High - Full autonomy</option>
            </UISelect>
          </div>
          
          <UISelect 
            v-model="agentForm.promptingStrategy"
            label="Prompting Strategy"
            class="form-field-full"
          >
            <option value="goal_oriented">🎯 Goal Oriented - Focuses on objectives</option>
            <option value="task_driven">📋 Task Driven - Follows task lists</option>
            <option value="exploratory">🔍 Exploratory - Investigates and learns</option>
          </UISelect>
        </div>
        
        <div class="form-section">
          <h3>Capabilities</h3>
          <p class="capabilities-hint">Select the abilities this agent should have:</p>
          <div class="capabilities-grid">
            <label 
              v-for="capability in availableCapabilities" 
              :key="capability.type"
              class="capability-checkbox"
            >
              <input 
                type="checkbox" 
                :value="capability.type"
                v-model="agentForm.selectedCapabilities"
              />
              <div class="capability-info">
                <span class="capability-icon">{{ capability.icon }}</span>
                <div class="capability-details">
                  <strong>{{ formatCapability(capability.type) }}</strong>
                  <small>{{ capability.description }}</small>
                </div>
              </div>
            </label>
          </div>
        </div>
      </form>
      
      <template #footer>
        <div class="modal-footer">
          <UIButton @click="closeDialog" variant="secondary">
            Cancel
          </UIButton>
          <UIButton @click="saveAgent" :disabled="!isFormValid">
            {{ editingAgent ? 'Update Agent' : 'Create Agent' }}
          </UIButton>
        </div>
      </template>
    </UIModal>

    <!-- Agent Templates & AI Generator -->
    <UICard variant="elevated" class="agent-templates" id="templates">
      <template #header>
        <div class="templates-header">
          <div class="templates-title-section">
            <h2 class="templates-title">
              <span class="title-icon">📋</span>
              Agent Templates
            </h2>
            <p class="templates-subtitle">Choose a pre-configured template to get started quickly</p>
          </div>
          <div class="templates-actions">
            <UIButton @click="showAIGenerator = true" variant="success" size="sm" class="ai-generator-quick-btn">
              <span class="action-icon">✨</span>
              AI Generate
            </UIButton>
          </div>
        </div>
      </template>
      
      <div class="template-grid">
        <UICard 
          v-for="template in agentTemplates" 
          :key="template.id"
          variant="outlined"
          class="template-card"
          :class="`template-card--${template.type}`"
          @click="selectTemplate(template)"
        >
          <template #header>
            <div class="template-header">
              <div class="template-icon-section">
                <div class="template-icon" :class="`template-icon--${template.type}`">
                  {{ getTemplateIcon(template.id) }}
                </div>
                <div class="template-type-badge">
                  <UIBadge :variant="getTemplateVariant(template.type)" size="sm">
                    {{ formatTemplateType(template.type) }}
                  </UIBadge>
                </div>
              </div>
              <div class="template-title-section">
                <h3 class="template-name">{{ template.name }}</h3>
                <div class="template-stats">
                  <span class="stat-item">
                    <span class="stat-icon">⚙️</span>
                    {{ template.config.autonomyLevel }}
                  </span>
                  <span class="stat-item">
                    <span class="stat-icon">🔄</span>
                    {{ template.runInterval }}s
                  </span>
                </div>
              </div>
            </div>
          </template>
          
          <div class="template-content">
            <p class="template-description">{{ template.description }}</p>
            
            <div class="template-capabilities">
              <h4 class="capabilities-title">
                <span class="title-icon">🎯</span>
                Key Capabilities
              </h4>
              <div class="capability-list">
                <UIBadge
                  v-for="capability in template.capabilities.slice(0, 2)" 
                  :key="capability.type"
                  variant="success"
                  size="sm"
                  class="capability-badge"
                >
                  <span class="capability-icon">{{ getCapabilityIcon(capability.type) }}</span>
                  {{ formatCapability(capability.type) }}
                </UIBadge>
                <UIBadge
                  v-if="template.capabilities.length > 2"
                  variant="gray"
                  size="sm"
                  class="capability-badge capability-badge--more"
                >
                  +{{ template.capabilities.length - 2 }}
                </UIBadge>
              </div>
            </div>
            
            <div class="template-config-preview">
              <div class="config-item">
                <span class="config-label">Strategy:</span>
                <span class="config-value">{{ formatStrategy(template.config.promptingStrategy) }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">Run Interval:</span>
                <span class="config-value">{{ template.runInterval }}s</span>
              </div>
            </div>
          </div>
          
          <template #footer>
            <div class="template-footer">
              <UIButton @click.stop="selectTemplate(template)" class="template-select-btn" variant="primary">
                <span class="action-icon">🚀</span>
                Create Agent
              </UIButton>
              <UIButton @click.stop="previewTemplate(template)" variant="ghost" size="sm" class="template-preview-btn">
                <span class="action-icon">👁️</span>
                Preview
              </UIButton>
            </div>
          </template>
        </UICard>
      </div>
      
      <div class="ai-generator-section">
        <div class="ai-generator-info">
          <h3>🤖 AI-Powered Agent Creation</h3>
          <p>Describe your needs and let OpenAI create a custom agent for you</p>
        </div>
        <UIButton @click="showAIGenerator = true" variant="success" size="lg" class="ai-generator-btn">
          ✨ Generate Custom Agent
        </UIButton>
      </div>
    </UICard>

    <!-- AI Generator Modal -->
    <UIModal 
      v-model="showAIGenerator"
      title="Generate Agent with OpenAI"
      size="lg"
    >
      <form @submit.prevent="generateAgent">
        <UITextarea 
          v-model="agentPrompt"
          label="Describe the agent you want"
          :rows="4"
          placeholder="e.g., A research agent that can analyze data and write reports..."
        />
        
        <div v-if="aiAgentResult" class="generated-result">
          <h4>Generated Agent:</h4>
          <pre>{{ aiAgentResult }}</pre>
        </div>
      </form>
      
      <template #footer>
        <UIButton @click="showAIGenerator = false" variant="secondary">
          Cancel
        </UIButton>
        <UIButton @click="generateAgent" variant="primary" :loading="isGenerating">
          Generate
        </UIButton>
        <UIButton 
          v-if="aiAgentResult" 
          @click="addGeneratedAgent" 
          variant="success"
        >
          Add Agent
        </UIButton>
      </template>
    </UIModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAgentStore } from '@/stores/agents'
import { UIButton, UICard, UIModal, UIInput, UITextarea, UISelect, UIBadge } from '@/ui'
import type { Agent, AgentCapability } from '@/types'

const agentStore = useAgentStore()

const showCreateDialog = ref(false)
const showAIGenerator = ref(false)
const editingAgent = ref<Agent | null>(null)
const agentPrompt = ref('')
const aiAgentResult = ref('')
const isGenerating = ref(false)
const statusFilter = ref('all')

const agentForm = reactive({
  name: '',
  description: '',
  type: 'autonomous' as Agent['type'],
  status: 'active' as Agent['status'],
  autonomyLevel: 'medium' as 'low' | 'medium' | 'high',
  promptingStrategy: 'goal_oriented' as 'goal_oriented' | 'task_driven' | 'exploratory',
  selectedCapabilities: [] as AgentCapability['type'][],
})

const filteredAgents = computed(() => {
  if (statusFilter.value === 'all') {
    return agentStore.agents
  }
  return agentStore.agents.filter(agent => agent.status === statusFilter.value)
})

const availableCapabilities: Array<{
  type: AgentCapability['type'];
  icon: string;
  description: string;
}> = [
  {
    type: 'code_generation',
    icon: '💻',
    description: 'Generate and write code in various programming languages'
  },
  {
    type: 'content_creation',
    icon: '📝',
    description: 'Create articles, documentation, and written content'
  },
  {
    type: 'file_management',
    icon: '📁',
    description: 'Organize, create, and manage files and folders'
  },
  {
    type: 'api_integration',
    icon: '🔌',
    description: 'Connect and integrate with external APIs and services'
  },
  {
    type: 'analysis',
    icon: '📊',
    description: 'Analyze data, trends, and generate insights'
  },
  {
    type: 'ai_generation',
    icon: '🤖',
    description: 'Use AI models for content generation and processing'
  },
  {
    type: 'mcp_client',
    icon: '🌐',
    description: 'Connect to MCP (Model Context Protocol) endpoints'
  }
]

const isFormValid = computed(() => {
  return agentForm.name.trim().length > 0 && agentForm.selectedCapabilities.length > 0
})

function getStatusVariant(status: Agent['status']) {
  switch (status) {
    case 'active': return 'success'
    case 'idle': return 'warning'
    case 'busy': return 'primary'
    case 'error': return 'danger'
    case 'offline': return 'danger'
    default: return 'gray'
  }
}

function formatStatus(status: Agent['status']): string {
  switch (status) {
    case 'active': return 'Active'
    case 'idle': return 'Idle'
    case 'busy': return 'Busy'
    case 'error': return 'Error'
    case 'offline': return 'Offline'
    default: return status
  }
}

function formatAgentType(type: Agent['type']): string {
  switch (type) {
    case 'autonomous': return 'Autonomous'
    case 'reactive': return 'Reactive'
    case 'collaborative': return 'Collaborative'
    default: return type
  }
}

function formatTemplateType(type: string): string {
  switch (type) {
    case 'autonomous': return 'Auto'
    case 'reactive': return 'React'
    case 'collaborative': return 'Collab'
    default: return type
  }
}

function getAgentEmoji(type: Agent['type']): string {
  switch (type) {
    case 'autonomous': return '🤖'
    case 'reactive': return '⚡'
    case 'collaborative': return '🤝'
    default: return '🤖'
  }
}

function formatAutonomy(level: string): string {
  switch (level) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    default: return level
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getCapabilityIcon(capability: string): string {
  switch (capability) {
    case 'code_generation': return '💻'
    case 'content_creation': return '📝'
    case 'file_management': return '📁'
    case 'api_integration': return '🔌'
    case 'analysis': return '📊'
    case 'ai_generation': return '🤖'
    case 'mcp_client': return '🌐'
    default: return '⚙️'
  }
}

function toggleAgentStatus(agent: Agent) {
  const newStatus = agent.status === 'active' ? 'idle' : 'active'
  agentStore.updateAgent(agent.id, { status: newStatus })
}

function previewTemplate(template: any) {
  // TODO: Implement template preview modal
  console.log('Preview template:', template)
}



function getTemplateIcon(templateId: string): string {
  switch (templateId) {
    case 'template-dev': return '👩‍💻'
    case 'template-research': return '🔬'
    case 'template-collab': return '🤝'
    default: return '🤖'
  }
}

function getTemplateVariant(type: string) {
  switch (type) {
    case 'autonomous': return 'primary'
    case 'reactive': return 'warning'
    case 'collaborative': return 'secondary'
    default: return 'gray'
  }
}

function formatCapability(capability: string): string {
  return capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatStrategy(strategy: string): string {
  return strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function editAgent(agent: Agent) {
  editingAgent.value = agent
  agentForm.name = agent.name
  agentForm.description = agent.description
  agentForm.type = agent.type
  agentForm.status = agent.status
  agentForm.autonomyLevel = agent.config.autonomyLevel
  agentForm.promptingStrategy = agent.config.promptingStrategy
  agentForm.selectedCapabilities = agent.capabilities.filter(c => c.enabled).map(c => c.type)
  showCreateDialog.value = true
}

function saveAgent() {
  const capabilities: AgentCapability[] = agentForm.selectedCapabilities.map(type => {
    const capabilityInfo = availableCapabilities.find(cap => cap.type === type)
    return {
      type: type as AgentCapability['type'],
      description: capabilityInfo?.description || '',
      enabled: true
    }
  })

  const config = {
    autonomyLevel: agentForm.autonomyLevel,
    promptingStrategy: agentForm.promptingStrategy,
    mcpEndpoints: [],
    storageAccess: true,
    collaboration: {
      canCreateProjects: agentForm.autonomyLevel !== 'low',
      canModifyOtherAgentWork: agentForm.type === 'collaborative',
      requiresApproval: agentForm.autonomyLevel === 'low',
    },
  }

  if (editingAgent.value) {
    agentStore.updateAgent(editingAgent.value.id, {
      name: agentForm.name,
      description: agentForm.description,
      type: agentForm.type,
      status: agentForm.status,
      capabilities,
      config,
    })
  } else {
    agentStore.createAgent({
      name: agentForm.name,
      description: agentForm.description,
      type: agentForm.type,
      status: agentForm.status,
      capabilities,
      config,
      projects: [],
    })
  }
  
  closeDialog()
}

function deleteAgent(id: string) {
  if (confirm('Are you sure you want to delete this agent?')) {
    agentStore.deleteAgent(id)
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingAgent.value = null
  agentForm.name = ''
  agentForm.description = ''
  agentForm.type = 'autonomous'
  agentForm.status = 'active'
  agentForm.autonomyLevel = 'medium'
  agentForm.promptingStrategy = 'goal_oriented'
  agentForm.selectedCapabilities = []
}

// Agent templates
const agentTemplates = [
  {
    id: 'template-dev',
    name: 'Developer Agent',
    description: 'Writes code, fixes bugs, and implements features.',
    type: 'autonomous',
    status: 'active',
    capabilities: [
      { type: 'code_generation', description: 'Generate code', enabled: true },
      { type: 'ai_generation', description: 'Use OpenAI', enabled: true }
    ],
    config: {
      autonomyLevel: 'high',
      promptingStrategy: 'goal_oriented',
      mcpEndpoints: [],
      storageAccess: true,
      collaboration: {
        canCreateProjects: true,
        canModifyOtherAgentWork: false,
        requiresApproval: false
      }
    },
    projects: [],
    runInterval: 60
  },
  {
    id: 'template-research',
    name: 'Research Agent',
    description: 'Finds information, analyzes data, and summarizes findings.',
    type: 'autonomous',
    status: 'active',
    capabilities: [
      { type: 'analysis', description: 'Analyze data', enabled: true },
      { type: 'ai_generation', description: 'Use OpenAI', enabled: true }
    ],
    config: {
      autonomyLevel: 'medium',
      promptingStrategy: 'exploratory',
      mcpEndpoints: [],
      storageAccess: false,
      collaboration: {
        canCreateProjects: false,
        canModifyOtherAgentWork: false,
        requiresApproval: true
      }
    },
    projects: [],
    runInterval: 120
  },
  {
    id: 'template-collab',
    name: 'Collaborator Agent',
    description: 'Works with other agents, reviews work, and manages tasks.',
    type: 'collaborative',
    status: 'active',
    capabilities: [
      { type: 'content_creation', description: 'Create content', enabled: true },
      { type: 'file_management', description: 'Manage files', enabled: true }
    ],
    config: {
      autonomyLevel: 'low',
      promptingStrategy: 'task_driven',
      mcpEndpoints: [],
      storageAccess: true,
      collaboration: {
        canCreateProjects: true,
        canModifyOtherAgentWork: true,
        requiresApproval: true
      }
    },
    projects: [],
    runInterval: 180
  }
]

function selectTemplate(template: any) {
  agentStore.createAgent({
    ...template,
    name: template.name,
    description: template.description,
    type: template.type,
    status: template.status,
    capabilities: template.capabilities,
    config: template.config,
    projects: [],
    runInterval: template.runInterval
  })
}

async function generateAgent() {
  isGenerating.value = true
  aiAgentResult.value = 'Generating...'
  try {
    const response = await agentStore.generateAutonomousPrompt({
      id: 'ai-agent-gen-' + Date.now(),
      name: 'AI Agent Generator',
      config: {
        autonomyLevel: 'high',
        promptingStrategy: 'goal_oriented',
        mcpEndpoints: [],
        storageAccess: true,
        collaboration: {
          canCreateProjects: true,
          canModifyOtherAgentWork: false,
          requiresApproval: false
        }
      },
      capabilities: [{ type: 'ai_generation', description: 'Use OpenAI', enabled: true }],
      type: 'autonomous',
      status: 'active',
      projects: [],
      lastActivity: new Date(),
      createdAt: new Date(),
      description: agentPrompt.value,
      runInterval: 60
    })
    aiAgentResult.value = response.content
  } catch (error) {
    aiAgentResult.value = 'Failed to generate agent: ' + error
  } finally {
    isGenerating.value = false
  }
}

function addGeneratedAgent() {
  try {
    const agentData = JSON.parse(aiAgentResult.value)
    agentStore.createAgent(agentData)
    showAIGenerator.value = false
    aiAgentResult.value = ''
    agentPrompt.value = ''
  } catch (error) {
    alert('Failed to parse agent config. Please check the AI output.')
  }
}
</script>

<style scoped>
.agent-manager {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

.header-navigation {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.back-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.back-icon {
  font-size: var(--font-size-lg);
}

.breadcrumb {
  flex: 1;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumb-link {
  color: var(--color-gray-600);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-separator {
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
}

.breadcrumb-current {
  color: var(--color-gray-800);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.header-title-section {
  text-align: center;
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.title-icon {
  font-size: var(--font-size-2xl);
}

.page-description {
  margin: var(--spacing-sm) 0 0 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.primary-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
}

.action-icon {
  font-size: var(--font-size-lg);
}

.agent-content {
  margin-bottom: var(--spacing-xl);
}

.agents-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  width: 100%;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.section-title h2 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.section-filters {
  display: flex;
  gap: var(--spacing-md);
}

.filter-select {
  min-width: 150px;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--spacing-xl);
}

.agent-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.agent-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.15));
}

.agent-card--featured {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.agent-card--featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-success) 0%, var(--color-success-dark) 100%);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.agent-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  position: relative;
}

.agent-avatar--autonomous {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.agent-avatar--reactive {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.agent-avatar--collaborative {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.avatar-emoji {
  font-size: var(--font-size-xl);
}

.agent-name-section {
  flex: 1;
}

.agent-name {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
}

.agent-type {
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.agent-status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.status-badge--active .status-indicator {
  background: var(--color-success);
}

.status-badge--idle .status-indicator {
  background: var(--color-warning);
}

.status-badge--busy .status-indicator {
  background: var(--color-primary);
}

.status-badge--error .status-indicator,
.status-badge--offline .status-indicator {
  background: var(--color-danger);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.agent-content-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.agent-description {
  color: var(--color-gray-600);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.agent-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-gray-50);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-gray-200);
}

.metric-icon {
  font-size: var(--font-size-base);
  opacity: 0.8;
}

.metric-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.metric-value {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
  font-weight: var(--font-weight-semibold);
  truncate: true;
}

.capabilities-section {
  border-top: 1px solid var(--color-gray-200);
  padding-top: var(--spacing-lg);
}

.capabilities-title {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.capability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.capability-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.capability-badge--more {
  font-style: italic;
  opacity: 0.8;
}

.capability-icon {
  font-size: var(--font-size-sm);
}

.agent-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
  margin-top: var(--spacing-lg);
}

.action-group {
  display: flex;
  gap: var(--spacing-sm);
}

.action-group--primary {
  flex: 1;
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.action-button--danger:hover {
  transform: scale(1.05);
}

.no-agents {
  text-align: center;
  color: var(--color-gray-600);
  padding: var(--spacing-5xl);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-lg);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-5xl) var(--spacing-xl);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  border-radius: var(--border-radius-2xl);
  border: 2px dashed var(--color-gray-300);
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.05), transparent);
  animation: shimmer 3s infinite linear;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.empty-state-content {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.empty-state-visual {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.empty-state-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.9;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 3px solid var(--color-primary-light);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 4s linear infinite;
  opacity: 0.3;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.empty-state-text {
  margin-bottom: var(--spacing-2xl);
}

.empty-state-title {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state-description {
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  margin: 0;
  max-width: 500px;
  margin: 0 auto;
}

.empty-state-actions {
  margin-bottom: var(--spacing-2xl);
}

.empty-state-hint {
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  font-style: italic;
}

.hint-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color 0.2s ease;
}

.hint-link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.empty-state-features {
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-gray-200);
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.feature-text {
  color: var(--color-gray-700);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.agent-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--color-gray-200);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.form-field {
  width: 100%;
}

.form-field-full {
  grid-column: 1 / -1;
  width: 100%;
  margin-bottom: var(--spacing-lg);
}

.capabilities-hint {
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.capability-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.capability-checkbox:hover {
  border-color: var(--color-primary);
  background: rgba(102, 126, 234, 0.02);
}

.capability-checkbox input[type="checkbox"] {
  margin: 0;
}

.capability-checkbox input[type="checkbox"]:checked + .capability-info {
  color: var(--color-primary);
}

.capability-checkbox:has(input:checked) {
  border-color: var(--color-primary);
  background: rgba(102, 126, 234, 0.05);
}

.capability-info {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex: 1;
}

.capability-icon {
  font-size: var(--font-size-xl);
  line-height: 1;
}

.capability-details {
  flex: 1;
}

.capability-details strong {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-gray-800);
  font-weight: var(--font-weight-medium);
}

.capability-details small {
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.agent-templates {
  margin-top: var(--spacing-xl);
}

.templates-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  width: 100%;
}

.templates-title-section {
  flex: 1;
}

.templates-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.templates-subtitle {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}

.templates-actions {
  display: flex;
  gap: var(--spacing-md);
}

.ai-generator-quick-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl, 0 15px 50px rgba(0, 0, 0, 0.12));
}

.template-card--autonomous {
  border-color: rgba(102, 126, 234, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.template-card--reactive {
  border-color: rgba(240, 147, 251, 0.2);
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.02) 0%, rgba(245, 87, 108, 0.02) 100%);
}

.template-card--collaborative {
  border-color: rgba(79, 172, 254, 0.2);
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.02) 0%, rgba(0, 242, 254, 0.02) 100%);
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.template-card:hover::before {
  opacity: 1;
}

.template-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.template-icon-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.template-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  border-radius: var(--border-radius-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
}

.template-icon--autonomous {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.template-icon--reactive {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.template-icon--collaborative {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.template-card:hover .template-icon {
  transform: scale(1.1) rotate(5deg);
}

.template-type-badge {
  margin-top: var(--spacing-xs);
}

.template-title-section {
  flex: 1;
  min-width: 0;
}

.template-name {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

.template-stats {
  display: flex;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  font-weight: var(--font-weight-medium);
}

.stat-icon {
  font-size: var(--font-size-base);
  opacity: 0.8;
}

.template-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.template-description {
  color: var(--color-gray-600);
  line-height: var(--line-height-relaxed);
  margin: 0;
  font-size: var(--font-size-base);
}

.template-capabilities {
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-200);
}

.template-capabilities .capabilities-title {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.template-config-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-gray-50);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-gray-200);
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.config-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.config-value {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
  font-weight: var(--font-weight-semibold);
}

.template-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
  margin-top: var(--spacing-lg);
}

.template-select-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
}

.template-preview-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.ai-generator-section {
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-2xl);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-radius: var(--border-radius-xl);
  border: 2px solid rgba(34, 197, 94, 0.1);
  text-align: center;
}

.ai-generator-info {
  margin-bottom: var(--spacing-xl);
}

.ai-generator-info h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.ai-generator-info p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.template-btn {
  flex: 1;
  min-width: 200px;
}

.ai-generator-btn {
  width: 100%;
}

.generated-result {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-gray-50);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-gray-200);
}

.generated-result h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
}

.generated-result pre {
  background: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-gray-200);
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  max-height: 300px;
  overflow-y: auto;
}

/* Responsive improvements */
@media (max-width: 1024px) {
  .template-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
  
  .agents-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .agent-manager {
    padding: var(--spacing-md);
  }

  .header-content {
    gap: var(--spacing-md);
  }
  
  .header-navigation {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .breadcrumb {
    order: 2;
  }
  
  .header-title-section {
    text-align: left;
    order: 1;
  }
  
  .page-title {
    font-size: var(--font-size-2xl);
    justify-content: flex-start;
  }
  
  .header-actions {
    order: 3;
    justify-content: flex-start;
    width: 100%;
  }
  
  .agents-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .section-filters {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .agent-metrics {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .agent-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .action-group {
    width: 100%;
    justify-content: center;
  }
  
  .action-group--primary {
    order: 1;
  }
  
  .action-group--secondary {
    order: 2;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .template-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .template-icon-section {
    order: 1;
  }
  
  .template-title-section {
    order: 2;
    text-align: center;
  }
  
  .template-stats {
    justify-content: center;
  }
  
  .template-config-preview {
    grid-template-columns: 1fr;
  }
  
  .template-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .template-preview-btn {
    width: 100%;
    justify-content: center;
  }
  
  .templates-header {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .templates-title-section {
    text-align: left;
  }
  
  .templates-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .capabilities-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .empty-state {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }
  
  .empty-state-icon {
    font-size: 4rem;
  }
  
  .empty-state-title {
    font-size: var(--font-size-2xl);
  }
  
  .feature-list {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .agent-manager {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: var(--font-size-xl);
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .title-icon {
    font-size: var(--font-size-xl);
  }
  
  .breadcrumb-list {
    flex-wrap: wrap;
  }
  
  .agent-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  
  .agent-title-section {
    width: 100%;
  }
  
  .agent-status-section {
    align-items: flex-start;
    width: 100%;
  }
  
  .capability-checkbox {
    padding: var(--spacing-md);
  }
  
  .modal-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .modal-footer button {
    width: 100%;
  }
  
  .empty-state-title {
    font-size: var(--font-size-xl);
  }
  
  .empty-state-description {
    font-size: var(--font-size-base);
  }
  
  .feature-item {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .metric-item {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }
  
  .stat-item {
    justify-content: center;
  }
}
</style>