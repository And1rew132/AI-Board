<template>
  <div class="agent-manager">
    <h2>Agent Manager</h2>
    <div class="agent-templates">
      <h3>Select an Agent Template</h3>
      <div class="template-list">
        <button v-for="template in agentTemplates" :key="template.id" @click="selectTemplate(template)">
          {{ template.name }}
        </button>
      </div>
      <button class="btn-primary" @click="showAIGenerator = true">Generate Agent with OpenAI</button>
    </div>

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

    <div class="agent-list">
      <h3>Agents</h3>
      <div v-for="agent in agents" :key="agent.id" class="agent-card">
        <div class="agent-header">
          <h4>{{ agent.name }}</h4>
          <span class="agent-type">{{ agent.type }}</span>
        </div>
        <p>{{ agent.description }}</p>
        <div class="agent-controls">
          <label>Run every
            <input type="number" v-model.number="agent.runInterval" min="5" max="3600" step="5" style="width: 60px;" />
            seconds
          </label>
          <button class="btn-primary" @click="runAgent(agent)">Run Now</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAgentStore } from '@/stores/agents'

const agentStore = useAgentStore()
// Add runInterval to agent objects if missing
const agents = computed(() => agentStore.agents.map(agent => ({ ...agent, runInterval: agent.runInterval ?? 60 })))

// Predefined agent templates
const agentTemplates = [
  {
    id: 'template-dev',
    name: 'Developer Agent',
    description: 'Writes code, fixes bugs, and implements features.',
    type: 'autonomous',
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
    projects: []
  },
  {
    id: 'template-research',
    name: 'Research Agent',
    description: 'Finds information, analyzes data, and summarizes findings.',
    type: 'autonomous',
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
    projects: []
  },
  {
    id: 'template-collab',
    name: 'Collaborator Agent',
    description: 'Works with other agents, reviews work, and manages tasks.',
    type: 'collaborative',
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
    projects: []
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
    capabilities: template.capabilities,
    config: template.config,
    projects: []
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
  // Parse the AI result and add as agent
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

function runAgent(agent: any) {
  // For now, just log and simulate execution
  alert(`Running agent: ${agent.name}`)
}
</script>

<style scoped>
.agent-manager {
  padding: 2rem;
}
.agent-templates {
  margin-bottom: 2rem;
}
.template-list {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.agent-list {
  margin-top: 2rem;
}
.agent-card {
  background: #f8f8ff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(102,126,234,0.05);
}
.agent-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.agent-type {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}
.agent-controls {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.ai-generator-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(102,126,234,0.15);
  padding: 2rem;
  margin-bottom: 2rem;
}
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 1rem;
}
.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.5rem;
}
.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
