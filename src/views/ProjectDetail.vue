<template>
  <div class="project-detail" v-if="project">
    <header class="project-header">
      <button @click="$router.back()" class="back-btn">
        ← Back
      </button>
      <div class="project-title">
        <h1>{{ project.name }}</h1>
        <span class="status-badge" :class="project.status">
          {{ project.status }}
        </span>
      </div>
      <div class="project-actions">
        <button @click="showEditDialog = true" class="btn-edit">
          Edit Project
        </button>
        <button @click="showAddContentDialog = true" class="btn-add">
          Add Content
        </button>
      </div>
    </header>

    <div class="project-content">
      <div class="project-tabs">
        <button 
          @click="activeTab = 'overview'" 
          :class="{ active: activeTab === 'overview' }"
          class="tab-btn"
        >
          📊 Overview
        </button>
        <button 
          @click="activeTab = 'tasks'" 
          :class="{ active: activeTab === 'tasks' }"
          class="tab-btn"
        >
          📋 Tasks
          <span v-if="taskStatistics" class="tab-badge">{{ taskStatistics.total }}</span>
        </button>
        <button 
          @click="activeTab = 'content'" 
          :class="{ active: activeTab === 'content' }"
          class="tab-btn"
        >
          📁 Content
          <span class="tab-badge">{{ project.content.length }}</span>
        </button>
        <button 
          @click="activeTab = 'agents'" 
          :class="{ active: activeTab === 'agents' }"
          class="tab-btn"
        >
          🤖 Agents
          <span class="tab-badge">{{ project.agents.length }}</span>
        </button>
      </div>

      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="project-info">
            <div class="info-section">
              <h3>Description</h3>
              <p>{{ project.description || 'No description provided' }}</p>
            </div>
            
            <div class="info-section">
              <h3>Project Details</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">Created:</span>
                  <span class="value">{{ formatDate(project.createdAt) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Last Updated:</span>
                  <span class="value">{{ formatDate(project.updatedAt) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Content Items:</span>
                  <span class="value">{{ project.content.length }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Assigned Agents:</span>
                  <span class="value">{{ project.agents.length }}</span>
                </div>
                <div class="detail-item" v-if="taskStatistics">
                  <span class="label">Total Tasks:</span>
                  <span class="value">{{ taskStatistics.total }}</span>
                </div>
                <div class="detail-item" v-if="taskStatistics">
                  <span class="label">Completed Tasks:</span>
                  <span class="value">{{ taskStatistics.completed }}</span>
                </div>
              </div>
            </div>

            <div class="info-section" v-if="taskStatistics">
              <h3>Task Progress</h3>
              <div class="progress-overview">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: taskStatistics.completionRate + '%' }"></div>
                </div>
                <span class="progress-text">{{ taskStatistics.completionRate }}% Complete</span>
              </div>
              
              <div class="task-summary">
                <div class="task-stat">
                  <span class="stat-number">{{ taskStatistics.todo }}</span>
                  <span class="stat-label">To Do</span>
                </div>
                <div class="task-stat">
                  <span class="stat-number">{{ taskStatistics.inProgress }}</span>
                  <span class="stat-label">In Progress</span>
                </div>
                <div class="task-stat">
                  <span class="stat-number">{{ taskStatistics.review }}</span>
                  <span class="stat-label">Review</span>
                </div>
                <div class="task-stat">
                  <span class="stat-number">{{ taskStatistics.completed }}</span>
                  <span class="stat-label">Done</span>
                </div>
                <div class="task-stat" v-if="taskStatistics.blocked > 0">
                  <span class="stat-number">{{ taskStatistics.blocked }}</span>
                  <span class="stat-label">Blocked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks Tab -->
        <div v-if="activeTab === 'tasks'" class="tab-panel">
          <TaskManager :project-id="project.id" />
        </div>

        <!-- Content Tab -->
        <div v-if="activeTab === 'content'" class="tab-panel">
          <div class="content-section">
            <h3>Project Content</h3>
            <div v-if="project.content.length > 0" class="content-grid">
              <div 
                v-for="content in project.content" 
                :key="content.id"
                class="content-card"
                :class="content.type"
              >
                <div class="content-header">
                  <div class="content-info">
                    <h4>{{ content.name }}</h4>
                    <span class="content-type">{{ content.type }}</span>
                  </div>
                  <div class="content-actions">
                    <button @click="editContent(content)" class="btn-small">Edit</button>
                    <button @click="deleteContent(content.id)" class="btn-small btn-danger">Delete</button>
                  </div>
                </div>
                <p class="content-path">{{ content.path }}</p>
                <p class="content-preview" v-if="content.content">
                  {{ content.content.substring(0, 100) }}{{ content.content.length > 100 ? '...' : '' }}
                </p>
                <div class="content-meta">
                  <span class="created-by">Created by: {{ content.createdBy }}</span>
                  <span class="created-date">{{ formatDate(content.createdAt) }}</span>
                </div>
              </div>
            </div>
            <p v-else class="no-content">No content in this project yet</p>
          </div>
        </div>

        <!-- Agents Tab -->
        <div v-if="activeTab === 'agents'" class="tab-panel">
          <div class="agents-section">
            <h3>Assigned Agents</h3>
            <div v-if="assignedAgents.length > 0" class="agents-grid">
              <div 
                v-for="agent in assignedAgents" 
                :key="agent.id"
                class="agent-card"
                :class="agent.status"
              >
                <div class="agent-header">
                  <h4>{{ agent.name }}</h4>
                  <span class="agent-status">{{ agent.status }}</span>
                </div>
                <p class="agent-description">{{ agent.description }}</p>
                <div class="agent-capabilities">
                  <span 
                    v-for="capability in agent.capabilities.filter(c => c.enabled)" 
                    :key="capability.type"
                    class="capability-tag"
                  >
                    {{ capability.type.replace('_', ' ') }}
                  </span>
                </div>
                <div class="agent-tasks">
                  <h5>Project Tasks</h5>
                  <ul>
                    <li v-for="task in project.tasks" :key="task.id">
                      <span :class="['task-status', task.status]">{{ task.status }}</span>
                      <span class="task-title">{{ task.title }}</span>
                    </li>
                  </ul>
                </div>
                <div class="agent-interval">
                  <label>Run every
                    <input type="number" v-model.number="agent.runInterval" min="5" max="3600" step="5" style="width: 60px;" />
                    seconds
                  </label>
                  <button class="btn-primary" @click="triggerAgent(agent)">Run Now</button>
                </div>
              </div>
            </div>
            <p v-else class="no-agents">No agents assigned to this project</p>

            <div class="unlinked-agents-section" v-if="unlinkedAgents.length > 0">
              <h3>Available Agents</h3>
              <div class="agents-grid">
                <div 
                  v-for="agent in unlinkedAgents" 
                  :key="agent.id"
                  class="agent-card"
                  :class="agent.status"
                >
                  <div class="agent-header">
                    <h4>{{ agent.name }}</h4>
                    <span class="agent-status">{{ agent.status }}</span>
                  </div>
                  <p class="agent-description">{{ agent.description }}</p>
                  <div class="agent-capabilities">
                    <span 
                      v-for="capability in agent.capabilities.filter(c => c.enabled)" 
                      :key="capability.type"
                      class="capability-tag"
                    >
                      {{ capability.type.replace('_', ' ') }}
                    </span>
                  </div>
                  <button class="btn-primary" @click="connectAgent(agent.id)">Connect to Project</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Content Dialog -->
    <div v-if="showAddContentDialog" class="modal-overlay" @click="closeAddContentDialog">
      <div class="modal" @click.stop>
        <h3>Add New Content</h3>
        <form @submit.prevent="addContent">
          <div class="form-group">
            <label for="contentName">Name:</label>
            <input 
              id="contentName"
              v-model="contentForm.name" 
              type="text" 
              required 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="contentType">Type:</label>
            <select 
              id="contentType"
              v-model="contentForm.type" 
              class="form-select"
            >
              <option value="file">File</option>
              <option value="folder">Folder</option>
              <option value="note">Note</option>
              <option value="code">Code</option>
              <option value="document">Document</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="contentPath">Path:</label>
            <input 
              id="contentPath"
              v-model="contentForm.path" 
              type="text" 
              required 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="contentContent">Content:</label>
            <textarea 
              id="contentContent"
              v-model="contentForm.content" 
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeAddContentDialog" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Add Content
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <div v-else class="not-found">
    <h2>Project Not Found</h2>
    <p>The project you're looking for doesn't exist.</p>
    <router-link to="/" class="btn-primary">Back to Projects</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import { useAgentStore } from '@/stores/agents'
import TaskManager from '@/components/TaskManager.vue'
import { openAIService } from '@/services/openai'
import type { ProjectContent } from '@/types'

const route = useRoute()
const projectStore = useProjectStore()
const agentStore = useAgentStore()

const showEditDialog = ref(false)
const showAddContentDialog = ref(false)
const activeTab = ref('overview')

const contentForm = reactive({
  name: '',
  type: 'file' as ProjectContent['type'],
  path: '',
  content: '',
})

const project = computed(() => 
  projectStore.getProjectById(route.params.id as string)
)

const assignedAgents = computed(() => 
  project.value ? agentStore.agents.filter(agent => 
    project.value!.agents.includes(agent.id)
  ) : []
)

const unlinkedAgents = computed(() =>
  project.value
    ? agentStore.agents.filter(agent => !project.value!.agents.includes(agent.id))
    : []
)

const taskStatistics = computed(() => 
  project.value ? projectStore.getTaskStatistics(project.value.id) : null
)

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function addContent() {
  if (project.value) {
    projectStore.addProjectContent(project.value.id, {
      projectId: project.value.id,
      type: contentForm.type,
      name: contentForm.name,
      path: contentForm.path,
      content: contentForm.content || undefined,
      createdBy: 'user'
    })
    closeAddContentDialog()
  }
}

function editContent(content: ProjectContent) {
  // TODO: Implement edit content functionality
  console.log('Edit content:', content)
}

function deleteContent(contentId: string) {
  if (project.value && confirm('Are you sure you want to delete this content?')) {
    // TODO: Implement delete content functionality
    console.log('Delete content:', contentId)
  }
}

function connectAgent(agentId: string) {
  if (project.value) {
    projectStore.updateProject(project.value.id, {
      agents: [...project.value.agents, agentId]
    })
  }
}

function triggerAgent(agent: any) {
  // Find the model to use for this agent
  const model = agent.config?.openaiModel || agent.config?.defaultModel || 'gpt-4';
  // Example: send a request to openAIService for this agent
  if (project.value) {
    // Compose a prompt with project tasks
    const prompt = `Project: ${project.value.name}\nTasks:\n` + project.value.tasks.map(t => `- [${t.status}] ${t.title}`).join('\n');
    // Call the OpenAI service (assume openAIService is globally available or imported)
    openAIService.chatCompletion([
      { role: 'system', content: `You are agent ${agent.name} working on project ${project.value.name}.` },
      { role: 'user', content: prompt }
    ], { model, maxTokens: 1000, temperature: 0.7 })
      .then(response => {
        // Optionally, handle the response (e.g., log, update agent state, create a comment)
        console.log(`Agent ${agent.name} response:`, response.content);
        // You could add a comment to a task, update agent status, etc.
      })
      .catch(error => {
        console.error(`Agent ${agent.name} failed:`, error);
      });
  }
}

function closeAddContentDialog() {
  showAddContentDialog.value = false
  contentForm.name = ''
  contentForm.type = 'file'
  contentForm.path = ''
  contentForm.content = ''
}

onMounted(() => {
  if (!project.value) {
    console.warn('Project not found:', route.params.id)
  }
})
</script>

<style scoped>
.project-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.project-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.back-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  color: #667eea;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.project-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.project-title h1 {
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.paused {
  background: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.archived {
  background: #e2e3e5;
  color: #383d41;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-add {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-edit {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.btn-add {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.btn-edit:hover, .btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.project-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.project-tabs {
  display: flex;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  color: #333;
  font-weight: 600;
}

.agents-grid, .content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.agent-card, .content-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.agent-card:hover, .content-card:hover {
  transform: translateY(-2px);
}

.agent-header, .content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.agent-header h4, .content-header h4 {
  margin: 0;
  color: #333;
}

.agent-status, .content-type {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.agent-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.capability-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.content-path {
  color: #666;
  font-size: 0.85rem;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.content-preview {
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.content-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
}

.content-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.8rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.btn-small.btn-danger {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.no-agents, .no-content {
  text-align: center;
  color: #666;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.not-found h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
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
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Tab styling */
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #f0f0f0;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.tab-btn:hover {
  color: #333;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px 8px 0 0;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.tab-btn.active .tab-badge {
  background: white;
  color: #667eea;
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress styling */
.progress-overview {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #667eea;
  min-width: fit-content;
}

.task-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.task-stat {
  text-align: center;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

/* Detail grid improvements */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  font-weight: 600;
  color: #333;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .tabs {
    gap: 0.5rem;
  }
  
  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .task-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>