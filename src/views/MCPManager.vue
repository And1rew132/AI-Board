<template>
  <div class="mcp-manager">
    <header class="page-header">
      <button @click="$router.back()" class="back-btn">
        ← Back
      </button>
      <h1>MCP Integrations</h1>
      <div class="header-info">
        <span class="connection-count">
          {{ activeMCPEndpoints.length }} Active Connections
        </span>
      </div>
    </header>

    <div class="mcp-content">
      <div class="integration-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'overview'" class="integration-section">
          <div class="overview-dashboard">
            <h3>Integration Overview</h3>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                  <h4>Total Endpoints</h4>
                  <p class="stat-value">{{ mcpEndpoints.length }}</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                  <h4>Active Connections</h4>
                  <p class="stat-value">{{ activeMCPEndpoints.length }}</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🤖</div>
                <div class="stat-content">
                  <h4>Connected Agents</h4>
                  <p class="stat-value">{{ agentsWithMCP.length }}</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">🔗</div>
                <div class="stat-content">
                  <h4>Integration Types</h4>
                  <p class="stat-value">{{ uniqueIntegrationTypes.length }}</p>
                </div>
              </div>
            </div>

            <div class="recent-activity">
              <h4>Recent Activity</h4>
              <div class="activity-list">
                <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                  <span class="activity-icon">{{ activity.icon }}</span>
                  <span class="activity-text">{{ activity.description }}</span>
                  <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'openai'" class="integration-section">
          <OpenAIManager />
        </div>

        <div v-if="activeTab === 'github'" class="integration-section">
          <GitHubMCPManager />
        </div>

        <div v-if="activeTab === 'custom'" class="integration-section">
          <div class="custom-mcp">
            <h3>Custom MCP Endpoints</h3>
            
            <div class="add-endpoint-form">
              <h4>Add New MCP Endpoint</h4>
              <form @submit.prevent="addCustomEndpoint">
                <div class="form-row">
                  <div class="form-group">
                    <label for="endpointName">Name:</label>
                    <input 
                      id="endpointName"
                      v-model="customEndpointForm.name" 
                      type="text" 
                      required 
                      class="form-input"
                      placeholder="My Custom MCP Server"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="endpointUrl">URL:</label>
                    <input 
                      id="endpointUrl"
                      v-model="customEndpointForm.url" 
                      type="url" 
                      required 
                      class="form-input"
                      placeholder="https://api.example.com/mcp"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="endpointType">Type:</label>
                    <select 
                      id="endpointType"
                      v-model="customEndpointForm.type" 
                      class="form-select"
                    >
                      <option value="knowledge_base">Knowledge Base</option>
                      <option value="tool_server">Tool Server</option>
                      <option value="data_source">Data Source</option>
                      <option value="api_gateway">API Gateway</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="authType">Authentication:</label>
                    <select 
                      id="authType"
                      v-model="customEndpointForm.authType" 
                      class="form-select"
                    >
                      <option value="">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="api_key">API Key</option>
                      <option value="oauth">OAuth</option>
                    </select>
                  </div>
                </div>

                <div v-if="customEndpointForm.authType" class="form-group">
                  <label for="credentials">Credentials:</label>
                  <input 
                    id="credentials"
                    v-model="customEndpointForm.credentials" 
                    type="password" 
                    class="form-input"
                    :placeholder="getCredentialsPlaceholder()"
                  />
                </div>

                <button type="submit" class="add-btn">
                  Add Endpoint
                </button>
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
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'openai', name: 'OpenAI', icon: '🤖' },
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'custom', name: 'Custom', icon: '⚙️' }
]

const customEndpointForm = reactive({
  name: '',
  url: '',
  type: 'tool_server' as MCPEndpoint['type'],
  authType: '' as 'bearer' | 'api_key' | 'oauth' | '',
  credentials: ''
})

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

function addCustomEndpoint() {
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.header-info {
  color: #666;
  font-size: 14px;
}

.connection-count {
  background: #e7f5e7;
  color: #2d6a2d;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.integration-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-button.active {
  background: #f8f9fa;
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-icon {
  font-size: 18px;
}

.integration-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.overview-dashboard h3 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
}

.stat-content h4 {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.stat-value {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
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
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 30px;
}

.add-endpoint-form h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input,
.form-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
}

.add-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #0056b3;
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
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .endpoint-grid {
    grid-template-columns: 1fr;
  }
}
</style>