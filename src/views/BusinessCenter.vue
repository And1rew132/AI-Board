<template>
  <div class="business-center" role="main" aria-labelledby="business-center-title">
    <!-- Page Header with improved accessibility -->
    <header class="business-header">
      <div class="business-header-content">
        <h1 id="business-center-title" class="business-title">
          <span class="business-icon" aria-hidden="true">🎯</span>
          Business Center
        </h1>
        <p class="business-subtitle">
          Orchestrate workflows, monitor processes, and optimize business operations
        </p>
      </div>
      
      <div class="business-actions">
        <button 
          @click="refreshData" 
          class="action-btn action-btn--secondary"
          aria-label="Refresh business data"
        >
          <span aria-hidden="true">🔄</span>
          Refresh
        </button>
        <button 
          @click="showWorkflowCreator = true" 
          class="action-btn action-btn--primary"
          aria-label="Create new workflow"
        >
          <span aria-hidden="true">➕</span>
          New Workflow
        </button>
        <button 
          @click="showProcessCreator = true" 
          class="action-btn action-btn--accent"
          aria-label="Create new business process"
        >
          <span aria-hidden="true">🏢</span>
          New Process
        </button>
      </div>
    </header>

    <!-- Key Metrics Overview with better visual hierarchy -->
    <section class="metrics-section" aria-labelledby="metrics-title">
      <h2 id="metrics-title" class="section-title sr-only">Business Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card" role="group" aria-labelledby="metric-messages">
          <div class="metric-visual">
            <span class="metric-icon" aria-hidden="true">💬</span>
          </div>
          <div class="metric-content">
            <h3 id="metric-messages" class="metric-value">{{ metrics?.totalMessages || 0 }}</h3>
            <p class="metric-label">Agent Messages</p>
            <span class="metric-trend metric-trend--positive" aria-label="Trending up">+12%</span>
          </div>
        </div>
        
        <div class="metric-card" role="group" aria-labelledby="metric-workflows">
          <div class="metric-visual">
            <span class="metric-icon" aria-hidden="true">⚡</span>
          </div>
          <div class="metric-content">
            <h3 id="metric-workflows" class="metric-value">{{ metrics?.activeWorkflows || 0 }}</h3>
            <p class="metric-label">Active Workflows</p>
            <span class="metric-trend metric-trend--neutral" aria-label="No change">→</span>
          </div>
        </div>
        
        <div class="metric-card" role="group" aria-labelledby="metric-completed">
          <div class="metric-visual">
            <span class="metric-icon" aria-hidden="true">✅</span>
          </div>
          <div class="metric-content">
            <h3 id="metric-completed" class="metric-value">{{ metrics?.completedWorkflows || 0 }}</h3>
            <p class="metric-label">Completed Today</p>
            <span class="metric-trend metric-trend--positive" aria-label="Trending up">+5</span>
          </div>
        </div>
        
        <div class="metric-card" role="group" aria-labelledby="metric-efficiency">
          <div class="metric-visual">
            <span class="metric-icon" aria-hidden="true">📈</span>
          </div>
          <div class="metric-content">
            <h3 id="metric-efficiency" class="metric-value">94%</h3>
            <p class="metric-label">Efficiency Score</p>
            <span class="metric-trend metric-trend--positive" aria-label="Trending up">+2%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Grid with improved layout -->
    <div class="business-content">
      <!-- Active Workflows Panel -->
      <section class="content-panel" aria-labelledby="workflows-title">
        <header class="panel-header">
          <h2 id="workflows-title" class="panel-title">
            <span aria-hidden="true">⚡</span>
            Active Workflows
          </h2>
          <button 
            class="panel-action"
            @click="navigateToWorkflows"
            aria-label="View all workflows"
          >
            View All
          </button>
        </header>
        
        <div class="panel-content">
          <div v-if="runningExecutions.length > 0" class="workflow-list">
            <div 
              v-for="execution in runningExecutions.slice(0, 3)" 
              :key="execution.id"
              class="workflow-item"
              @click="selectExecution(execution)"
              :aria-label="`Workflow: ${getWorkflowName(execution.workflowId)}, ${getExecutionProgress(execution)}% complete`"
              role="button"
              tabindex="0"
              @keyup.enter="selectExecution(execution)"
              @keyup.space="selectExecution(execution)"
            >
              <div class="workflow-header">
                <h3 class="workflow-name">{{ getWorkflowName(execution.workflowId) }}</h3>
                <span class="status-badge status-badge--running">{{ execution.status }}</span>
              </div>
              <div class="workflow-progress">
                <div class="progress-bar" role="progressbar" :aria-valuenow="getExecutionProgress(execution)" aria-valuemin="0" aria-valuemax="100">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${getExecutionProgress(execution)}%` }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ execution.metrics.completedSteps }}/{{ execution.metrics.totalSteps }} steps
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-state-visual">
              <span aria-hidden="true">⚡</span>
            </div>
            <h3 class="empty-state-title">No Active Workflows</h3>
            <p class="empty-state-message">Create your first workflow to start automating business processes.</p>
            <button 
              @click="showWorkflowCreator = true"
              class="action-btn action-btn--primary action-btn--small"
            >
              <span aria-hidden="true">➕</span>
              Create Workflow
            </button>
          </div>
        </div>
      </section>

      <!-- Recent Activity Panel -->
      <section class="content-panel" aria-labelledby="activity-title">
        <header class="panel-header">
          <h2 id="activity-title" class="panel-title">
            <span aria-hidden="true">🤖</span>
            Recent Activity
          </h2>
          <button 
            class="panel-action"
            @click="navigateToActivity"
            aria-label="View all activity"
          >
            View All
          </button>
        </header>
        
        <div class="panel-content">
          <div v-if="recentMessages.length > 0" class="activity-feed">
            <div 
              v-for="message in recentMessages.slice(0, 4)" 
              :key="message.id"
              class="activity-item"
            >
              <div class="activity-header">
                <span class="agent-badge">{{ getAgentName(message.fromAgentId) }}</span>
                <span class="activity-arrow" aria-hidden="true">→</span>
                <span class="agent-badge">{{ getAgentName(message.toAgentId) }}</span>
                <time class="activity-time" :datetime="new Date(message.createdAt).toISOString()">
                  {{ formatTime(message.createdAt) }}
                </time>
              </div>
              <div class="activity-content">
                <h4 class="activity-subject">{{ message.subject }}</h4>
                <p class="activity-body">{{ truncateText(message.content, 60) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-state-visual">
              <span aria-hidden="true">🤖</span>
            </div>
            <h3 class="empty-state-title">No Recent Activity</h3>
            <p class="empty-state-message">Agent activity will appear here once workflows are running.</p>
          </div>
        </div>
      </section>

      <!-- Business Processes Panel -->
      <section class="content-panel content-panel--full" aria-labelledby="processes-title">
        <header class="panel-header">
          <h2 id="processes-title" class="panel-title">
            <span aria-hidden="true">🏢</span>
            Business Processes
          </h2>
          <button 
            class="panel-action"
            @click="navigateToProcesses"
            aria-label="View all business processes"
          >
            View All
          </button>
        </header>
        
        <div class="panel-content">
          <div v-if="businessProcesses.length > 0" class="process-grid">
            <div 
              v-for="process in businessProcesses.slice(0, 6)" 
              :key="process.id"
              class="process-card"
              @click="executeProcess(process.id)"
              :aria-label="`Execute ${process.name} process`"
              role="button"
              tabindex="0"
              @keyup.enter="executeProcess(process.id)"
              @keyup.space="executeProcess(process.id)"
            >
              <div class="process-header">
                <h3 class="process-name">{{ process.name }}</h3>
                <span class="process-category">{{ process.category }}</span>
              </div>
              <p class="process-description">{{ truncateText(process.description, 80) }}</p>
              <div class="process-stats">
                <div class="stat-item">
                  <span class="stat-label">Success Rate</span>
                  <span class="stat-value">{{ Math.round((process.metrics?.successRate || 0) * 100) }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Avg Duration</span>
                  <span class="stat-value">{{ formatDuration(process.metrics?.averageDuration || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-state-visual">
              <span aria-hidden="true">🏢</span>
            </div>
            <h3 class="empty-state-title">No Business Processes</h3>
            <p class="empty-state-message">Set up automated business processes to streamline operations and improve efficiency.</p>
            <button 
              @click="showProcessCreator = true"
              class="action-btn action-btn--primary action-btn--small"
            >
              <span aria-hidden="true">🏢</span>
              Create Process
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Quick Actions Section -->
    <section class="quick-actions" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" class="section-title">Quick Start</h2>
      <div class="quick-actions-grid">
        <button 
          @click="createFromTemplate('customer-support')"
          class="quick-action-card"
          aria-label="Create customer support workflow"
        >
          <span class="quick-action-icon" aria-hidden="true">🎧</span>
          <h3 class="quick-action-title">Customer Support</h3>
          <p class="quick-action-description">Automated ticket processing</p>
        </button>
        
        <button 
          @click="createFromTemplate('content-creation')"
          class="quick-action-card"
          aria-label="Create content creation workflow"
        >
          <span class="quick-action-icon" aria-hidden="true">📝</span>
          <h3 class="quick-action-title">Content Creation</h3>
          <p class="quick-action-description">End-to-end content pipeline</p>
        </button>
        
        <button 
          @click="createFromTemplate('data-analysis')"
          class="quick-action-card"
          aria-label="Create data analysis workflow"
        >
          <span class="quick-action-icon" aria-hidden="true">📊</span>
          <h3 class="quick-action-title">Data Analysis</h3>
          <p class="quick-action-description">Automated reporting system</p>
        </button>
        
        <button 
          @click="navigateToTemplates"
          class="quick-action-card quick-action-card--browse"
          aria-label="Browse all workflow templates"
        >
          <span class="quick-action-icon" aria-hidden="true">📋</span>
          <h3 class="quick-action-title">Browse Templates</h3>
          <p class="quick-action-description">Explore all options</p>
        </button>
      </div>
    </section>

    <!-- Modals for workflow and process creation -->
    <div v-if="showWorkflowCreator" class="modal-overlay" @click="showWorkflowCreator = false" role="dialog" aria-modal="true" aria-labelledby="workflow-modal-title">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2 id="workflow-modal-title" class="modal-title">Create New Workflow</h2>
          <button @click="showWorkflowCreator = false" class="modal-close" aria-label="Close modal">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div class="modal-body">
          <WorkflowCreator @workflow-created="onWorkflowCreated" />
        </div>
      </div>
    </div>

    <div v-if="showProcessCreator" class="modal-overlay" @click="showProcessCreator = false" role="dialog" aria-modal="true" aria-labelledby="process-modal-title">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2 id="process-modal-title" class="modal-title">Create Business Process</h2>
          <button @click="showProcessCreator = false" class="modal-close" aria-label="Close modal">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div class="modal-body">
          <BusinessProcessCreator @process-created="onProcessCreated" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrchestrationStore } from '@/stores/orchestration'
import { useAgentStore } from '@/stores/agents'
import type { WorkflowExecution } from '@/types'
import WorkflowCreator from '@/components/WorkflowCreator.vue'
import BusinessProcessCreator from '@/components/BusinessProcessCreator.vue'

const router = useRouter()
const orchestrationStore = useOrchestrationStore()
const agentStore = useAgentStore()

// Component state
const showWorkflowCreator = ref(false)
const showProcessCreator = ref(false)
const selectedExecution = ref<WorkflowExecution | null>(null)

// Computed properties
const metrics = computed(() => orchestrationStore.metrics)
const recentMessages = computed(() => orchestrationStore.recentMessages)
const runningExecutions = computed(() => orchestrationStore.runningExecutions)
const businessProcesses = computed(() => orchestrationStore.activeBusinessProcesses)

// Methods
function getAgentName(agentId: string): string {
  if (agentId === 'orchestrator') return 'Orchestrator'
  const agent = agentStore.agents.find(a => a.id === agentId)
  return agent?.name || `Agent ${agentId.slice(0, 8)}`
}

function getWorkflowName(workflowId: string): string {
  const workflow = orchestrationStore.workflows.find(w => w.id === workflowId)
  return workflow?.name || `Workflow ${workflowId.slice(0, 8)}`
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  return `${Math.round(ms / 3600000)}h`
}

function getExecutionProgress(execution: WorkflowExecution): number {
  if (execution.metrics.totalSteps === 0) return 0
  return Math.round((execution.metrics.completedSteps / execution.metrics.totalSteps) * 100)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function selectExecution(execution: WorkflowExecution) {
  selectedExecution.value = execution
  // Could navigate to detailed view or show modal
}

async function executeProcess(processId: string) {
  try {
    await orchestrationStore.executeBusinessProcess(processId)
    await refreshData()
  } catch (error) {
    console.error('Error executing business process:', error)
  }
}

async function createFromTemplate(templateName: string) {
  try {
    await orchestrationStore.createWorkflowFromTemplate(templateName)
    await refreshData()
  } catch (error) {
    console.error('Error creating workflow from template:', error)
  }
}

async function refreshData() {
  orchestrationStore.syncData()
  await orchestrationStore.refreshMetrics()
}

function onWorkflowCreated() {
  showWorkflowCreator.value = false
  refreshData()
}

function onProcessCreated() {
  showProcessCreator.value = false
  refreshData()
}

// Navigation methods
function navigateToWorkflows() {
  router.push('/orchestration/workflows')
}

function navigateToActivity() {
  router.push('/orchestration/activity')
}

function navigateToProcesses() {
  router.push('/orchestration/processes')
}

function navigateToTemplates() {
  router.push('/orchestration/templates')
}

// Lifecycle
onMounted(() => {
  // Initialize demo data for demonstration
  orchestrationStore.initializeDemoData()
  refreshData()
  
  // Auto-refresh every 30 seconds (less frequent than original)
  setInterval(refreshData, 30000)
})
</script>

<style scoped>
.business-center {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Header Styles */
.business-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  color: white;
}

.business-header-content {
  flex: 1;
}

.business-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.business-icon {
  font-size: 2rem;
}

.business-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

.business-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Action Button Styles */
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-btn--primary {
  background: #10b981;
  color: white;
}

.action-btn--primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.action-btn--secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn--accent {
  background: #f59e0b;
  color: white;
}

.action-btn--accent:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.action-btn--small {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-visual {
  flex-shrink: 0;
}

.metric-icon {
  font-size: 2rem;
  display: block;
}

.metric-content {
  flex: 1;
  position: relative;
}

.metric-value {
  margin: 0 0 0.25rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.metric-label {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.metric-trend {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.metric-trend--positive {
  background: #dcfce7;
  color: #15803d;
}

.metric-trend--neutral {
  background: #f3f4f6;
  color: #6b7280;
}

/* Content Grid */
.business-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.content-panel {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.content-panel--full {
  grid-column: 1 / -1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.panel-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-action {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.panel-action:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.panel-content {
  padding: 1.5rem;
}

/* Workflow Styles */
.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workflow-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workflow-item:hover,
.workflow-item:focus {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  outline: none;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.workflow-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge--running {
  background: #fef3c7;
  color: #d97706;
}

.workflow-progress {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-bar {
  height: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Activity Styles */
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  border-left: 3px solid #e5e7eb;
  padding-left: 1rem;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.agent-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.activity-arrow {
  color: #9ca3af;
}

.activity-time {
  color: #6b7280;
  margin-left: auto;
}

.activity-subject {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.activity-body {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Process Styles */
.process-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.process-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.process-card:hover,
.process-card:focus {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  outline: none;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.process-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.process-category {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.process-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.process-stats {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

/* Empty State Styles */
.empty-state {
  text-align: center;
  padding: 2rem;
}

.empty-state-visual {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.empty-state-message {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Quick Actions Section */
.quick-actions {
  margin-top: 2rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #374151;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.quick-action-card:hover,
.quick-action-card:focus {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  outline: none;
}

.quick-action-card--browse {
  border-style: dashed;
  border-color: #9ca3af;
}

.quick-action-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.75rem;
}

.quick-action-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.quick-action-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .business-content {
    grid-template-columns: 1fr;
  }
  
  .content-panel--full {
    grid-column: 1;
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .business-center {
    padding: 1rem;
  }
  
  .business-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .business-actions {
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .business-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .process-grid {
    grid-template-columns: 1fr;
  }
  
  .process-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .business-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    justify-content: center;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>