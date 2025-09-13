<template>
  <div class="github-mcp-manager">
    <div class="section-header">
      <div class="header-content">
        <h3>GitHub MCP Connection</h3>
        <p class="section-description">Connect to GitHub repositories via MCP server</p>
      </div>
      <div class="status-indicator" :class="{ 
        connected: isConnected, 
        connecting: connecting,
        disconnected: !isConnected && !connecting 
      }">
        <span class="status-icon" :aria-label="isConnected ? 'Connected' : 'Disconnected'">
          {{ isConnected ? '🟢' : connecting ? '🟡' : '🔴' }}
        </span>
        <div class="status-info">
          <span class="status-text">{{ isConnected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected' }}</span>
        </div>
      </div>
    </div>

    <div v-if="!isConnected" class="connection-form">
      <div class="form-header">
        <h4>Connect to GitHub MCP Server</h4>
        <p class="form-description">Configure your GitHub MCP server connection for repository integration</p>
      </div>
      
      <form @submit.prevent="connectToGitHub" novalidate>
        <div class="form-group">
          <label for="mcpServerUrl" class="form-label">
            MCP Server URL <span class="required">*</span>
          </label>
          <input 
            id="mcpServerUrl"
            v-model="connectionForm.serverUrl" 
            type="url" 
            required 
            class="form-input"
            placeholder="http://localhost:3000/mcp"
            aria-describedby="mcpServerUrl-help"
          >
          <small id="mcpServerUrl-help" class="field-help">
            URL of your GitHub MCP server endpoint
          </small>
        </div>
        
        <div class="form-group">
          <label for="githubToken" class="form-label">GitHub Token</label>
          <input 
            id="githubToken"
            v-model="connectionForm.token" 
            type="password" 
            class="form-input"
            placeholder="ghp_xxxxxxxxxxxx"
            aria-describedby="githubToken-help"
          >
          <small id="githubToken-help" class="field-help">
            Optional: Personal access token for private repositories and higher rate limits
          </small>
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="connecting || !connectionForm.serverUrl.trim()" 
            class="btn btn-primary"
          >
            {{ connecting ? 'Connecting...' : 'Connect to GitHub' }}
          </button>
        </div>
      </form>
    </div>

    <div v-else class="connected-actions">
      <div class="connection-info">
        <h4>Connection Active</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Server URL:</span>
            <span class="value">{{ connectionInfo?.url }}</span>
          </div>
          <div class="info-item">
            <span class="label">Status:</span>
            <span class="value connected">Active</span>
          </div>
        </div>
      </div>

      <div class="github-actions">
        <h4>GitHub Operations</h4>
        <div class="form-actions">
          <button @click="showRepositories = !showRepositories" class="btn btn-secondary">
            {{ showRepositories ? 'Hide' : 'Show' }} Repositories
          </button>
          <button @click="loadRepositories" class="btn btn-secondary">
            Refresh Repositories
          </button>
          <button @click="disconnect" class="btn btn-danger">
            Disconnect
          </button>
        </div>
      </div>

      <div v-if="showRepositories" class="repositories-section">
        <h4>Available Repositories</h4>
        <div v-if="loading" class="loading">Loading repositories...</div>
        
        <div v-else-if="repositories.length > 0" class="repositories-grid">
          <div 
            v-for="repo in repositories" 
            :key="repo.id"
            class="repository-card"
          >
            <div class="repo-header">
              <h5>{{ repo.name }}</h5>
              <span class="repo-visibility" :class="{ private: repo.private }">
                {{ repo.private ? 'Private' : 'Public' }}
              </span>
            </div>
            
            <p class="repo-description">{{ repo.description || 'No description' }}</p>
            
            <div class="repo-details">
              <span class="repo-language" v-if="repo.language">{{ repo.language }}</span>
              <span class="repo-updated">Updated {{ formatDate(repo.updated_at) }}</span>
            </div>
            
            <div class="repo-actions">
              <button @click="exploreRepository(repo)" class="btn-explore">
                Explore
              </button>
              <button @click="syncRepository(repo)" class="btn-sync">
                Sync to Project
              </button>
            </div>
          </div>
        </div>
        
        <div v-else-if="!loading" class="no-repositories">
          No repositories found. Make sure your GitHub token has the necessary permissions.
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { GitHubMCPService, type GitHubRepository } from '@/services/github-mcp'
import { useAgentStore } from '@/stores/agents'

const agentStore = useAgentStore()
const githubMCP = new GitHubMCPService()

const connecting = ref(false)
const loading = ref(false)
const showRepositories = ref(false)
const repositories = ref<GitHubRepository[]>([])
const error = ref('')

const connectionForm = reactive({
  serverUrl: 'http://localhost:3000/mcp',
  token: ''
})

const isConnected = computed(() => githubMCP.isConnected())
const connectionInfo = computed(() => githubMCP.getConnectionInfo())

async function connectToGitHub() {
  connecting.value = true
  error.value = ''
  
  try {
    const success = await githubMCP.connectToGitHub(
      connectionForm.serverUrl,
      connectionForm.token || undefined
    )
    
    if (success) {
      // Add the GitHub MCP endpoint to the agent store
      agentStore.addMCPEndpoint({
        name: 'GitHub MCP Server',
        url: connectionForm.serverUrl,
        type: 'api_gateway',
        auth: connectionForm.token ? {
          type: 'bearer',
          credentials: { token: connectionForm.token }
        } : undefined,
        capabilities: [
          'repository_list',
          'file_read',
          'file_write',
          'commit_history',
          'branch_management'
        ],
        isActive: true
      })
      
      await loadRepositories()
    } else {
      error.value = 'Failed to connect to GitHub MCP server'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connection failed'
  } finally {
    connecting.value = false
  }
}

async function loadRepositories() {
  if (!isConnected.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    repositories.value = await githubMCP.listRepositories()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load repositories'
  } finally {
    loading.value = false
  }
}

function disconnect() {
  const endpoint = connectionInfo.value
  if (endpoint) {
    githubMCP.removeEndpoint(endpoint.id)
    agentStore.updateMCPEndpoint(endpoint.id, { isActive: false })
  }
  
  repositories.value = []
  showRepositories.value = false
  connectionForm.token = ''
}

function exploreRepository(repo: GitHubRepository) {
  // TODO: Implement repository exploration
  console.log('Exploring repository:', repo.full_name)
}

function syncRepository(repo: GitHubRepository) {
  // TODO: Implement repository sync to project
  console.log('Syncing repository to project:', repo.full_name)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  // Check if there's already a GitHub MCP endpoint configured
  const existingEndpoint = agentStore.getActiveMCPEndpoints()
    .find(endpoint => endpoint.name.includes('GitHub'))
  
  if (existingEndpoint) {
    connectionForm.serverUrl = existingEndpoint.url
    if (existingEndpoint.auth?.credentials.token) {
      connectionForm.token = existingEndpoint.auth.credentials.token
    }
  }
})
</script>

<style scoped>
.github-mcp-manager {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.header-content h3 {
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

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  min-width: 160px;
  flex-shrink: 0;
}

.status-indicator.connected {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.status-indicator.connecting {
  background: #fffaf0;
  border-color: #fbd38d;
}

.status-indicator.disconnected {
  background: #fff5f5;
  border-color: #feb2b2;
}

.status-icon {
  font-size: 20px;
  line-height: 1;
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.connection-form {
  background: #f8f9fa;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
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

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
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

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: white;
  transition: all 0.2s;
  line-height: 1.4;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.field-help {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
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

.btn-danger {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.connected-actions {
  display: grid;
  gap: 32px;
}

.connection-info {
  background: #f0fff4;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #9ae6b4;
}

.connection-info h4 {
  margin: 0 0 20px 0;
  color: #2d6a2d;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #c3e6c3;
}

.info-item .label {
  font-weight: 600;
  color: #2d6a2d;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item .value.connected {
  color: #2d6a2d;
  font-weight: 600;
}

.github-actions h4 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

/* Repository section styles (keeping existing functionality) */
.repositories-section {
  background: rgba(0, 0, 0, 0.02);
  padding: 24px;
  border-radius: 12px;
  margin-top: 24px;
}

.repositories-section h4 {
  margin-top: 0;
  color: #333;
}

.loading {
  text-align: center;
  color: #666;
  padding: 40px;
}

.repositories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.repository-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  border: 1px solid #f0f0f0;
}

.repository-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.repo-header h5 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.repo-visibility {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.repo-visibility.private {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.repo-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.repo-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 12px;
  color: #666;
}

.repo-language {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.repo-actions {
  display: flex;
  gap: 12px;
}

.btn-explore,
.btn-sync {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-explore {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
  border: 1px solid rgba(23, 162, 184, 0.2);
}

.btn-sync {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.btn-explore:hover,
.btn-sync:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.no-repositories {
  text-align: center;
  color: #666;
  padding: 40px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
  border-left: 4px solid #dc3545;
  font-weight: 500;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-content {
    text-align: center;
  }
  
  .status-indicator {
    align-self: center;
    min-width: auto;
    justify-content: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .repositories-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .connection-form,
  .connection-info,
  .repositories-section {
    padding: 20px;
  }
  
  .section-header h3 {
    font-size: 20px;
  }
  
  .section-description {
    font-size: 14px;
  }
  
  .status-indicator {
    padding: 10px 12px;
  }
  
  .repository-card {
    padding: 16px;
  }
}


</style>