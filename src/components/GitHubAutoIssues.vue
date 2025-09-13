<template>
  <div class="github-auto-issues">
    <div class="header">
      <h3>🤖 Auto GitHub Issues</h3>
      <p class="description">
        Set up an agent to automatically analyze repository READMEs and create GitHub issues for improvements, features, and documentation.
      </p>
    </div>

    <div v-if="!githubMCP.isConnected()" class="connection-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <span>GitHub connection required. Please connect to GitHub in the MCP Manager first.</span>
      </div>
    </div>

    <div v-else class="main-content">
      <!-- Configuration Form -->
      <div class="config-section">
        <h4>🔧 Configuration</h4>
        
        <form @submit.prevent="saveConfiguration" class="config-form">
          <div class="form-row">
            <div class="form-group">
              <label for="repoOwner">Repository Owner</label>
              <input 
                id="repoOwner"
                v-model="config.repositoryOwner" 
                type="text" 
                required
                class="form-input"
                placeholder="e.g., And1rew132"
              >
            </div>
            
            <div class="form-group">
              <label for="repoName">Repository Name</label>
              <input 
                id="repoName"
                v-model="config.repositoryName" 
                type="text" 
                required
                class="form-input"
                placeholder="e.g., AI-Board"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="analysisPrompt">Analysis Prompt (Optional)</label>
            <textarea 
              id="analysisPrompt"
              v-model="config.analysisPrompt" 
              class="form-textarea"
              rows="3"
              placeholder="Custom prompt for analyzing the README. Leave empty for default behavior."
            ></textarea>
          </div>

          <div class="form-group">
            <label for="issueTemplate">Issue Template (Optional)</label>
            <textarea 
              id="issueTemplate"
              v-model="config.issueTemplate" 
              class="form-textarea"
              rows="4"
              placeholder="Template for generated issues. Use variables like {{title}}, {{description}}, {{category}}"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="labels">Default Labels (comma-separated)</label>
              <input 
                id="labels"
                v-model="labelsInput" 
                type="text" 
                class="form-input"
                placeholder="enhancement, documentation, ai-generated"
              >
            </div>
            
            <div class="form-group">
              <label for="scheduleInterval">Check Interval (minutes)</label>
              <input 
                id="scheduleInterval"
                v-model.number="config.scheduleInterval" 
                type="number" 
                min="30"
                max="10080"
                required
                class="form-input"
                placeholder="60"
              >
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Configuration' }}
            </button>
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="testConfiguration"
              :disabled="!config.repositoryOwner || !config.repositoryName || testing"
            >
              {{ testing ? 'Testing...' : 'Test Configuration' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Agent Status -->
      <div class="status-section">
        <h4>🤖 Agent Status</h4>
        
        <div class="status-card">
          <div class="status-header">
            <span class="status-label">Auto Issue Agent</span>
            <div class="status-indicator" :class="{ 
              enabled: config.enabled, 
              disabled: !config.enabled 
            }">
              <span class="status-dot"></span>
              {{ config.enabled ? 'Enabled' : 'Disabled' }}
            </div>
          </div>
          
          <div class="status-details">
            <div class="detail-item">
              <span class="label">Target Repository:</span>
              <span class="value">{{ config.repositoryOwner }}/{{ config.repositoryName || 'Not set' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Associated Agent:</span>
              <span class="value">{{ getAgentStatus() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Last Run:</span>
              <span class="value">{{ config.lastRun ? formatDate(config.lastRun) : 'Never' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Issues Created:</span>
              <span class="value">{{ config.createdIssues }}</span>
            </div>
            <div class="detail-item" v-if="config.lastError">
              <span class="label error">Last Error:</span>
              <span class="value error">{{ config.lastError }}</span>
            </div>
          </div>

          <div class="status-actions">
            <button 
              class="btn btn-toggle"
              @click="toggleAgent"
              :disabled="!config.repositoryOwner || !config.repositoryName"
            >
              {{ config.enabled ? 'Disable Agent' : 'Enable Agent' }}
            </button>
            <button 
              class="btn btn-action"
              @click="runAnalysisNow"
              :disabled="!config.enabled || running"
            >
              {{ running ? 'Running...' : 'Run Now' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Issues -->
      <div class="recent-issues-section" v-if="recentIssues.length > 0">
        <h4>📋 Recently Created Issues</h4>
        
        <div class="issues-list">
          <div 
            v-for="issue in recentIssues" 
            :key="issue.number"
            class="issue-card"
          >
            <div class="issue-header">
              <a :href="issue.html_url" target="_blank" class="issue-title">
                #{{ issue.number }} {{ issue.title }}
              </a>
              <span class="issue-state" :class="issue.state">{{ issue.state }}</span>
            </div>
            <div class="issue-body" v-if="issue.body">
              {{ truncateText(issue.body, 150) }}
            </div>
            <div class="issue-meta">
              <span class="issue-date">{{ formatDate(new Date(issue.created_at)) }}</span>
              <div class="issue-labels">
                <span 
                  v-for="label in issue.labels.slice(0, 3)" 
                  :key="label.id"
                  class="label"
                  :style="{ backgroundColor: `#${label.color}` }"
                >
                  {{ label.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Results Modal -->
    <div v-if="showTestResults" class="modal-overlay" @click="showTestResults = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🧪 Test Results</h3>
          <button class="modal-close" @click="showTestResults = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="testResults.success" class="test-success">
            <h4>✅ Configuration Test Successful</h4>
            <p><strong>Repository:</strong> {{ testResults.repository?.full_name }}</p>
            <p><strong>Description:</strong> {{ testResults.repository?.description || 'No description' }}</p>
            <p><strong>README Found:</strong> {{ testResults.readmeExists ? 'Yes' : 'No' }}</p>
            <div v-if="testResults.analysisPreview" class="analysis-preview">
              <h5>Generated Issues Preview:</h5>
              <pre>{{ testResults.analysisPreview }}</pre>
            </div>
          </div>
          <div v-else class="test-error">
            <h4>❌ Test Failed</h4>
            <p>{{ testResults.error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { GitHubMCPService, type GitHubRepository } from '@/services/github-mcp'
import { useAgentStore } from '@/stores/agents'
import type { GitHubAutoIssueConfig, GitHubIssue, Agent, MCPEndpoint } from '@/types'

const agentStore = useAgentStore()
const githubMCP = new GitHubMCPService()

const saving = ref(false)
const testing = ref(false)
const running = ref(false)
const showTestResults = ref(false)
const recentIssues = ref<GitHubIssue[]>([])

const config = reactive<GitHubAutoIssueConfig>({
  id: 'github-auto-issues-' + Date.now(),
  agentId: '',
  repositoryOwner: '',
  repositoryName: '',
  enabled: false,
  analysisPrompt: '',
  issueTemplate: '',
  labels: ['ai-generated', 'enhancement'],
  assignees: [],
  scheduleInterval: 60,
  createdIssues: 0
})

const labelsInput = ref('')

const testResults = reactive({
  success: false,
  error: '',
  repository: null as GitHubRepository | null,
  readmeExists: false,
  analysisPreview: ''
})

// Initialize component
onMounted(async () => {
  // Load saved configuration if it exists
  const savedConfig = localStorage.getItem('github-auto-issues-config')
  if (savedConfig) {
    Object.assign(config, JSON.parse(savedConfig))
    labelsInput.value = config.labels?.join(', ') || ''
  }

  // Try to initialize GitHub connection from existing MCP endpoints
  const githubEndpoint = agentStore.getActiveMCPEndpoints()
    .find(endpoint => endpoint.name.includes('GitHub'))
  
  if (githubEndpoint && githubEndpoint.auth?.credentials?.token) {
    await githubMCP.connectToGitHub(githubEndpoint.auth.credentials.token)
  }

  // Check if GitHub is connected and load recent issues
  if (githubMCP.isConnected() && config.repositoryOwner && config.repositoryName) {
    await loadRecentIssues()
  }
})

async function saveConfiguration() {
  saving.value = true
  try {
    // Parse labels from input
    config.labels = labelsInput.value
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0)

    // Save to localStorage (in a real app, this would go to a backend)
    localStorage.setItem('github-auto-issues-config', JSON.stringify(config))
    
    // Create or update agent if enabled
    if (config.enabled) {
      await createOrUpdateAgent()
    }

    console.log('Configuration saved successfully')
  } catch (error) {
    console.error('Failed to save configuration:', error)
    config.lastError = String(error)
  } finally {
    saving.value = false
  }
}

async function testConfiguration() {
  testing.value = true
  testResults.success = false
  testResults.error = ''
  testResults.repository = null
  testResults.readmeExists = false
  testResults.analysisPreview = ''

  try {
    // Test repository access
    const repository = await githubMCP.getRepository(config.repositoryOwner, config.repositoryName)
    testResults.repository = repository

    // Check if README exists
    try {
      const readmeContent = await githubMCP.getFileContent(
        config.repositoryOwner, 
        config.repositoryName, 
        'README.md'
      )
      testResults.readmeExists = true

      // Generate a preview of potential issues
      testResults.analysisPreview = await generateIssuesPreview(readmeContent)
    } catch {
      testResults.readmeExists = false
    }

    testResults.success = true
    showTestResults.value = true
  } catch (error) {
    testResults.error = String(error)
    testResults.success = false
    showTestResults.value = true
  } finally {
    testing.value = false
  }
}

async function toggleAgent() {
  config.enabled = !config.enabled
  await saveConfiguration()
}

async function runAnalysisNow() {
  running.value = true
  try {
    await performAnalysis()
    await loadRecentIssues()
  } catch (error) {
    console.error('Analysis failed:', error)
    config.lastError = String(error)
  } finally {
    running.value = false
  }
}

async function createOrUpdateAgent() {
  if (!config.repositoryOwner || !config.repositoryName) {
    console.warn('Cannot create agent without repository configuration')
    return
  }

  try {
    // Check if an agent for this repository already exists
    const existingAgent = agentStore.agents.find(agent => 
      agent.name === `GitHub Auto Issues: ${config.repositoryOwner}/${config.repositoryName}`
    )

    if (existingAgent && config.enabled) {
      // Update existing agent
      agentStore.updateAgent(existingAgent.id, {
        status: 'active',
        lastActivity: new Date()
      })
      config.agentId = existingAgent.id
      console.log('Updated existing auto-issue agent:', existingAgent.id)
    } else if (config.enabled) {
      // Create new agent
      const newAgent: Omit<Agent, 'id'> = {
        name: `GitHub Auto Issues: ${config.repositoryOwner}/${config.repositoryName}`,
        description: `Automatically analyzes README and creates GitHub issues for ${config.repositoryOwner}/${config.repositoryName}`,
        type: 'autonomous',
        status: 'active',
        capabilities: [
          { type: 'github_issues', description: 'Create GitHub issues', enabled: true },
          { type: 'analysis', description: 'Analyze repository content', enabled: true },
          { type: 'mcp_client', description: 'Use MCP integrations', enabled: true }
        ],
        config: {
          autonomyLevel: 'medium',
          promptingStrategy: 'task_driven',
          mcpEndpoints: [githubMCP.getConnectionInfo()].filter(Boolean) as MCPEndpoint[],
          storageAccess: false,
          collaboration: {
            canCreateProjects: false,
            canModifyOtherAgentWork: false,
            requiresApproval: true
          }
        },
        projects: [],
        lastActivity: new Date(),
        createdAt: new Date(),
        runInterval: config.scheduleInterval * 60 // Convert minutes to seconds
      }

      const createdAgent = agentStore.createAgent(newAgent)
      config.agentId = createdAgent.id
      console.log('Created new auto-issue agent:', createdAgent.id)
    } else if (existingAgent && !config.enabled) {
      // Disable existing agent
      agentStore.updateAgent(existingAgent.id, {
        status: 'offline'
      })
      console.log('Disabled auto-issue agent:', existingAgent.id)
    }
  } catch (error) {
    console.error('Failed to create/update agent:', error)
    config.lastError = `Agent creation failed: ${error}`
  }
}

async function performAnalysis() {
  if (!config.repositoryOwner || !config.repositoryName) {
    throw new Error('Repository configuration is incomplete')
  }

  try {
    // Read the README
    const readmeContent = await githubMCP.getFileContent(
      config.repositoryOwner,
      config.repositoryName,
      'README.md'
    )

    // Generate potential issues
    const issuesSuggestions = await analyzeReadmeForIssues(readmeContent)

    // Create issues on GitHub
    for (const suggestion of issuesSuggestions.slice(0, 3)) { // Limit to 3 issues per run
      try {
        await githubMCP.createIssue(config.repositoryOwner, config.repositoryName, {
          title: suggestion.title,
          body: suggestion.body,
          labels: config.labels || []
        })
        config.createdIssues++
      } catch (error) {
        console.error('Failed to create issue:', suggestion.title, error)
      }
    }

    config.lastRun = new Date()
    config.lastError = undefined
    await saveConfiguration()

  } catch (error) {
    config.lastError = String(error)
    throw error
  }
}

async function loadRecentIssues() {
  if (!config.repositoryOwner || !config.repositoryName) return

  try {
    const issues = await githubMCP.listIssues(config.repositoryOwner, config.repositoryName, 'all')
    recentIssues.value = issues
      .filter(issue => config.labels?.some(label => 
        issue.labels.some(issueLabel => issueLabel.name === label)
      ))
      .slice(0, 5)
  } catch (error) {
    console.error('Failed to load recent issues:', error)
  }
}

async function generateIssuesPreview(readmeContent: string): Promise<string> {
  // Simple analysis for preview
  const suggestions = await analyzeReadmeForIssues(readmeContent)
  return suggestions
    .slice(0, 3)
    .map(s => `• ${s.title}\n  ${s.body.substring(0, 100)}...`)
    .join('\n\n')
}

async function analyzeReadmeForIssues(readmeContent: string): Promise<Array<{title: string, body: string}>> {
  // Simple rule-based analysis (in a real implementation, this would use AI)
  const suggestions = []

  // Check for missing sections
  const commonSections = ['installation', 'usage', 'contributing', 'license', 'api', 'examples']
  const lowerContent = readmeContent.toLowerCase()

  for (const section of commonSections) {
    if (!lowerContent.includes(section)) {
      suggestions.push({
        title: `Add ${section.charAt(0).toUpperCase() + section.slice(1)} Section`,
        body: `The README is missing a ${section} section. This would help users understand how to ${section === 'installation' ? 'install and set up' : section === 'usage' ? 'use' : 'work with'} the project.\n\n**Suggested content:**\n- Clear step-by-step instructions\n- Code examples where applicable\n- Common troubleshooting tips`
      })
    }
  }

  // Check for missing code examples
  if (!readmeContent.includes('```') && !readmeContent.includes('`')) {
    suggestions.push({
      title: 'Add Code Examples to README',
      body: 'The README would benefit from code examples to demonstrate usage. Consider adding:\n\n- Basic usage examples\n- Common use cases\n- API examples if applicable\n\nCode examples make it easier for developers to understand and adopt the project.'
    })
  }

  // Check for missing badges
  if (!readmeContent.includes('![') && !readmeContent.includes('badge')) {
    suggestions.push({
      title: 'Add Status Badges to README',
      body: 'Consider adding status badges to the README to show:\n\n- Build status\n- Test coverage\n- Version information\n- License\n- Download count\n\nBadges provide quick visual indicators of project health and status.'
    })
  }

  // Check for TOC if README is long
  if (readmeContent.length > 2000 && !lowerContent.includes('table of contents') && !lowerContent.includes('toc')) {
    suggestions.push({
      title: 'Add Table of Contents',
      body: 'The README is quite long and would benefit from a table of contents for better navigation. This helps users quickly find the information they\'re looking for.\n\n**Suggested structure:**\n- Quick links to major sections\n- Nested structure for subsections\n- Auto-generated if possible'
    })
  }

  return suggestions.slice(0, 5) // Limit to 5 suggestions
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString()
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getAgentStatus(): string {
  if (!config.agentId) {
    return 'No agent created'
  }
  
  const agent = agentStore.agents.find(a => a.id === config.agentId)
  if (!agent) {
    return 'Agent not found'
  }
  
  return `${agent.name} (${agent.status})`
}
</script>

<style scoped>
.github-auto-issues {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.8rem;
}

.description {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
}

.connection-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #856404;
}

.warning-icon {
  font-size: 1.2rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.config-section, .status-section, .recent-issues-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-section h4, .status-section h4, .recent-issues-section h4 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.3rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-input, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-primary {
  background: #4F46E5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338CA;
}

.btn-secondary {
  background: #6B7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4B5563;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.status-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.status-label {
  font-weight: 600;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-indicator.enabled {
  color: #059669;
}

.status-indicator.disabled {
  color: #DC2626;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  color: #333;
}

.detail-item .label.error,
.detail-item .value.error {
  color: #DC2626;
}

.status-actions {
  display: flex;
  gap: 12px;
}

.btn-toggle {
  background: #F3F4F6;
  color: #374151;
}

.btn-toggle:hover:not(:disabled) {
  background: #E5E7EB;
}

.btn-action {
  background: #10B981;
  color: white;
}

.btn-action:hover:not(:disabled) {
  background: #059669;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.issue-title {
  font-weight: 600;
  color: #4F46E5;
  text-decoration: none;
  flex: 1;
}

.issue-title:hover {
  text-decoration: underline;
}

.issue-state {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.issue-state.open {
  background: #DBEAFE;
  color: #1E40AF;
}

.issue-state.closed {
  background: #F3E8FF;
  color: #7C3AED;
}

.issue-body {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.issue-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.issue-date {
  color: #888;
}

.issue-labels {
  display: flex;
  gap: 6px;
}

.label {
  padding: 2px 6px;
  border-radius: 3px;
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
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
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.test-success h4 {
  color: #059669;
  margin-bottom: 16px;
}

.test-error h4 {
  color: #DC2626;
  margin-bottom: 16px;
}

.analysis-preview {
  margin-top: 16px;
}

.analysis-preview h5 {
  margin-bottom: 8px;
  color: #333;
}

.analysis-preview pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .status-actions {
    flex-direction: column;
  }
  
  .issue-header {
    flex-direction: column;
    gap: 8px;
  }
}
</style>