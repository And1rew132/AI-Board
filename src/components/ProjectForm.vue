<template>
  <form @submit.prevent="handleSubmit" class="project-form">
    <div class="form-sections">
      <!-- Basic Information Section -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>
        <div class="form-grid">
          <UIInput 
            v-model="form.name"
            label="Project Name *"
            placeholder="Enter project name"
            required
            :error="errors.name"
            @blur="validateField('name')"
          />
          
          <UISelect 
            v-model="form.status"
            label="Status"
            :error="errors.status"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </UISelect>
        </div>

        <UITextarea 
          v-model="form.description"
          label="Description"
          placeholder="Describe your project goals and objectives"
          :rows="4"
          :error="errors.description"
        />
      </div>

      <!-- Storage Configuration Section -->
      <div class="form-section">
        <h3 class="section-title">Storage Configuration</h3>
        <div class="form-grid">
          <UISelect 
            v-model="form.storageProvider"
            label="Storage Provider"
          >
            <option value="local">Local Storage</option>
            <option value="minio">MinIO</option>
            <option value="s3">Amazon S3</option>
            <option value="azure">Azure Blob</option>
            <option value="gcs">Google Cloud Storage</option>
          </UISelect>

          <UIInput 
            v-if="form.storageProvider !== 'local'"
            v-model="form.storageBucket"
            label="Bucket Name"
            placeholder="Enter bucket name"
          />
        </div>

        <div 
          v-if="form.storageProvider !== 'local'"
          class="form-grid"
        >
          <UIInput 
            v-model="form.storageEndpoint"
            label="Endpoint URL"
            placeholder="https://storage.example.com"
            type="url"
          />

          <UIInput 
            v-model="form.storageRegion"
            label="Region"
            placeholder="us-east-1"
          />
        </div>

        <div 
          v-if="form.storageProvider !== 'local'"
          class="form-grid"
        >
          <UIInput 
            v-model="form.storageAccessKey"
            label="Access Key"
            placeholder="Enter access key"
            type="password"
          />

          <UIInput 
            v-model="form.storageSecretKey"
            label="Secret Key"
            placeholder="Enter secret key"
            type="password"
          />
        </div>
      </div>

      <!-- Agent Assignment Section -->
      <div class="form-section">
        <h3 class="section-title">Agent Assignment</h3>
        <div class="agent-selection">
          <div class="available-agents">
            <h4 class="subsection-title">Available Agents</h4>
            <div v-if="availableAgents.length === 0" class="empty-agents">
              <p>No agents available. <router-link to="/agents">Create agents</router-link> first.</p>
            </div>
            <div v-else class="agent-list">
              <div
                v-for="agent in availableAgents"
                :key="agent.id"
                class="agent-item"
                :class="{ 'agent-item--selected': form.agents.includes(agent.id) }"
                @click="toggleAgent(agent.id)"
              >
                <div class="agent-info">
                  <h5 class="agent-name">{{ agent.name }}</h5>
                  <p class="agent-description">{{ agent.description }}</p>
                  <div class="agent-capabilities">
                    <span
                      v-for="capability in agent.capabilities.filter(c => c.enabled).slice(0, 3)"
                      :key="capability.type"
                      class="capability-tag"
                    >
                      {{ formatCapability(capability.type) }}
                    </span>
                    <span
                      v-if="agent.capabilities.filter(c => c.enabled).length > 3"
                      class="capability-tag capability-tag--more"
                    >
                      +{{ agent.capabilities.filter(c => c.enabled).length - 3 }}
                    </span>
                  </div>
                </div>
                <div class="agent-status">
                  <UIBadge :variant="getAgentStatusVariant(agent.status)">
                    {{ agent.status }}
                  </UIBadge>
                  <button
                    type="button"
                    class="agent-toggle"
                    :class="{ 'agent-toggle--selected': form.agents.includes(agent.id) }"
                    @click.stop="toggleAgent(agent.id)"
                  >
                    {{ form.agents.includes(agent.id) ? '✓' : '+' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="form.agents.length > 0" class="selected-agents">
            <h4 class="subsection-title">Selected Agents ({{ form.agents.length }})</h4>
            <div class="selected-agent-list">
              <div
                v-for="agentId in form.agents"
                :key="agentId"
                class="selected-agent"
              >
                <span class="selected-agent-name">
                  {{ getAgentName(agentId) }}
                </span>
                <button
                  type="button"
                  @click="removeAgent(agentId)"
                  class="remove-agent"
                  aria-label="Remove agent"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <UIButton 
        @click="$emit('cancel')" 
        variant="secondary"
        type="button"
      >
        Cancel
      </UIButton>
      <UIButton 
        type="submit"
        :loading="isSubmitting"
        :disabled="!isFormValid"
      >
        {{ project ? 'Update Project' : 'Create Project' }}
      </UIButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAgentStore } from '@/stores/agents'
import { UIInput, UITextarea, UISelect, UIButton, UIBadge } from '@/ui'
import type { Project, Agent } from '@/types'

interface Props {
  project?: Project | null
}

interface Emits {
  (e: 'save', projectData: Partial<Project>): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const agentStore = useAgentStore()

// State
const isSubmitting = ref(false)
const form = reactive({
  name: '',
  description: '',
  status: 'active' as Project['status'],
  agents: [] as string[],
  storageProvider: 'local' as 'local' | 'minio' | 's3' | 'azure' | 'gcs',
  storageBucket: '',
  storageEndpoint: '',
  storageRegion: '',
  storageAccessKey: '',
  storageSecretKey: ''
})

const errors = reactive({
  name: '',
  description: '',
  status: ''
})

// Computed
const availableAgents = computed(() => agentStore.agents)

const isFormValid = computed(() => {
  return form.name.trim().length > 0 && 
         !Object.values(errors).some(error => error)
})

// Methods
function validateField(field: keyof typeof errors) {
  switch (field) {
    case 'name':
      errors.name = form.name.trim().length === 0 ? 'Project name is required' : ''
      break
    case 'description':
      errors.description = ''
      break
    case 'status':
      errors.status = ''
      break
  }
}

function validateForm() {
  validateField('name')
  validateField('description')
  validateField('status')
  return isFormValid.value
}

function toggleAgent(agentId: string) {
  const index = form.agents.indexOf(agentId)
  if (index > -1) {
    form.agents.splice(index, 1)
  } else {
    form.agents.push(agentId)
  }
}

function removeAgent(agentId: string) {
  const index = form.agents.indexOf(agentId)
  if (index > -1) {
    form.agents.splice(index, 1)
  }
}

function getAgentName(agentId: string): string {
  const agent = availableAgents.value.find(a => a.id === agentId)
  return agent?.name || 'Unknown Agent'
}

function getAgentStatusVariant(status: Agent['status']) {
  switch (status) {
    case 'active': return 'success'
    case 'idle': return 'gray'
    case 'busy': return 'warning'
    case 'error': return 'danger'
    case 'offline': return 'gray'
    default: return 'gray'
  }
}

function formatCapability(capability: string): string {
  return capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const projectData: Partial<Project> = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      agents: [...form.agents]
    }

    // Add storage configuration if not local
    if (form.storageProvider !== 'local') {
      projectData.storageConfig = {
        provider: form.storageProvider,
        bucket: form.storageBucket,
        endpoint: form.storageEndpoint || undefined,
        credentials: {
          accessKey: form.storageAccessKey,
          secretKey: form.storageSecretKey,
          region: form.storageRegion || undefined
        }
      }
    }

    emit('save', projectData)
  } catch (error) {
    console.error('Error saving project:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form when project prop changes
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      form.name = newProject.name
      form.description = newProject.description
      form.status = newProject.status
      form.agents = [...newProject.agents]
      
      if (newProject.storageConfig) {
        form.storageProvider = newProject.storageConfig.provider
        form.storageBucket = newProject.storageConfig.bucket
        form.storageEndpoint = newProject.storageConfig.endpoint || ''
        form.storageRegion = newProject.storageConfig.credentials.region || ''
        form.storageAccessKey = newProject.storageConfig.credentials.accessKey
        form.storageSecretKey = newProject.storageConfig.credentials.secretKey
      }
    } else {
      // Reset form for new project
      form.name = ''
      form.description = ''
      form.status = 'active'
      form.agents = []
      form.storageProvider = 'local'
      form.storageBucket = ''
      form.storageEndpoint = ''
      form.storageRegion = ''
      form.storageAccessKey = ''
      form.storageSecretKey = ''
    }
    
    // Clear errors
    Object.keys(errors).forEach(key => {
      errors[key as keyof typeof errors] = ''
    })
  },
  { immediate: true }
)

