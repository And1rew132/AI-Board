<template>
  <div class="github-mcp-manager">
    <div class="connection-status">
      <h3>GitHub MCP Connection</h3>
      <div class="status-indicator" :class="{ connected: isConnected, disconnected: !isConnected }">
        <span class="status-dot"></span>
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </div>

    <div v-if="!isConnected" class="connection-form">
      <h4>Connect to GitHub MCP Server</h4>
      <form @submit.prevent="connectToGitHub">
        <div class="form-group">
          <label for="mcpServerUrl">MCP Server URL:</label>
          <input 
            id="mcpServerUrl"
            v-model="connectionForm.serverUrl" 
            type="url" 
            required 
            class="form-input"
            placeholder="http://localhost:3000/mcp"
          >
        </div>
        
        <div class="form-group">
          <label for="githubToken">GitHub Token (optional):</label>
          <input 
            id="githubToken"
            v-model="connectionForm.token" 
            type="password" 
            class="form-input"
            placeholder="ghp_xxxxxxxxxxxx"
          >
          <small class="form-help">
            Personal access token for private repositories and higher rate limits
          </small>
        </div>
        
        <button type="submit" :disabled="connecting" class="btn-connect">
          {{ connecting ? 'Connecting...' : 'Connect to GitHub' }}
        </button>
      </form>
    </div>

    <div v-else class="connected-actions">
      <div class="connection-info">
        <h4>Connection Details</h4>
        <div class="info-item">
          <span class="label">Server URL:</span>
          <span class="value">{{ connectionInfo?.url }}</span>
        </div>
        <div class="info-item">
          <span class="label">Status:</span>
          <span class="value connected">Active</span>
        </div>
      </div>

      <div class="github-actions">
        <h4>GitHub Operations</h4>
        <div class="action-buttons">
          <button @click="showRepositories = !showRepositories" class="btn-action">
            {{ showRepositories ? 'Hide' : 'Show' }} Repositories
          </button>
          <button @click="loadRepositories" class="btn-action">
            Refresh Repositories
          </button>
          <button @click="disconnect" class="btn-disconnect">
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
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.connection-status h3 {
  margin: 0;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
}

.status-indicator.connected .status-dot {
  background: #28a745;
}

.status-indicator.connected {
  color: #28a745;
}

.status-indicator.disconnected {
  color: #dc3545;
}

.connection-form {
  background: rgba(102, 126, 234, 0.05);
  padding: 2rem;
  border-radius: 10px;
}

.connection-form h4 {
  margin-top: 0;
  color: #333;
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-help {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.btn-connect {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-connect:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.btn-connect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connected-actions {
  display: grid;
  gap: 2rem;
}

.connection-info {
  background: rgba(40, 167, 69, 0.05);
  padding: 1.5rem;
  border-radius: 10px;
}

.connection-info h4 {
  margin-top: 0;
  color: #333;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.info-item .value {
  color: #333;
}

.info-item .value.connected {
  color: #28a745;
  font-weight: 500;
}

.github-actions h4 {
  margin-bottom: 1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-action, .btn-disconnect, .btn-explore, .btn-sync {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-action {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.btn-disconnect {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.btn-explore {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.btn-sync {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.btn-action:hover, .btn-disconnect:hover, .btn-explore:hover, .btn-sync:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.repositories-section {
  background: rgba(0, 0, 0, 0.02);
  padding: 1.5rem;
  border-radius: 10px;
}

.repositories-section h4 {
  margin-top: 0;
  color: #333;
}

.loading {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.repositories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.repository-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.repository-card:hover {
  transform: translateY(-2px);
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.repo-header h5 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.repo-visibility {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.repo-visibility.private {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.repo-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.repo-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.repo-language {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
}

.repo-actions {
  display: flex;
  gap: 0.5rem;
}

.no-repositories {
  text-align: center;
  color: #666;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border-left: 4px solid #dc3545;
}
</style>