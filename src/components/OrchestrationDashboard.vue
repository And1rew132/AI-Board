<template>
  <div class="orchestration-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>🎯 Business Orchestration Center</h1>
      <p>Coordinate agents, workflows, and business processes in real-time</p>
      
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-primary">
          🔄 Refresh
        </button>
        <button @click="showWorkflowCreator = true" class="btn btn-success">
          ➕ New Workflow
        </button>
        <button @click="showBusinessProcessCreator = true" class="btn btn-info">
          🏢 New Business Process
        </button>
      </div>
    </div>

    <!-- Metrics Overview -->
    <div class="metrics-grid" v-if="metrics">
      <div class="metric-card">
        <div class="metric-icon">💬</div>
        <div class="metric-content">
          <h3>{{ metrics.totalMessages }}</h3>
          <p>Agent Messages</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">⚡</div>
        <div class="metric-content">
          <h3>{{ metrics.activeWorkflows }}</h3>
          <p>Active Workflows</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">✅</div>
        <div class="metric-content">
          <h3>{{ metrics.completedWorkflows }}</h3>
          <p>Completed Workflows</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-content">
          <h3>{{ formatDuration(metrics.averageWorkflowDuration) }}</h3>
          <p>Avg Duration</p>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Recent Agent Activity -->
      <div class="dashboard-card">
        <h2>🤖 Recent Agent Activity</h2>
        <div class="activity-feed">
          <div 
            v-for="message in recentMessages" 
            :key="message.id"
            class="activity-item"
            :class="`status-${message.status}`"
          >
            <div class="activity-header">
              <span class="agent-badge">{{ getAgentName(message.fromAgentId) }}</span>
              <span class="arrow">→</span>
              <span class="agent-badge">{{ getAgentName(message.toAgentId) }}</span>
              <span class="timestamp">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="activity-content">
              <strong>{{ message.subject }}</strong>
              <p>{{ message.content }}</p>
            </div>
            <div class="activity-status">
              <span class="status-badge" :class="message.status">{{ message.status }}</span>
              <span class="priority-badge" :class="message.priority">{{ message.priority }}</span>
            </div>
          </div>
          <div v-if="recentMessages.length === 0" class="empty-state">
            No recent agent activity
          </div>
        </div>
      </div>

      <!-- Active Workflows -->
      <div class="dashboard-card">
        <h2>⚡ Running Workflows</h2>
        <div class="workflow-list">
          <div 
            v-for="execution in runningExecutions" 
            :key="execution.id"
            class="workflow-item"
            @click="selectExecution(execution)"
          >
            <div class="workflow-header">
              <h3>{{ getWorkflowName(execution.workflowId) }}</h3>
              <span class="status-badge running">{{ execution.status }}</span>
            </div>
            <div class="workflow-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${getExecutionProgress(execution)}%` }"
                ></div>
              </div>
              <span class="progress-text">
                {{ execution.metrics.completedSteps }}/{{ execution.metrics.totalSteps }} steps
              </span>
            </div>
            <div class="workflow-meta">
              <span>Started: {{ formatTime(execution.startedAt) }}</span>
              <span v-if="execution.currentStepId">Step: {{ getStepName(execution.currentStepId) }}</span>
            </div>
          </div>
          <div v-if="runningExecutions.length === 0" class="empty-state">
            No workflows currently running
          </div>
        </div>
      </div>

      <!-- Business Processes -->
      <div class="dashboard-card">
        <h2>🏢 Business Processes</h2>
        <div class="process-grid">
          <div 
            v-for="process in activeBusinessProcesses" 
            :key="process.id"
            class="process-card"
            @click="executeProcess(process.id)"
          >
            <div class="process-header">
              <h3>{{ process.name }}</h3>
              <div class="process-category">{{ process.category }}</div>
            </div>
            <p class="process-description">{{ process.description }}</p>
            <div class="process-metrics">
              <div class="metric-row">
                <span>Executions:</span>
                <span>{{ process.metrics.totalExecutions }}</span>
              </div>
              <div class="metric-row">
                <span>Success Rate:</span>
                <span>{{ Math.round(process.metrics.successRate * 100) }}%</span>
              </div>
              <div class="metric-row">
                <span>Avg Duration:</span>
                <span>{{ formatDuration(process.metrics.averageDuration) }}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary">Execute Process</button>
          </div>
          <div v-if="activeBusinessProcesses.length === 0" class="empty-state">
            No business processes configured
          </div>
        </div>
      </div>

      <!-- Agent Capability Registry -->
      <div class="dashboard-card">
        <h2>🔧 Agent Capabilities</h2>
        <div class="capability-registry">
          <div 
            v-for="capability in capabilityRegistry" 
            :key="capability.capability"
            class="capability-item"
          >
            <div class="capability-header">
              <h3>{{ capability.capability }}</h3>
              <span class="agent-count">{{ capability.agentIds.length }} agents</span>
            </div>
            <p class="capability-description">{{ capability.description }}</p>
            <div class="agent-list">
              <span 
                v-for="agentId in capability.agentIds" 
                :key="agentId"
                class="agent-chip"
              >
                {{ getAgentName(agentId) }}
              </span>
            </div>
          </div>
          <div v-if="capabilityRegistry.length === 0" class="empty-state">
            No capabilities registered yet
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Templates -->
    <div class="templates-section">
      <h2>📋 Quick Start Templates</h2>
      <div class="template-grid">
        <div 
          v-for="template in workflowTemplates" 
          :key="template.name"
          class="template-card"
          @click="createFromTemplate(template.name)"
        >
          <div class="template-header">
            <h3>{{ template.name }}</h3>
            <div class="template-category">{{ template.category }}</div>
          </div>
          <p class="template-description">{{ template.description }}</p>
          <div class="template-meta">
            <span>{{ template.steps.length }} steps</span>
            <span>{{ template.triggers.length }} triggers</span>
          </div>
          <button class="btn btn-outline">Use Template</button>
        </div>
      </div>
    </div>

    <!-- Selected Execution Details Modal -->
    <div v-if="selectedExecution" class="modal-overlay" @click="selectedExecution = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Workflow Execution Details</h2>
          <button @click="selectedExecution = null" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="execution-overview">
            <h3>{{ getWorkflowName(selectedExecution.workflowId) }}</h3>
            <div class="execution-meta">
              <span>Status: <strong>{{ selectedExecution.status }}</strong></span>
              <span>Started: {{ formatDateTime(selectedExecution.startedAt) }}</span>
              <span v-if="selectedExecution.completedAt">
                Completed: {{ formatDateTime(selectedExecution.completedAt) }}
              </span>
            </div>
          </div>
          
          <div class="steps-timeline">
            <h4>Execution Steps</h4>
            <div 
              v-for="step in selectedExecution.steps" 
              :key="step.stepId"
              class="timeline-item"
              :class="`status-${step.status}`"
            >
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <h5>{{ getStepName(step.stepId) }}</h5>
                <div class="step-meta">
                  <span>Status: {{ step.status }}</span>
                  <span v-if="step.assignedAgentId">
                    Agent: {{ getAgentName(step.assignedAgentId) }}
                  </span>
                  <span v-if="step.duration">
                    Duration: {{ formatDuration(step.duration) }}
                  </span>
                </div>
                <div v-if="step.errorMessage" class="error-message">
                  Error: {{ step.errorMessage }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Creator Modal -->
    <div v-if="showWorkflowCreator" class="modal-overlay" @click="showWorkflowCreator = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Create New Workflow</h2>
          <button @click="showWorkflowCreator = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <WorkflowCreator @workflow-created="onWorkflowCreated" />
        </div>
      </div>
    </div>

    <!-- Business Process Creator Modal -->
    <div v-if="showBusinessProcessCreator" class="modal-overlay" @click="showBusinessProcessCreator = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Create Business Process</h2>
          <button @click="showBusinessProcessCreator = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <BusinessProcessCreator @process-created="onProcessCreated" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useOrchestrationStore } from '@/stores/orchestration';
import { useAgentStore } from '@/stores/agents';
import type { WorkflowExecution } from '@/types';
import WorkflowCreator from './WorkflowCreator.vue';
import BusinessProcessCreator from './BusinessProcessCreator.vue';

const orchestrationStore = useOrchestrationStore();
const agentStore = useAgentStore();

// Component state
const selectedExecution = ref<WorkflowExecution | null>(null);
const showWorkflowCreator = ref(false);
const showBusinessProcessCreator = ref(false);

// Computed properties
const metrics = computed(() => orchestrationStore.metrics);
const recentMessages = computed(() => orchestrationStore.recentMessages);
const runningExecutions = computed(() => orchestrationStore.runningExecutions);
const activeBusinessProcesses = computed(() => orchestrationStore.activeBusinessProcesses);
const capabilityRegistry = computed(() => orchestrationStore.capabilityRegistry);
const workflowTemplates = computed(() => orchestrationStore.getWorkflowTemplates());

// Methods
function getAgentName(agentId: string): string {
  if (agentId === 'orchestrator') return 'Orchestrator';
  const agent = agentStore.agents.find(a => a.id === agentId);
  return agent?.name || `Agent ${agentId.slice(0, 8)}`;
}

function getWorkflowName(workflowId: string): string {
  const workflow = orchestrationStore.workflows.find(w => w.id === workflowId);
  return workflow?.name || `Workflow ${workflowId.slice(0, 8)}`;
}

function getStepName(stepId: string): string {
  // Find step name across all workflows
  for (const workflow of orchestrationStore.workflows) {
    const step = workflow.steps.find(s => s.id === stepId);
    if (step) return step.name;
  }
  return `Step ${stepId.slice(0, 8)}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

function getExecutionProgress(execution: WorkflowExecution): number {
  if (execution.metrics.totalSteps === 0) return 0;
  return (execution.metrics.completedSteps / execution.metrics.totalSteps) * 100;
}

function selectExecution(execution: WorkflowExecution) {
  selectedExecution.value = execution;
}

async function executeProcess(processId: string) {
  try {
    await orchestrationStore.executeBusinessProcess(processId);
    await refreshData();
  } catch (error) {
    console.error('Error executing business process:', error);
  }
}

async function createFromTemplate(templateName: string) {
  try {
    await orchestrationStore.createWorkflowFromTemplate(templateName);
    await refreshData();
  } catch (error) {
    console.error('Error creating workflow from template:', error);
  }
}

async function refreshData() {
  orchestrationStore.syncData();
  await orchestrationStore.refreshMetrics();
}

function onWorkflowCreated() {
  showWorkflowCreator.value = false;
  refreshData();
}

function onProcessCreated() {
  showBusinessProcessCreator.value = false;
  refreshData();
}

// Lifecycle
onMounted(() => {
  refreshData();
  
  // Auto-refresh every 10 seconds
  setInterval(refreshData, 10000);
});
</script>

<style scoped>
.orchestration-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-content h3 {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.metric-content p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.dashboard-card h2 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.2rem;
}

.activity-feed {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.activity-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.agent-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.arrow {
  color: #9ca3af;
}

.timestamp {
  color: #6b7280;
  margin-left: auto;
}

.activity-content p {
  margin: 0.5rem 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.activity-status {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.sent { background: #dbeafe; color: #1d4ed8; }
.status-badge.delivered { background: #dcfce7; color: #15803d; }
.status-badge.read { background: #f3e8ff; color: #7c3aed; }
.status-badge.running { background: #fef3c7; color: #d97706; }

.priority-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.priority-badge.urgent { background: #fee2e2; color: #dc2626; }
.priority-badge.high { background: #fed7aa; color: #ea580c; }
.priority-badge.medium { background: #fef3c7; color: #d97706; }
.priority-badge.low { background: #d1fae5; color: #059669; }

.workflow-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.workflow-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #c7d2fe;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.workflow-header h3 {
  margin: 0;
  color: #374151;
}

.workflow-progress {
  margin-bottom: 0.75rem;
}

.progress-bar {
  background: #f3f4f6;
  border-radius: 0.25rem;
  height: 0.5rem;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
}

.workflow-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.process-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.process-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #c7d2fe;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
}

.process-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1rem;
}

.process-category {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.process-description {
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.process-metrics {
  margin: 1rem 0;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.metric-row span:first-child {
  color: #6b7280;
}

.metric-row span:last-child {
  font-weight: 500;
  color: #374151;
}

.capability-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.capability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.capability-header h3 {
  margin: 0;
  color: #374151;
  font-size: 1rem;
}

.agent-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.capability-description {
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.agent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.agent-chip {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.templates-section {
  margin-top: 2rem;
}

.templates-section h2 {
  color: #374151;
  margin-bottom: 1rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.template-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #c7d2fe;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.template-header h3 {
  margin: 0;
  color: #374151;
}

.template-category {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.template-description {
  color: #6b7280;
  margin: 0.5rem 0 1rem 0;
  font-size: 0.9rem;
}

.template-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-content.large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.steps-timeline {
  margin-top: 1.5rem;
}

.steps-timeline h4 {
  margin: 0 0 1rem 0;
  color: #374151;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 2rem;
  bottom: -1rem;
  width: 2px;
  background: #e5e7eb;
}

.timeline-marker {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.status-pending .timeline-marker { background: #f3f4f6; }
.status-running .timeline-marker { background: #fbbf24; }
.status-completed .timeline-marker { background: #10b981; }
.status-failed .timeline-marker { background: #ef4444; }
.status-skipped .timeline-marker { background: #6b7280; }

.timeline-content {
  flex: 1;
}

.timeline-content h5 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.step-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

/* Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover {
  background: #047857;
}

.btn-info {
  background: #0891b2;
  color: white;
}

.btn-info:hover {
  background: #0e7490;
}

.btn-outline {
  background: transparent;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background: #4f46e5;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}
</style>