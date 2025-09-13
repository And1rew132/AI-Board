<template>
  <div class="agent-manager">
    <UICard variant="elevated" class="page-header">
      <template #header>
        <div class="header-content">
          <UIButton @click="$router.back()" variant="ghost" size="sm">
            ← Back
          </UIButton>
          <h1>Agent Manager</h1>
          <UIButton @click="showCreateDialog = true">
            New Agent
          </UIButton>
        </div>
      </template>
    </UICard>

    <UICard variant="elevated" class="agent-content">
      <div class="agents-grid">
        <UICard 
          v-for="agent in agentStore.agents" 
          :key="agent.id"
          variant="outlined"
          class="agent-card"
        >
          <template #header>
            <div class="agent-header">
              <h3>{{ agent.name }}</h3>
              <UIBadge :variant="getStatusVariant(agent.status)">
                {{ agent.status }}
              </UIBadge>
            </div>
          </template>
          
          <p class="agent-description">{{ agent.description }}</p>
          
          <UIInfoGrid :items="[
            { label: 'Type', value: agent.type },
            { label: 'Projects', value: agent.projects.length.toString() },
            { label: 'Last Activity', value: formatDate(agent.lastActivity) }
          ]" class="agent-details" />
          
          <div class="capabilities">
            <h4>Capabilities:</h4>
            <div class="capability-tags">
              <UIBadge
                v-for="capability in agent.capabilities.filter(c => c.enabled)" 
                :key="capability.type"
                variant="success"
                size="sm"
              >
                {{ capability.type.replace('_', ' ') }}
              </UIBadge>
            </div>
          </div>
          
          <template #footer>
            <div class="agent-actions">
              <UIButton @click="editAgent(agent)" variant="secondary" size="sm">
                Edit
              </UIButton>
              <UIButton @click="deleteAgent(agent.id)" variant="danger" size="sm">
                Delete
              </UIButton>
            </div>
          </template>
        </UICard>
      </div>

      <div v-if="agentStore.agents.length === 0" class="empty-state">
        <div class="empty-state-content">
          <div class="empty-state-icon">🤖</div>
          <h3>Welcome to Agent Management</h3>
          <p>Create your first AI agent to start automating tasks and workflows.</p>
          <div class="empty-state-actions">
            <UIButton @click="showCreateDialog = true" size="lg">
              Create Your First Agent
            </UIButton>
            <p class="empty-state-hint">
              Or choose from our templates below to get started quickly
            </p>
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
    <UICard variant="elevated" class="agent-templates">
      <template #header>
        <div class="templates-header">
          <h2>Agent Templates</h2>
          <p class="templates-subtitle">Choose a pre-configured template to get started quickly</p>
        </div>
      </template>
      
      <div class="template-grid">
        <UICard 
          v-for="template in agentTemplates" 
          :key="template.id"
          variant="outlined"
          class="template-card"
          @click="selectTemplate(template)"
        >
          <template #header>
            <div class="template-header">
              <div class="template-icon">{{ getTemplateIcon(template.id) }}</div>
              <h3>{{ template.name }}</h3>
              <UIBadge :variant="getTemplateVariant(template.type)" size="sm">
                {{ template.type }}
              </UIBadge>
            </div>
          </template>
          
          <p class="template-description">{{ template.description }}</p>
          
          <div class="template-features">
            <h4>Key Capabilities:</h4>
            <div class="capability-list">
              <UIBadge
                v-for="capability in template.capabilities" 
                :key="capability.type"
                variant="success"
                size="sm"
              >
                {{ formatCapability(capability.type) }}
              </UIBadge>
            </div>
          </div>
          
          <div class="template-config">
            <UIInfoGrid :items="[
              { label: 'Autonomy', value: template.config.autonomyLevel },
              { label: 'Strategy', value: formatStrategy(template.config.promptingStrategy) },
              { label: 'Interval', value: `${template.runInterval}s` }
            ]" />
          </div>
          
          <template #footer>
            <UIButton @click.stop="selectTemplate(template)" class="template-select-btn">
              Create Agent
            </UIButton>
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
import { UIButton, UICard, UIModal, UIInput, UITextarea, UISelect, UIBadge, UIInfoGrid } from '@/ui'
import type { Agent, AgentCapability } from '@/types'

const agentStore = useAgentStore()

const showCreateDialog = ref(false)
const showAIGenerator = ref(false)
const editingAgent = ref<Agent | null>(null)
const agentPrompt = ref('')
const aiAgentResult = ref('')
const isGenerating = ref(false)

const agentForm = reactive({
  name: '',
  description: '',
  type: 'autonomous' as Agent['type'],
  status: 'active' as Agent['status'],
  autonomyLevel: 'medium' as 'low' | 'medium' | 'high',
  promptingStrategy: 'goal_oriented' as 'goal_oriented' | 'task_driven' | 'exploratory',
  selectedCapabilities: [] as AgentCapability['type'][],
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
    case 'offline': return 'danger'
    default: return 'gray'
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  width: 100%;
}

.header-content h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
}

.agent-content {
  margin-bottom: var(--spacing-xl);
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.agent-card {
  transition: all 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-4px);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.agent-header h3 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.agent-description {
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
}

.agent-details {
  margin-bottom: var(--spacing-lg);
}

.capabilities {
  margin-bottom: var(--spacing-lg);
}

.capabilities h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.capability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.agent-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
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
  padding: var(--spacing-5xl);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: var(--border-radius-xl);
  border: 2px dashed var(--color-gray-300);
}

.empty-state-content {
  max-width: 500px;
  margin: 0 auto;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.8;
}

.empty-state h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.empty-state p {
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xl);
  line-height: var(--line-height-relaxed);
}

.empty-state-actions {
  margin-top: var(--spacing-xl);
}

.empty-state-hint {
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  font-style: italic;
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
  text-align: center;
}

.templates-header h2 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.templates-subtitle {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl, 0 10px 40px rgba(0, 0, 0, 0.15));
}

.template-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.template-icon {
  font-size: var(--font-size-2xl);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: var(--border-radius-lg);
  margin-right: var(--spacing-sm);
}

.template-header h3 {
  flex: 1;
  margin: 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.template-description {
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
}

.template-features {
  margin-bottom: var(--spacing-lg);
}

.template-features h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.template-config {
  margin-bottom: var(--spacing-lg);
}

.template-select-btn {
  width: 100%;
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
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .agent-actions {
    flex-direction: column;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .template-btn {
    min-width: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .capabilities-grid {
    grid-template-columns: 1fr;
  }
  
  .template-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .ai-generator-section {
    padding: var(--spacing-xl);
    margin-top: var(--spacing-xl);
  }
  
  .empty-state {
    padding: var(--spacing-2xl);
  }
  
  .empty-state-icon {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .agent-manager {
    padding: var(--spacing-md);
  }
  
  .template-header {
    flex-direction: column;
    text-align: center;
  }
  
  .template-icon {
    margin-right: 0;
    margin-bottom: var(--spacing-sm);
  }
  
  .capability-checkbox {
    padding: var(--spacing-md);
  }
  
  .modal-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>