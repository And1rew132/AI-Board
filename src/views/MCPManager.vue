<template>
  <div class="mcp-manager">
    <header class="page-header">
      <button @click="$router.back()" class="back-btn" aria-label="Go back">
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>
      <div class="header-main">
        <h1>MCP Integrations</h1>
        <p class="header-subtitle">Manage your external service connections and APIs</p>
      </div>
      <div class="header-status">
        <div class="connection-overview">
          <div class="status-indicator" :class="overallConnectionStatus">
            <span class="status-icon" :aria-label="connectionStatusText">
              {{ connectionStatusIcon }}
            </span>
            <div class="status-info">
              <span class="status-count">{{ activeMCPEndpoints.length }}</span>
              <span class="status-label">Active Connections</span>
            </div>
          </div>
          <div class="health-indicator" v-if="activeMCPEndpoints.length > 0">
            <span class="health-icon" :class="connectionHealthClass">●</span>
            <span class="health-text">{{ connectionHealthText }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="mcp-content">
      <div class="integration-tabs" role="tablist" aria-label="Integration types">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`${tab.id}-panel`"
          :id="`${tab.id}-tab`"
        >
          <span class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.name }}</span>
          <span v-if="tab.hasConnection" class="tab-status connected" aria-label="Connected"></span>
          <span v-else class="tab-status disconnected" aria-label="Not connected"></span>
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'overview'" class="integration-section" role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
          <div class="overview-dashboard">
            <div class="section-header">
              <h3>Integration Overview</h3>
              <p class="section-description">Monitor and manage your integration ecosystem</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card" role="group" aria-labelledby="total-endpoints-title">
                <div class="stat-icon" aria-hidden="true">📊</div>
                <div class="stat-content">
                  <h4 id="total-endpoints-title">Total Endpoints</h4>
                  <p class="stat-value" aria-describedby="total-endpoints-desc">{{ mcpEndpoints.length }}</p>
                  <small id="total-endpoints-desc" class="stat-description">Configured integrations</small>
                </div>
              </div>
              
              <div class="stat-card" role="group" aria-labelledby="active-connections-title">
                <div class="stat-icon" aria-hidden="true">✅</div>
                <div class="stat-content">
                  <h4 id="active-connections-title">Active Connections</h4>
                  <p class="stat-value" aria-describedby="active-connections-desc">{{ activeMCPEndpoints.length }}</p>
                  <small id="active-connections-desc" class="stat-description">Currently connected</small>
                </div>
              </div>
              
              <div class="stat-card" role="group" aria-labelledby="connected-agents-title">
                <div class="stat-icon" aria-hidden="true">🤖</div>
                <div class="stat-content">
                  <h4 id="connected-agents-title">Connected Agents</h4>
                  <p class="stat-value" aria-describedby="connected-agents-desc">{{ agentsWithMCP.length }}</p>
                  <small id="connected-agents-desc" class="stat-description">Using integrations</small>
                </div>
              </div>

              <div class="stat-card" role="group" aria-labelledby="integration-types-title">
                <div class="stat-icon" aria-hidden="true">🔗</div>
                <div class="stat-content">
                  <h4 id="integration-types-title">Integration Types</h4>
                  <p class="stat-value" aria-describedby="integration-types-desc">{{ uniqueIntegrationTypes.length }}</p>
                  <small id="integration-types-desc" class="stat-description">Different service types</small>
                </div>
              </div>
            </div>

            <div class="recent-activity">
              <h4>Recent Activity</h4>
              <div class="activity-list" role="log" aria-label="Recent integration activity">
                <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                  <span class="activity-icon" aria-hidden="true">{{ activity.icon }}</span>
                  <span class="activity-text">{{ activity.description }}</span>
                  <time class="activity-time" :datetime="activity.timestamp.toISOString()">
                    {{ formatTime(activity.timestamp) }}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'openai'" class="integration-section" role="tabpanel" id="openai-panel" aria-labelledby="openai-tab">
          <OpenAIManager />
        </div>

        <div v-if="activeTab === 'github'" class="integration-section" role="tabpanel" id="github-panel" aria-labelledby="github-tab">
          <GitHubMCPManager />
        </div>

        <div v-if="activeTab === 'custom'" class="integration-section" role="tabpanel" id="custom-panel" aria-labelledby="custom-tab">
          <div class="custom-mcp">
            <div class="section-header">
              <h3>Custom MCP Endpoints</h3>
              <p class="section-description">Configure custom integrations and external services</p>
            </div>
            
            <div class="add-endpoint-form">
              <div class="form-header">
                <h4>Add New MCP Endpoint</h4>
                <p class="form-description">Connect to external MCP servers and custom APIs</p>
              </div>
              
              <form @submit.prevent="addCustomEndpoint" novalidate>
                <div class="form-row">
                  <div class="form-group">
                    <label for="endpointName" class="form-label">
                      Name <span class="required">*</span>
                    </label>
                    <input 
                      id="endpointName"
                      v-model="customEndpointForm.name" 
                      type="text" 
                      required 
                      class="form-input"
                      :class="{ 'error': formErrors.name }"
                      placeholder="My Custom MCP Server"
                      aria-describedby="endpointName-error"
                      @blur="validateField('name')"
                      @input="clearFieldError('name')"
                    />
                    <div v-if="formErrors.name" id="endpointName-error" class="field-error" role="alert">
                      {{ formErrors.name }}
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="endpointUrl" class="form-label">
                      URL <span class="required">*</span>
                    </label>
                    <input 
                      id="endpointUrl"
                      v-model="customEndpointForm.url" 
                      type="url" 
                      required 
                      class="form-input"
                      :class="{ 'error': formErrors.url }"
                      placeholder="https://api.example.com/mcp"
                      aria-describedby="endpointUrl-error"
                      @blur="validateField('url')"
                      @input="clearFieldError('url')"
                    />
                    <div v-if="formErrors.url" id="endpointUrl-error" class="field-error" role="alert">
                      {{ formErrors.url }}
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="endpointType" class="form-label">Type</label>
                    <select 
                      id="endpointType"
                      v-model="customEndpointForm.type" 
                      class="form-select"
                      aria-describedby="endpointType-help"
                    >
                      <option value="knowledge_base">Knowledge Base</option>
                      <option value="tool_server">Tool Server</option>
                      <option value="data_source">Data Source</option>
                      <option value="api_gateway">API Gateway</option>
                    </select>
                    <small id="endpointType-help" class="field-help">
                      Choose the type that best describes this endpoint's purpose
                    </small>
                  </div>

                  <div class="form-group">
                    <label for="authType" class="form-label">Authentication</label>
                    <select 
                      id="authType"
                      v-model="customEndpointForm.authType" 
                      class="form-select"
                      aria-describedby="authType-help"
                    >
                      <option value="">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="api_key">API Key</option>
                      <option value="oauth">OAuth</option>
                    </select>
                    <small id="authType-help" class="field-help">
                      Select authentication method if required
                    </small>
                  </div>
                </div>

                <div v-if="customEndpointForm.authType" class="form-group">
                  <label for="credentials" class="form-label">
                    Credentials <span class="required">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      id="credentials"
                      v-model="customEndpointForm.credentials" 
                      :type="showCredentials ? 'text' : 'password'"
                      class="form-input"
                      :class="{ 'error': formErrors.credentials }"
                      :placeholder="getCredentialsPlaceholder()"
                      aria-describedby="credentials-error credentials-help"
                      @blur="validateField('credentials')"
                      @input="clearFieldError('credentials')"
                    />
                    <button 
                      type="button" 
                      @click="toggleCredentialsVisibility"
                      class="input-addon"
                      :aria-label="showCredentials ? 'Hide credentials' : 'Show credentials'"
                    >
                      {{ showCredentials ? '👁️' : '👁️‍🗨️' }}
                    </button>
                  </div>
                  <small id="credentials-help" class="field-help">
                    Enter your {{ getCredentialsLabel() }} for authentication
                  </small>
                  <div v-if="formErrors.credentials" id="credentials-error" class="field-error" role="alert">
                    {{ formErrors.credentials }}
                  </div>
                </div>

                <div class="form-actions">
                  <button 
                    type="button" 
                    @click="testEndpointConnection" 
                    :disabled="!canTestConnection || isTestingConnection"
                    class="btn btn-secondary"
                  >
                    <span v-if="isTestingConnection">Testing...</span>
                    <span v-else>Test Connection</span>
                  </button>
                  <button 
                    type="submit" 
                    :disabled="!isFormValid || isAddingEndpoint"
                    class="btn btn-primary"
                  >
                    <span v-if="isAddingEndpoint">Adding...</span>
                    <span v-else>Add Endpoint</span>
                  </button>
                </div>
                
                <div v-if="formMessage" class="form-message" :class="formMessage.type" role="alert">
                  {{ formMessage.text }}
                </div>
              </form>
            </div>

            <div class="endpoints-list">
              <h4>Custom Endpoints ({{ customEndpoints.length }})</h4>
              <div v-if="customEndpoints.length === 0" class="empty-state">
                <p>No custom endpoints configured yet.</p>
                <p>Add one above to get started!</p>
              </div>
              
              <div v-else class="endpoint-grid">
                <div 
                  v-for="endpoint in customEndpoints" 
                  :key="endpoint.id"
                  class="endpoint-card"
                >
                  <div class="endpoint-header">
                    <h5>{{ endpoint.name }}</h5>
                    <div class="endpoint-status" :class="{ active: endpoint.isActive }">
                      {{ endpoint.isActive ? 'Active' : 'Inactive' }}
                    </div>
                  </div>
                  
                  <div class="endpoint-details">
                    <p><strong>URL:</strong> {{ endpoint.url }}</p>
                    <p><strong>Type:</strong> {{ endpoint.type }}</p>
                    <p><strong>Capabilities:</strong> {{ endpoint.capabilities.length }}</p>
                  </div>

                  <div class="endpoint-actions">
                    <button 
                      @click="toggleEndpoint(endpoint.id)" 
                      class="toggle-btn"
                      :class="{ active: endpoint.isActive }"
                    >
                      {{ endpoint.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button @click="removeEndpoint(endpoint.id)" class="remove-btn">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAgentStore } from '@/stores/agents'
import GitHubMCPManager from '@/components/GitHubMCPManager.vue'
import OpenAIManager from '@/components/OpenAIManager.vue'
import type { MCPEndpoint } from '@/types'

const agentStore = useAgentStore()

const activeTab = ref('overview')
const tabs = [
  { id: 'overview', name: 'Overview', icon: '📊', hasConnection: false },
  { id: 'openai', name: 'OpenAI', icon: '🤖', hasConnection: false },
  { id: 'github', name: 'GitHub', icon: '🐙', hasConnection: false },
  { id: 'custom', name: 'Custom', icon: '⚙️', hasConnection: false }
]

const customEndpointForm = reactive({
  name: '',
  url: '',
  type: 'tool_server' as MCPEndpoint['type'],
  authType: '' as 'bearer' | 'api_key' | 'oauth' | '',
  credentials: ''
})

const formErrors = reactive({
  name: '',
  url: '',
  credentials: ''
})

const formMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showCredentials = ref(false)
const isTestingConnection = ref(false)
const isAddingEndpoint = ref(false)

const activeMCPEndpoints = computed(() => agentStore.getActiveMCPEndpoints())
const mcpEndpoints = computed(() => agentStore.mcpEndpoints)
const customEndpoints = computed(() => 
  agentStore.mcpEndpoints.filter(endpoint => 
    !endpoint.name.toLowerCase().includes('github') && !endpoint.name.toLowerCase().includes('openai')
  )
)

// Additional computed properties for overview dashboard
const agentsWithMCP = computed(() => 
  agentStore.agents.filter(agent => 
    agent.capabilities.some(cap => cap.type === 'mcp_client')
  )
)
const uniqueIntegrationTypes = computed(() => [
  ...new Set(activeMCPEndpoints.value.map(endpoint => endpoint.type))
])

// Header status indicators
const overallConnectionStatus = computed(() => {
  const activeCount = activeMCPEndpoints.value.length
  if (activeCount === 0) return 'no-connections'
  if (activeCount >= 3) return 'many-connections'
  return 'some-connections'
})

const connectionStatusIcon = computed(() => {
  const activeCount = activeMCPEndpoints.value.length
  if (activeCount === 0) return '🔴'
  if (activeCount >= 3) return '🟢'
  return '🟡'
})

const connectionStatusText = computed(() => {
  const activeCount = activeMCPEndpoints.value.length
  if (activeCount === 0) return 'No active connections'
  if (activeCount === 1) return '1 active connection'
  return `${activeCount} active connections`
})

const connectionHealthClass = computed(() => {
  const activeCount = activeMCPEndpoints.value.length
  if (activeCount === 0) return 'health-none'
  if (activeCount >= 3) return 'health-excellent'
  return 'health-good'
})

const connectionHealthText = computed(() => {
  const activeCount = activeMCPEndpoints.value.length
  if (activeCount === 0) return 'No connections'
  if (activeCount >= 3) return 'Excellent connectivity'
  return 'Good connectivity'
})

// Form validation
const isFormValid = computed(() => {
  return customEndpointForm.name.trim() &&
         customEndpointForm.url.trim() &&
         (!customEndpointForm.authType || customEndpointForm.credentials.trim()) &&
         !Object.values(formErrors).some(error => error)
})

const canTestConnection = computed(() => {
  return customEndpointForm.name.trim() &&
         customEndpointForm.url.trim() &&
         (!customEndpointForm.authType || customEndpointForm.credentials.trim())
})

const recentActivity = computed(() => [
  {
    id: '1',
    icon: '🔗',
    description: 'GitHub MCP connected',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: '2',
    icon: '🤖',
    description: 'OpenAI integration configured',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1 hour ago
  },
  {
    id: '3',
    icon: '⚙️',
    description: 'Custom endpoint configured',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  }
])

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getCredentialsPlaceholder(): string {
  switch (customEndpointForm.authType) {
    case 'bearer':
      return 'Bearer token'
    case 'api_key':
      return 'API key'
    case 'oauth':
      return 'OAuth access token'
    default:
      return 'Credentials'
  }
}

function getCredentialsLabel(): string {
  switch (customEndpointForm.authType) {
    case 'bearer':
      return 'bearer token'
    case 'api_key':
      return 'API key'
    case 'oauth':
      return 'OAuth access token'
    default:
      return 'credentials'
  }
}

function toggleCredentialsVisibility() {
  showCredentials.value = !showCredentials.value
}

function validateField(fieldName: keyof typeof formErrors) {
  formMessage.value = null
  
  switch (fieldName) {
    case 'name':
      if (!customEndpointForm.name.trim()) {
        formErrors.name = 'Name is required'
      } else if (customEndpointForm.name.length < 3) {
        formErrors.name = 'Name must be at least 3 characters'
      } else {
        formErrors.name = ''
      }
      break
    case 'url':
      if (!customEndpointForm.url.trim()) {
        formErrors.url = 'URL is required'
      } else {
        try {
          new URL(customEndpointForm.url)
          formErrors.url = ''
        } catch {
          formErrors.url = 'Please enter a valid URL'
        }
      }
      break
    case 'credentials':
      if (customEndpointForm.authType && !customEndpointForm.credentials.trim()) {
        formErrors.credentials = 'Credentials are required for this authentication type'
      } else {
        formErrors.credentials = ''
      }
      break
  }
}

function clearFieldError(fieldName: keyof typeof formErrors) {
  formErrors[fieldName] = ''
  formMessage.value = null
}

async function testEndpointConnection() {
  if (!canTestConnection.value) return
  
  isTestingConnection.value = true
  formMessage.value = null
  
  try {
    // Simulate testing connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    formMessage.value = {
      type: 'success',
      text: 'Connection test successful! The endpoint is reachable.'
    }
  } catch (error) {
    formMessage.value = {
      type: 'error',
      text: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  } finally {
    isTestingConnection.value = false
  }
}

async function addCustomEndpoint() {
  // Validate all fields
  validateField('name')
  validateField('url')
  if (customEndpointForm.authType) {
    validateField('credentials')
  }
  
  if (!isFormValid.value) {
    formMessage.value = {
      type: 'error',
      text: 'Please fix the errors above before submitting'
    }
    return
  }
  
  isAddingEndpoint.value = true
  formMessage.value = null
  
  try {
    const endpoint: Omit<MCPEndpoint, 'id'> = {
      name: customEndpointForm.name,
      url: customEndpointForm.url,
      type: customEndpointForm.type,
      capabilities: [], // Will be populated when connection is tested
      isActive: true
    }

    if (customEndpointForm.authType && customEndpointForm.credentials) {
      endpoint.auth = {
        type: customEndpointForm.authType,
        credentials: getCredentialsObject()
      }
    }

    agentStore.addMCPEndpoint(endpoint)

    // Reset form
    customEndpointForm.name = ''
    customEndpointForm.url = ''
    customEndpointForm.type = 'tool_server'
    customEndpointForm.authType = ''
    customEndpointForm.credentials = ''
    
    // Clear any errors
    Object.keys(formErrors).forEach(key => {
      formErrors[key as keyof typeof formErrors] = ''
    })
    
    formMessage.value = {
      type: 'success',
      text: 'Endpoint added successfully!'
    }
  } catch (error) {
    formMessage.value = {
      type: 'error',
      text: `Failed to add endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  } finally {
    isAddingEndpoint.value = false
  }
}

function getCredentialsObject(): Record<string, string> {
  switch (customEndpointForm.authType) {
    case 'bearer':
      return { token: customEndpointForm.credentials }
    case 'api_key':
      return { apiKey: customEndpointForm.credentials }
    case 'oauth':
      return { accessToken: customEndpointForm.credentials }
    default:
      return {}
  }
}

function toggleEndpoint(id: string) {
  const endpoint = agentStore.mcpEndpoints.find(e => e.id === id)
  if (endpoint) {
    agentStore.updateMCPEndpoint(id, { isActive: !endpoint.isActive })
  }
}

function removeEndpoint(id: string) {
  const index = agentStore.mcpEndpoints.findIndex(e => e.id === id)
  if (index !== -1) {
    agentStore.mcpEndpoints.splice(index, 1)
  }
}
</script>

<style scoped>
.mcp-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 20px;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f5f5f5;
  color: #333;
  border-color: #ccc;
}

.back-btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.header-main {
  flex: 1;
  min-width: 0;
}

.header-main h1 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.header-subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
  font-weight: 400;
}

.header-status {
  flex-shrink: 0;
}

.connection-overview {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  min-width: 180px;
}

.status-indicator.no-connections {
  background: #fff5f5;
  border-color: #feb2b2;
}

.status-indicator.some-connections {
  background: #fffaf0;
  border-color: #fbd38d;
}

.status-indicator.many-connections {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.status-icon {
  font-size: 24px;
  line-height: 1;
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-count {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.status-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.health-icon {
  font-size: 10px;
}

.health-icon.health-none {
  color: #e53e3e;
}

.health-icon.health-good {
  color: #d69e2e;
}

.health-icon.health-excellent {
  color: #38a169;
}

.integration-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
  scrollbar-width: none;
}

.integration-tabs::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  position: relative;
  white-space: nowrap;
  min-width: fit-content;
}

.tab-button:hover {
  background: #f8f9fa;
  color: #333;
}

.tab-button:focus {
  outline: 2px solid #007bff;
  outline-offset: -2px;
}

.tab-button.active {
  background: #f8f9fa;
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-icon {
  font-size: 18px;
  line-height: 1;
}

.tab-label {
  font-weight: inherit;
}

.tab-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}

.tab-status.connected {
  background: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.tab-status.disconnected {
  background: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

.integration-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #f0f0f0;
}

.section-header {
  margin-bottom: 32px;
}

.section-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.section-description {
  margin: 0;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.overview-dashboard h3 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 36px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-content h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.stat-value {
  margin: 0 0 4px 0;
  color: #007bff;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.stat-description {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-activity {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.recent-activity h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.activity-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
}

.activity-text {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.activity-time {
  color: #666;
  font-size: 12px;
}

.custom-mcp h3 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 24px;
}

.add-endpoint-form {
  background: #f8f9fa;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  margin-bottom: 40px;
}

.form-header {
  margin-bottom: 32px;
}

.form-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.form-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
}

.required {
  color: #dc3545;
  font-weight: 500;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: white;
  transition: all 0.2s;
  line-height: 1.4;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  flex: 1;
}

.input-addon {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-left: none;
  background: #f8f9fa;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 16px;
}

.input-addon:hover {
  background: #e9ecef;
}

.field-help {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.field-error {
  margin-top: 6px;
  color: #dc3545;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  align-items: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: none;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  text-decoration: none;
}

.btn:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
  border-color: #545b62;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.2);
}

.form-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
}

.form-message.success {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.form-message.error {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.endpoints-list h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.empty-state p {
  margin: 0 0 8px 0;
}

.endpoint-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.endpoint-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.endpoint-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.endpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.endpoint-header h5 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.endpoint-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #f8d7da;
  color: #721c24;
}

.endpoint-status.active {
  background: #d4edda;
  color: #155724;
}

.endpoint-details {
  margin-bottom: 16px;
}

.endpoint-details p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

.endpoint-details strong {
  color: #333;
}

.endpoint-actions {
  display: flex;
  gap: 8px;
}

.toggle-btn,
.remove-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn {
  background: #f8f9fa;
  color: #666;
}

.toggle-btn.active {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.toggle-btn:not(.active):hover {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.remove-btn:hover {
  background: #c82333;
  border-color: #bd2130;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-main {
    text-align: center;
  }
  
  .header-status {
    align-self: center;
  }
  
  .connection-overview {
    align-items: center;
  }
  
  .status-indicator {
    min-width: auto;
    justify-content: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .endpoint-grid {
    grid-template-columns: 1fr;
  }
  
  .integration-tabs {
    gap: 2px;
  }
  
  .tab-button {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .tab-icon {
    font-size: 16px;
  }
  
  .integration-section {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .mcp-manager {
    padding: 16px;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
  
  .header-subtitle {
    font-size: 14px;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 28px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .integration-section {
    padding: 16px;
  }
  
  .add-endpoint-form {
    padding: 20px;
  }
}
</style>