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
      <h4>Connect to GitHub</h4>
      
      <div class="auth-tabs">
        <button 
          @click="authMode = 'pat'" 
          class="auth-tab"
          :class="{ active: authMode === 'pat' }"
        >
          Personal Access Token
        </button>
        <button 
          @click="authMode = 'oauth'" 
          class="auth-tab"
          :class="{ active: authMode === 'oauth' }"
        >
          OAuth / SSO
        </button>
      </div>

      <div v-if="authMode === 'pat'" class="auth-section">
        <form @submit.prevent="connectToGitHub">
          <div class="form-group">
            <label for="githubToken">GitHub Personal Access Token:</label>
            <input 
              id="githubToken"
              v-model="connectionForm.token" 
              type="password" 
              required
              class="form-input"
              placeholder="ghp_xxxxxxxxxxxx"
            >
            <small class="form-help">
              <strong>Required:</strong> Personal access token with repo access for repository management.
              <br>
              Create one at: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub Settings → Personal access tokens</a>
            </small>
          </div>
          
          <button type="submit" :disabled="connecting || !connectionForm.token.trim()" class="btn-connect">
            {{ connecting ? 'Connecting...' : 'Connect with Personal Access Token' }}
          </button>
        </form>
      </div>

      <div v-else-if="authMode === 'oauth'" class="auth-section">
        <div class="oauth-info">
          <h5>OAuth Authentication</h5>
          <p>Connect using GitHub's OAuth flow for enhanced security and SSO support.</p>
          <div class="oauth-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">🔒</span>
              <span>More secure than personal access tokens</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🏢</span>
              <span>Works with SSO and organization policies</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">⚡</span>
              <span>No need to manage tokens manually</span>
            </div>
          </div>
        </div>
        
        <div v-if="oauthError" class="oauth-error">
          {{ oauthError }}
        </div>
        
        <button @click="initiateOAuth" :disabled="connecting" class="btn-oauth">
          {{ connecting ? 'Redirecting...' : 'Connect with GitHub OAuth' }}
        </button>
      </div>
    </div>

    <div v-else class="connected-actions">
      <div class="connection-info">
        <h4>GitHub Connection</h4>
        <div class="info-item">
          <span class="label">Status:</span>
          <span class="value connected">
            Connected with {{ githubMCP.getAuthMethod() === 'oauth' ? 'OAuth' : 'Personal Access Token' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">Token:</span>
          <span class="value">
            {{ githubMCP.getAuthMethod() === 'oauth' ? 'OAuth Access Token' : maskToken(connectionForm.token) }}
          </span>
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
const authMode = ref<'pat' | 'oauth'>('pat')
const oauthError = ref('')

const connectionForm = reactive({
  token: ''
})

const isConnected = computed(() => githubMCP.isConnected())
const connectionInfo = computed(() => githubMCP.getConnectionInfo())

async function initiateOAuth() {
  connecting.value = true
  oauthError.value = ''
  
  try {
    const oauthUrl = githubMCP.getOAuthUrl()
    // Redirect to GitHub OAuth
    window.location.href = oauthUrl
  } catch (err) {
    oauthError.value = err instanceof Error ? err.message : 'Failed to initiate OAuth'
    connecting.value = false
  }
}

async function connectToGitHub() {
  connecting.value = true
  error.value = ''
  
  try {
    const success = await githubMCP.connectToGitHub(connectionForm.token)
    
    if (success) {
      // Add the GitHub MCP endpoint to the agent store
      agentStore.addMCPEndpoint({
        name: 'GitHub Integration',
        url: 'https://api.github.com',
        type: 'api_gateway',
        auth: {
          type: 'bearer',
          credentials: { token: connectionForm.token }
        },
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
      error.value = 'Failed to connect to GitHub. Please check your Personal Access Token.'
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

function maskToken(token: string): string {
  if (!token) return 'Not set'
  if (token.length <= 8) return token
  return token.substring(0, 4) + '•'.repeat(token.length - 8) + token.substring(token.length - 4)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  // Check if there's already a GitHub endpoint configured
  const existingEndpoint = agentStore.getActiveMCPEndpoints()
    .find(endpoint => endpoint.name.includes('GitHub'))
  
  if (existingEndpoint && existingEndpoint.auth?.credentials.token) {
    connectionForm.token = existingEndpoint.auth.credentials.token
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

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.auth-tab {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.auth-tab:hover {
  background: #f5f5f5;
  color: #333;
}

.auth-tab.active {
  background: #f8f9fa;
  color: #007bff;
  border-bottom-color: #007bff;
}

.auth-section {
  padding-top: 1rem;
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

.oauth-info {
  background: rgba(0, 123, 255, 0.05);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0, 123, 255, 0.1);
}

.oauth-info h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 16px;
}

.oauth-info p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 14px;
}

.oauth-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #555;
}

.benefit-icon {
  font-size: 16px;
}

.oauth-error {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 3px solid #dc3545;
  font-size: 14px;
}

.btn-oauth {
  background: #333;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-oauth:hover:not(:disabled) {
  background: #24292e;
  transform: translateY(-2px);
}

.btn-oauth:disabled {
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