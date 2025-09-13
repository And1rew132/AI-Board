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

      <p v-if="agentStore.agents.length === 0" class="no-agents">
        No agents created yet. Create your first agent to get started!
      </p>
    </UICard>

    <!-- Create/Edit Agent Dialog -->
    <UIModal 
      v-model="showCreateDialog"
      :title="editingAgent ? 'Edit Agent' : 'Create New Agent'"
      size="lg"
    >
      <form @submit.prevent="saveAgent">
        <div class="form-fields">
          <UIInput 
            v-model="agentForm.name"
            label="Name"
            required
          />
          
          <UITextarea 
            v-model="agentForm.description"
            label="Description"
            :rows="3"
          />
          
          <UISelect 
            v-model="agentForm.type"
            label="Type"
          >
            <option value="autonomous">Autonomous</option>
            <option value="reactive">Reactive</option>
            <option value="collaborative">Collaborative</option>
          </UISelect>
          
          <UISelect 
            v-model="agentForm.status"
            label="Status"
          >
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="offline">Offline</option>
          </UISelect>
        </div>
      </form>
      
      <template #footer>
        <UIButton @click="closeDialog" variant="secondary">
          Cancel
        </UIButton>
        <UIButton @click="saveAgent">
          {{ editingAgent ? 'Update' : 'Create' }}
        </UIButton>
      </template>
    </UIModal>

    <!-- Agent Templates & AI Generator -->
    <UICard variant="elevated" class="agent-templates">
      <template #header>
        <h2>Agent Templates</h2>
      </template>
      
      <div class="template-list">
        <UIButton 
          v-for="template in agentTemplates" 
          :key="template.id" 
          @click="selectTemplate(template)" 
          variant="ghost"
          class="template-btn"
        >
          {{ template.name }}
        </UIButton>
      </div>
      
      <UIButton @click="showAIGenerator = true" variant="success" class="ai-generator-btn">
        Generate Agent with OpenAI
      </UIButton>
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
import { ref, reactive } from 'vue'
import { useAgentStore } from '@/stores/agents'
import { UIButton, UICard, UIModal, UIInput, UITextarea, UISelect, UIBadge, UIInfoGrid } from '@/ui'
import type { Agent } from '@/types'

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

function editAgent(agent: Agent) {
  editingAgent.value = agent
  agentForm.name = agent.name
  agentForm.description = agent.description
  agentForm.type = agent.type
  agentForm.status = agent.status
  showCreateDialog.value = true
}

function saveAgent() {
  if (editingAgent.value) {
    agentStore.updateAgent(editingAgent.value.id, {
      name: agentForm.name,
      description: agentForm.description,
      type: agentForm.type,
      status: agentForm.status,
    })
  } else {
    agentStore.createAgent({
      name: agentForm.name,
      description: agentForm.description,
      type: agentForm.type,
      status: agentForm.status,
      capabilities: [
        { type: 'code_generation', description: 'Generate code', enabled: true },
        { type: 'content_creation', description: 'Create content', enabled: true },
        { type: 'file_management', description: 'Manage files', enabled: true },
      ],
      config: {
        autonomyLevel: 'medium',
        promptingStrategy: 'goal_oriented',
        mcpEndpoints: [],
        storageAccess: true,
        collaboration: {
          canCreateProjects: true,
          canModifyOtherAgentWork: false,
          requiresApproval: false,
        },
      },
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

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.agent-templates {
  margin-top: var(--spacing-xl);
}

.agent-templates h2 {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
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
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .agent-actions {
    flex-direction: column;
  }
  
  .template-list {
    flex-direction: column;
  }
  
  .template-btn {
    min-width: auto;
  }
}
</style>