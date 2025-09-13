<template>
  <div class="agent-manager">
    <header class="page-header">
      <button @click="$router.back()" class="back-btn">
        ← Back
      </button>
      <h1>Agent Manager</h1>
      <button @click="showCreateDialog = true" class="btn-primary">
        New Agent
      </button>
    </header>

    <div class="agent-content">
      <div class="agents-grid">
        <div 
          v-for="agent in agentStore.agents" 
          :key="agent.id"
          class="agent-card"
          :class="agent.status"
        >
          <div class="agent-header">
            <h3>{{ agent.name }}</h3>
            <span class="status-indicator" :class="agent.status">
              {{ agent.status }}
            </span>
          </div>
          
          <p class="agent-description">{{ agent.description }}</p>
          
          <div class="agent-details">
            <div class="detail-item">
              <span class="label">Type:</span>
              <span class="value">{{ agent.type }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Projects:</span>
              <span class="value">{{ agent.projects.length }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Last Activity:</span>
              <span class="value">{{ formatDate(agent.lastActivity) }}</span>
            </div>
          </div>
          
          <div class="capabilities">
            <h4>Capabilities:</h4>
            <div class="capability-tags">
              <span 
                v-for="capability in agent.capabilities.filter(c => c.enabled)" 
                :key="capability.type"
                class="capability-tag"
              >
                {{ capability.type.replace('_', ' ') }}
              </span>
            </div>
          </div>
          
          <div class="agent-actions">
            <button @click="editAgent(agent)" class="btn-edit">
              Edit
            </button>
            <button @click="deleteAgent(agent.id)" class="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>

      <p v-if="agentStore.agents.length === 0" class="no-agents">
        No agents created yet. Create your first agent to get started!
      </p>
    </div>

    <!-- Create/Edit Agent Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click="closeDialog">
      <div class="modal" @click.stop>
        <h3>{{ editingAgent ? 'Edit Agent' : 'Create New Agent' }}</h3>
        
        <form @submit.prevent="saveAgent">
          <div class="form-group">
            <label for="agentName">Name:</label>
            <input 
              id="agentName"
              v-model="agentForm.name" 
              type="text" 
              required 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="agentDescription">Description:</label>
            <textarea 
              id="agentDescription"
              v-model="agentForm.description" 
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="agentType">Type:</label>
            <select 
              id="agentType"
              v-model="agentForm.type" 
              class="form-select"
            >
              <option value="autonomous">Autonomous</option>
              <option value="reactive">Reactive</option>
              <option value="collaborative">Collaborative</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="agentStatus">Status:</label>
            <select 
              id="agentStatus"
              v-model="agentForm.status" 
              class="form-select"
            >
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeDialog" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingAgent ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Agent Templates & AI Generator -->
    <section class="agent-templates">
      <h2>Agent Templates</h2>
      <div class="template-list">
        <button v-for="template in agentTemplates" :key="template.id" @click="selectTemplate(template)" class="btn-secondary">
          {{ template.name }}
        </button>
      </div>
      <button class="btn-primary" @click="showAIGenerator = true">Generate Agent with OpenAI</button>
    </section>

    <div v-if="showAIGenerator" class="ai-generator-modal">
      <h3>Generate Agent with OpenAI</h3>
      <form @submit.prevent="generateAgent">
        <label for="agentPrompt">Describe the agent you want:</label>
        <textarea id="agentPrompt" v-model="agentPrompt" rows="4" class="form-textarea"></textarea>
        <button type="submit" class="btn-primary">Generate</button>
        <button type="button" class="btn-secondary" @click="showAIGenerator = false">Cancel</button>
      </form>
      <div v-if="aiAgentResult">
        <h4>Generated Agent:</h4>
        <pre>{{ aiAgentResult }}</pre>
        <button class="btn-primary" @click="addGeneratedAgent">Add Agent</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAgentStore } from '@/stores/agents'
import type { Agent } from '@/types'

const agentStore = useAgentStore()

const showCreateDialog = ref(false)
const editingAgent = ref<Agent | null>(null)

const agentForm = reactive({
  name: '',
  description: '',
  type: 'autonomous' as Agent['type'],
  status: 'active' as Agent['status'],
})

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

const showAIGenerator = ref(false)
const agentPrompt = ref('')
const aiAgentResult = ref('')
let selectedTemplate = ref<any>(null)

function selectTemplate(template: any) {
  selectedTemplate.value = template
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.back-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  color: #667eea;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
}

.agent-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.agent-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 4px solid #ddd;
}

.agent-card.active {
  border-left-color: #28a745;
}

.agent-card.busy {
  border-left-color: #ffc107;
}

.agent-card.idle {
  border-left-color: #6c757d;
}

.agent-card.offline {
  border-left-color: #dc3545;
}

.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.agent-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-indicator.active {
  background: #d4edda;
  color: #155724;
}

.status-indicator.busy {
  background: #fff3cd;
  color: #856404;
}

.status-indicator.idle {
  background: #e2e3e5;
  color: #383d41;
}

.status-indicator.offline {
  background: #f8d7da;
  color: #721c24;
}

.agent-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.agent-details {
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  color: #333;
  font-weight: 600;
}

.capabilities h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.capability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.capability-tag {
  padding: 0.4rem 0.8rem;
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.agent-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.btn-edit, .btn-danger {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.btn-danger {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.btn-edit:hover, .btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-agents {
  text-align: center;
  color: #666;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 15px;
  font-size: 1.1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.agent-templates {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.btn-secondary:hover {
  background: rgba(108, 117, 125, 0.2);
}

.ai-generator-modal {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.ai-generator-modal h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.ai-generator-modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.ai-generator-modal .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.ai-generator-modal .form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.ai-generator-modal .btn-primary {
  width: 100%;
}

.ai-generator-modal .generated-agent {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>