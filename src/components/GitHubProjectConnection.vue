<template>
  <div class="github-project-connection">
    <!-- Connection Status -->
    <div v-if="project?.githubIntegration" class="connected-state">
      <div class="connection-header">
        <div class="connection-info">
          <span class="status-indicator connected"></span>
          <div>
            <h4>{{ project.githubIntegration.owner }}/{{ project.githubIntegration.repo }}</h4>
            <p class="repo-url">{{ project.githubIntegration.repositoryUrl }}</p>
            <p class="last-sync">Last synced: {{ formatDate(project.githubIntegration.lastSync) }}</p>
          </div>
        </div>
        <div class="connection-actions">
          <button @click="syncWithGitHub" :disabled="syncing" class="btn-sync">
            {{ syncing ? 'Syncing...' : 'Sync Now' }}
          </button>
          <button @click="showDisconnectConfirm = true" class="btn-disconnect">
            Disconnect
          </button>
        </div>
      </div>

      <!-- GitHub Repository Info -->
      <div class="repo-info">
        <div class="info-section">
          <h5>Repository Information</h5>
          <div class="info-grid">
            <div class="info-item">
              <label>Branch:</label>
              <span>{{ project.githubIntegration.branch }}</span>
            </div>
            <div class="info-item">
              <label>Issues Sync:</label>
              <span>{{ project.githubIntegration.issuesSyncEnabled ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="info-item">
              <label>Auto-create Issues:</label>
              <span>{{ project.githubIntegration.autoCreateIssues ? 'Enabled' : 'Disabled' }}</span>
            </div>
          </div>
        </div>

        <!-- README Preview -->
        <div v-if="project.githubIntegration.readme" class="readme-section">
          <h5>Repository README</h5>
          <div class="readme-content">
            <pre>{{ truncateReadme(project.githubIntegration.readme) }}</pre>
            <button v-if="project.githubIntegration.readme.length > 500" 
                    @click="showFullReadme = !showFullReadme" 
                    class="btn-toggle-readme">
              {{ showFullReadme ? 'Show Less' : 'Show More' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sync Settings -->
      <div class="sync-settings">
        <h5>Sync Settings</h5>
        <div class="settings-grid">
          <div class="setting-item">
            <label>
              <input type="checkbox" 
                     v-model="syncSettings.issuesSyncEnabled"
                     @change="updateSyncSettings">
              Enable Issues Sync
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" 
                     v-model="syncSettings.autoCreateIssues"
                     @change="updateSyncSettings">
              Auto-create Issues via AI Agent
            </label>
          </div>
          <div v-if="syncSettings.autoCreateIssues" class="setting-item">
            <label>Agent Interval (minutes):</label>
            <input type="number" 
                   v-model="syncSettings.agentInterval"
                   @change="updateSyncSettings"
                   min="1" 
                   max="1440">
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Form -->
    <div v-else class="disconnected-state">
      <div class="connection-form">
        <h4>Connect to GitHub Repository</h4>
        <p>Link this project to a GitHub repository to sync issues and enable AI agent automation.</p>
        
        <form @submit.prevent="connectToGitHub">
          <div class="form-group">
            <label for="repoUrl">Repository URL</label>
            <input 
              id="repoUrl"
              type="url" 
              v-model="connectionForm.repositoryUrl"
              placeholder="https://github.com/owner/repository"
              required>
            <small>GitHub repository URL (HTTPS or SSH)</small>
          </div>
          
          <div class="form-group">
            <label for="accessToken">GitHub Personal Access Token</label>
            <input 
              id="accessToken"
              type="password" 
              v-model="connectionForm.accessToken"
              placeholder="github_pat_..."
              required>
            <small>Token with 'repo' and 'issues' permissions</small>
          </div>
          
          <div class="form-actions">
            <button type="submit" :disabled="connecting" class="btn-connect">
              {{ connecting ? 'Connecting...' : 'Connect Repository' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Disconnect Confirmation -->
    <div v-if="showDisconnectConfirm" class="disconnect-confirm">
      <div class="confirm-overlay" @click="showDisconnectConfirm = false"></div>
      <div class="confirm-dialog">
        <h4>Disconnect GitHub Repository?</h4>
        <p>This will remove the connection to the GitHub repository. Existing synced tasks will remain but will no longer sync with GitHub issues.</p>
        <div class="confirm-actions">
          <button @click="showDisconnectConfirm = false" class="btn-cancel">Cancel</button>
          <button @click="disconnectFromGitHub" class="btn-confirm">Disconnect</button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { Project } from '@/types'

interface Props {
  project: Project
}

const props = defineProps<Props>()
const projectStore = useProjectStore()

const connecting = ref(false)
const syncing = ref(false)
const showDisconnectConfirm = ref(false)
const showFullReadme = ref(false)
const error = ref('')

const connectionForm = reactive({
  repositoryUrl: '',
  accessToken: ''
})

const syncSettings = reactive({
  issuesSyncEnabled: true,
  autoCreateIssues: false,
  agentInterval: 60
})

// Initialize sync settings from project
onMounted(() => {
  if (props.project.githubIntegration) {
    syncSettings.issuesSyncEnabled = props.project.githubIntegration.issuesSyncEnabled
    syncSettings.autoCreateIssues = props.project.githubIntegration.autoCreateIssues
    syncSettings.agentInterval = props.project.githubIntegration.agentInterval || 60
  }
})

const truncateReadme = computed(() => {
  return (readme: string) => {
    if (showFullReadme.value || readme.length <= 500) {
      return readme
    }
    return readme.substring(0, 500) + '...'
  }
})

async function connectToGitHub() {
  connecting.value = true
  error.value = ''
  
  try {
    await projectStore.connectProjectToGitHub(
      props.project.id,
      connectionForm.repositoryUrl,
      connectionForm.accessToken
    )
    
    // Clear form
    connectionForm.repositoryUrl = ''
    connectionForm.accessToken = ''
    
    // Initial sync
    await syncWithGitHub()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connection failed'
  } finally {
    connecting.value = false
  }
}

async function syncWithGitHub() {
  syncing.value = true
  error.value = ''
  
  try {
    await projectStore.syncProjectWithGitHub(props.project.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sync failed'
  } finally {
    syncing.value = false
  }
}

function disconnectFromGitHub() {
  projectStore.disconnectProjectFromGitHub(props.project.id)
  showDisconnectConfirm.value = false
}

function updateSyncSettings() {
  if (props.project.githubIntegration) {
    projectStore.updateProject(props.project.id, {
      githubIntegration: {
        ...props.project.githubIntegration,
        issuesSyncEnabled: syncSettings.issuesSyncEnabled,
        autoCreateIssues: syncSettings.autoCreateIssues,
        agentInterval: syncSettings.agentInterval
      }
    })
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.github-project-connection {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.connected-state .connection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.connection-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.25rem;
}

.status-indicator.connected {
  background: #28a745;
}

.connection-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.repo-url {
  color: #666;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.last-sync {
  color: #888;
  font-size: 0.8rem;
  margin: 0;
}

.connection-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sync, .btn-disconnect, .btn-connect {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sync {
  background: #007bff;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #0056b3;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-disconnect {
  background: #dc3545;
  color: white;
}

.btn-disconnect:hover {
  background: #c82333;
}

.btn-connect {
  background: #28a745;
  color: white;
  width: 100%;
  padding: 0.75rem;
}

.btn-connect:hover:not(:disabled) {
  background: #218838;
}

.btn-connect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.repo-info {
  margin-bottom: 1.5rem;
}

.info-section, .readme-section, .sync-settings {
  margin-bottom: 1.5rem;
}

.info-section h5, .readme-section h5, .sync-settings h5 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.readme-content {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  position: relative;
}

.readme-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #333;
}

.btn-toggle-readme {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-toggle-readme:hover {
  background: #0056b3;
}

.settings-grid {
  display: grid;
  gap: 0.75rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.setting-item input[type="checkbox"] {
  margin: 0;
}

.setting-item input[type="number"] {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 80px;
}

.disconnected-state .connection-form {
  max-width: 500px;
}

.connection-form h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.connection-form p {
  color: #666;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.75rem;
}

.disconnect-confirm {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.confirm-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.confirm-dialog h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
}

.confirm-dialog p {
  margin-bottom: 1.5rem;
  color: #666;
  line-height: 1.4;
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-confirm {
  background: #dc3545;
  color: white;
}

.btn-confirm:hover {
  background: #c82333;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-size: 0.875rem;
}
</style>