onMounted(() => {
  // Focus on the name field when the form opens
  setTimeout(() => {
    const nameInput = document.querySelector('input[placeholder="Enter project name"]') as HTMLInputElement
    nameInput?.focus()
  }, 100)
})
</script>

<style scoped>
.project-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form-section {
  padding: var(--spacing-lg);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-lg);
  background: var(--color-gray-50);
}

.section-title {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--color-gray-200);
  padding-bottom: var(--spacing-sm);
}

.subsection-title {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.form-grid:last-child {
  margin-bottom: 0;
}

.agent-selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.available-agents {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
}

.empty-agents {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-gray-500);
}

.empty-agents a {
  color: var(--color-primary);
  text-decoration: none;
}

.empty-agents a:hover {
  text-decoration: underline;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 300px;
  overflow-y: auto;
}

.agent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-white);
}

.agent-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.agent-item--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.agent-description {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-capabilities {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.capability-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.capability-tag--more {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

.agent-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.agent-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-gray-300);
  border-radius: 50%;
  background: var(--color-white);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  transition: all 0.2s ease;
  color: var(--color-gray-400);
}

.agent-toggle:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.agent-toggle--selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-white);
}

.selected-agents {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
}

.selected-agent-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.selected-agent {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-primary-300);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
}

.selected-agent-name {
  color: var(--color-gray-800);
  font-weight: var(--font-weight-medium);
}

.remove-agent {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--color-red-100);
  color: var(--color-red-600);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transition: all 0.2s ease;
}

.remove-agent:hover {
  background: var(--color-red-200);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-gray-200);
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .agent-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .agent-status {
    flex-direction: row;
    justify-content: space-between;
  }

  .selected-agent-list {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}

@media (max-width: 480px) {
  .project-form {
    max-width: none;
  }

  .form-section {
    padding: var(--spacing-md);
  }

  .agent-list {
    max-height: 200px;
  }
}
</style>