<template>
  <div class="task-manager">
    <div class="task-header">
      <div class="header-left">
        <h3>Project Tasks</h3>
        <div class="task-stats" v-if="statistics">
          <span class="stat-item">
            <span class="stat-value">{{ statistics.total }}</span>
            <span class="stat-label">Total</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ statistics.completed }}</span>
            <span class="stat-label">Completed</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ statistics.completionRate }}%</span>
            <span class="stat-label">Progress</span>
          </span>
        </div>
      </div>
      
      <div class="header-actions">
        <div class="view-toggles">
          <button 
            @click="viewMode = 'list'" 
            :class="{ active: viewMode === 'list' }"
            class="view-btn"
          >
            📋 List
          </button>
          <button 
            @click="viewMode = 'kanban'" 
            :class="{ active: viewMode === 'kanban' }"
            class="view-btn"
          >
            🔄 Kanban
          </button>
        </div>
        
        <button @click="showCreateTask = true" class="create-task-btn">
          + Add Task
        </button>
      </div>
    </div>

    <div class="task-filters">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Priority:</label>
        <select v-model="filterPriority" class="filter-select">
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Assignee:</label>
        <select v-model="filterAssignee" class="filter-select">
          <option value="">All Assignees</option>
          <option value="user">User</option>
          <option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">
            {{ agent.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <input 
          v-model="searchQuery" 
          placeholder="Search tasks..." 
          class="search-input"
        />
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="task-list">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <p>No tasks found</p>
        <button @click="showCreateTask = true" class="create-first-task-btn">
          Create your first task
        </button>
      </div>

      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        class="task-item"
        :class="{ 'task-done': task.status === 'done' }"
        @click="selectTask(task)"
      >
        <div class="task-priority" :class="`priority-${task.priority}`"></div>
        
        <div class="task-content">
          <div class="task-main">
            <h4 class="task-title">{{ task.title }}</h4>
            <p class="task-description">{{ task.description }}</p>
          </div>
          
          <div class="task-meta">
            <span class="task-type" :class="`type-${task.type}`">
              {{ formatTaskType(task.type) }}
            </span>
            <span class="task-status" :class="`status-${task.status}`">
              {{ formatTaskStatus(task.status) }}
            </span>
            <span v-if="task.assigneeName" class="task-assignee">
              👤 {{ task.assigneeName }}
            </span>
            <span v-if="task.dueDate" class="task-due-date" :class="{ overdue: isOverdue(task.dueDate) }">
              📅 {{ formatDate(task.dueDate) }}
            </span>
          </div>
        </div>

        <div class="task-actions">
          <button @click.stop="editTask(task)" class="edit-btn">✏️</button>
          <button @click.stop="deleteTaskHandler(task.id)" class="delete-btn">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Kanban View -->
    <div v-if="viewMode === 'kanban'" class="kanban-board">
      <div 
        v-for="status in kanbanColumns" 
        :key="status.key"
        class="kanban-column"
      >
        <div class="column-header">
          <h4>{{ status.title }}</h4>
          <span class="task-count">{{ getTasksByStatus(status.key).length }}</span>
        </div>
        
        <div class="column-tasks">
          <div 
            v-for="task in getTasksByStatus(status.key)" 
            :key="task.id"
            class="kanban-task"
            :class="`priority-${task.priority}`"
            @click="selectTask(task)"
          >
            <div class="kanban-task-header">
              <span class="task-type-badge" :class="`type-${task.type}`">
                {{ task.type.charAt(0).toUpperCase() }}
              </span>
              <span class="task-priority-badge" :class="`priority-${task.priority}`">
                {{ task.priority.charAt(0).toUpperCase() }}
              </span>
            </div>
            
            <h5 class="kanban-task-title">{{ task.title }}</h5>
            <p class="kanban-task-description">{{ task.description }}</p>
            
            <div class="kanban-task-footer">
              <span v-if="task.assigneeName" class="kanban-assignee">
                👤 {{ task.assigneeName }}
              </span>
              <span v-if="task.dueDate" class="kanban-due-date" :class="{ overdue: isOverdue(task.dueDate) }">
                📅 {{ formatDate(task.dueDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Modal -->
    <div v-if="showCreateTask || editingTask" class="modal-overlay" @click="closeModal">
      <div class="task-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTask ? 'Edit Task' : 'Create New Task' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveTask" class="task-form">
          <div class="form-row">
            <div class="form-group">
              <label for="taskTitle">Title *</label>
              <input 
                id="taskTitle"
                v-model="taskForm.title" 
                type="text" 
                required 
                class="form-input"
                placeholder="Task title..."
              />
            </div>
            
            <div class="form-group">
              <label for="taskType">Type</label>
              <select id="taskType" v-model="taskForm.type" class="form-select">
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="documentation">Documentation</option>
                <option value="research">Research</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="taskDescription">Description</label>
            <textarea 
              id="taskDescription"
              v-model="taskForm.description" 
              class="form-textarea"
              rows="3"
              placeholder="Describe the task..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="taskStatus">Status</label>
              <select id="taskStatus" v-model="taskForm.status" class="form-select">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div class="form-group">
              <label for="taskPriority">Priority</label>
              <select id="taskPriority" v-model="taskForm.priority" class="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="taskAssignee">Assignee</label>
              <select id="taskAssignee" v-model="taskForm.assigneeId" class="form-select">
                <option value="">Unassigned</option>
                <option value="user">User</option>
                <option v-for="agent in availableAgents" :key="agent.id" :value="agent.id">
                  {{ agent.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="taskDueDate">Due Date</label>
              <input 
                id="taskDueDate"
                v-model="taskForm.dueDate" 
                type="date" 
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="taskEstimate">Estimated Hours</label>
              <input 
                id="taskEstimate"
                v-model.number="taskForm.estimatedHours" 
                type="number" 
                min="0" 
                step="0.5"
                class="form-input"
                placeholder="0"
              />
            </div>

            <div class="form-group">
              <label for="taskTags">Tags (comma separated)</label>
              <input 
                id="taskTags"
                v-model="taskForm.tagsString" 
                type="text" 
                class="form-input"
                placeholder="frontend, urgent, refactor"
              />
            </div>
          </div>

          <div v-if="taskForm.status === 'blocked'" class="form-group">
            <label for="blockedReason">Blocked Reason</label>
            <textarea 
              id="blockedReason"
              v-model="taskForm.blockedReason" 
              class="form-textarea"
              rows="2"
              placeholder="Why is this task blocked?"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              {{ editingTask ? 'Update Task' : 'Create Task' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="selectedTask" class="modal-overlay" @click="closeTaskDetail">
      <div class="task-detail-modal" @click.stop>
        <div class="modal-header">
          <div class="task-detail-header">
            <h3>{{ selectedTask.title }}</h3>
            <div class="task-badges">
              <span class="badge type-badge" :class="`type-${selectedTask.type}`">
                {{ formatTaskType(selectedTask.type) }}
              </span>
              <span class="badge status-badge" :class="`status-${selectedTask.status}`">
                {{ formatTaskStatus(selectedTask.status) }}
              </span>
              <span class="badge priority-badge" :class="`priority-${selectedTask.priority}`">
                {{ selectedTask.priority.toUpperCase() }}
              </span>
            </div>
          </div>
          <button @click="closeTaskDetail" class="close-btn">×</button>
        </div>
        
        <div class="task-detail-content">
          <div class="task-info">
            <p class="task-description">{{ selectedTask.description }}</p>
            
            <div class="task-metadata">
              <div class="metadata-item">
                <strong>Created:</strong> {{ formatDate(selectedTask.createdAt) }}
              </div>
              <div class="metadata-item" v-if="selectedTask.assigneeName">
                <strong>Assignee:</strong> {{ selectedTask.assigneeName }}
              </div>
              <div class="metadata-item" v-if="selectedTask.dueDate">
                <strong>Due Date:</strong> {{ formatDate(selectedTask.dueDate) }}
              </div>
              <div class="metadata-item" v-if="selectedTask.estimatedHours">
                <strong>Estimated:</strong> {{ selectedTask.estimatedHours }}h
              </div>
              <div class="metadata-item" v-if="selectedTask.actualHours">
                <strong>Actual:</strong> {{ selectedTask.actualHours }}h
              </div>
              <div class="metadata-item" v-if="selectedTask.tags.length > 0">
                <strong>Tags:</strong> 
                <span v-for="tag in selectedTask.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <div class="task-actions-panel">
            <button @click="editTask(selectedTask)" class="action-btn edit">
              ✏️ Edit Task
            </button>
            <button @click="deleteTaskHandler(selectedTask.id)" class="action-btn delete">
              🗑️ Delete Task
            </button>
          </div>

          <div class="task-comments">
            <h4>Comments ({{ selectedTask.comments.length }})</h4>
            
            <div class="add-comment">
              <textarea 
                v-model="newComment" 
                placeholder="Add a comment..."
                class="comment-input"
                rows="3"
              ></textarea>
              <button @click="addComment" :disabled="!newComment.trim()" class="add-comment-btn">
                Add Comment
              </button>
            </div>

            <div class="comments-list">
              <div v-for="comment in selectedTask.comments" :key="comment.id" class="comment">
                <div class="comment-header">
                  <strong>{{ comment.authorName }}</strong>
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useProjectStore } from '@/stores/projects'
import { useAgentStore } from '@/stores/agents'
import type { ProjectTask, TaskComment } from '@/types'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const projectStore = useProjectStore()
const agentStore = useAgentStore()

// State
const viewMode = ref<'list' | 'kanban'>('list')
const showCreateTask = ref(false)
const editingTask = ref<ProjectTask | null>(null)
const selectedTask = ref<ProjectTask | null>(null)
const newComment = ref('')

// Filters
const filterStatus = ref('')
const filterPriority = ref('')
const filterAssignee = ref('')
const searchQuery = ref('')

// Form state
const taskForm = reactive({
  title: '',
  description: '',
  status: 'todo' as ProjectTask['status'],
  priority: 'medium' as ProjectTask['priority'],
  type: 'feature' as ProjectTask['type'],
  assigneeId: '',
  assigneeName: '',
  estimatedHours: 0,
  dueDate: '',
  tagsString: '',
  blockedReason: ''
})

// Computed
const project = computed(() => projectStore.getProjectById(props.projectId))
const tasks = computed(() => project.value?.tasks || [])
const statistics = computed(() => projectStore.getTaskStatistics(props.projectId))
const availableAgents = computed(() => agentStore.agents)

const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (filterStatus.value) {
    filtered = filtered.filter(task => task.status === filterStatus.value)
  }

  if (filterPriority.value) {
    filtered = filtered.filter(task => task.priority === filterPriority.value)
  }

  if (filterAssignee.value) {
    filtered = filtered.filter(task => task.assigneeId === filterAssignee.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filtered.sort((a, b) => {
    // Sort by priority and then by created date
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const kanbanColumns = [
  { key: 'todo', title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'review', title: 'Review' },
  { key: 'done', title: 'Done' },
  { key: 'blocked', title: 'Blocked' }
]

// Methods
function getTasksByStatus(status: string) {
  return filteredTasks.value.filter(task => task.status === status)
}

function formatTaskType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
}

function formatTaskStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString()
}

function isOverdue(dueDate: Date | string) {
  return new Date(dueDate) < new Date()
}

function selectTask(task: ProjectTask) {
  selectedTask.value = task
}

function closeTaskDetail() {
  selectedTask.value = null
}

function editTask(task: ProjectTask) {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description
  taskForm.status = task.status
  taskForm.priority = task.priority
  taskForm.type = task.type
  taskForm.assigneeId = task.assigneeId || ''
  taskForm.estimatedHours = task.estimatedHours || 0
  taskForm.dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  taskForm.tagsString = task.tags.join(', ')
  taskForm.blockedReason = task.blockedReason || ''
  
  selectedTask.value = null
  showCreateTask.value = false
}

function closeModal() {
  showCreateTask.value = false
  editingTask.value = null
  resetForm()
}

function resetForm() {
  taskForm.title = ''
  taskForm.description = ''
  taskForm.status = 'todo'
  taskForm.priority = 'medium'
  taskForm.type = 'feature'
  taskForm.assigneeId = ''
  taskForm.estimatedHours = 0
  taskForm.dueDate = ''
  taskForm.tagsString = ''
  taskForm.blockedReason = ''
}

function saveTask() {
  const assigneeName = taskForm.assigneeId === 'user' ? 'User' : 
    availableAgents.value.find(agent => agent.id === taskForm.assigneeId)?.name || ''

  const taskData = {
    title: taskForm.title,
    description: taskForm.description,
    status: taskForm.status,
    priority: taskForm.priority,
    type: taskForm.type,
    assigneeId: taskForm.assigneeId || undefined,
    assigneeName,
    estimatedHours: taskForm.estimatedHours || undefined,
    dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
    tags: taskForm.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag),
    attachments: [], // Initialize empty attachments array
    blockedReason: taskForm.status === 'blocked' ? taskForm.blockedReason : undefined,
    createdBy: 'user'
  }

  if (editingTask.value) {
    projectStore.updateTask(props.projectId, editingTask.value.id, taskData)
  } else {
    projectStore.createTask(props.projectId, taskData)
  }

  closeModal()
}

function deleteTaskHandler(taskId: string) {
  if (confirm('Are you sure you want to delete this task?')) {
    projectStore.deleteTask(props.projectId, taskId)
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null
    }
  }
}

function addComment() {
  if (!selectedTask.value || !newComment.value.trim()) return

  const commentData = {
    content: newComment.value,
    authorId: 'user',
    authorName: 'User'
  }

  projectStore.addTaskComment(props.projectId, selectedTask.value.id, commentData)
  newComment.value = ''
}

// Update assignee name when assigneeId changes
watch(() => taskForm.assigneeId, (newAssigneeId) => {
  if (newAssigneeId === 'user') {
    taskForm.assigneeName = 'User'
  } else if (newAssigneeId) {
    const agent = availableAgents.value.find(agent => agent.id === newAssigneeId)
    taskForm.assigneeName = agent?.name || ''
  } else {
    taskForm.assigneeName = ''
  }
})
</script>

<style scoped>
.task-manager {
  padding: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.header-left h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.task-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  min-width: 60px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.view-toggles {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 8px 16px;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.view-btn:hover {
  background: #f5f5f5;
}

.view-btn.active {
  background: #007bff;
  color: white;
}

.create-task-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.create-task-btn:hover {
  background: #0056b3;
}

.task-filters {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.search-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.create-first-task-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 16px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.task-item.task-done {
  opacity: 0.7;
}

.task-item.task-done .task-title {
  text-decoration: line-through;
}

.task-priority {
  width: 4px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 4px 0 0 4px;
}

.priority-urgent { background: #dc3545; }
.priority-high { background: #fd7e14; }
.priority-medium { background: #ffc107; }
.priority-low { background: #28a745; }

.task-content {
  flex: 1;
  margin-left: 12px;
}

.task-main {
  margin-bottom: 8px;
}

.task-title {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.task-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.task-type,
.task-status,
.task-assignee,
.task-due-date {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.task-type {
  background: #e9ecef;
  color: #495057;
}

.type-feature { background: #e7f5e7; color: #2d6a2d; }
.type-bug { background: #f8d7da; color: #721c24; }
.type-improvement { background: #d4edda; color: #155724; }
.type-documentation { background: #d1ecf1; color: #0c5460; }
.type-research { background: #e2e3e5; color: #383d41; }

.task-status {
  background: #f8f9fa;
  color: #6c757d;
}

.status-todo { background: #e2e3e5; color: #383d41; }
.status-in_progress { background: #cce5ff; color: #004085; }
.status-review { background: #fff3cd; color: #856404; }
.status-done { background: #d4edda; color: #155724; }
.status-blocked { background: #f8d7da; color: #721c24; }

.task-assignee {
  background: #f8f9fa;
  color: #495057;
}

.task-due-date {
  background: #f8f9fa;
  color: #495057;
}

.task-due-date.overdue {
  background: #f8d7da;
  color: #721c24;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 8px;
  border: none;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #007bff;
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

/* Kanban Board Styles */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  min-height: 400px;
}

.kanban-column {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.column-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.task-count {
  background: #dee2e6;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.column-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-task {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #dee2e6;
}

.kanban-task:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kanban-task.priority-urgent { border-left-color: #dc3545; }
.kanban-task.priority-high { border-left-color: #fd7e14; }
.kanban-task.priority-medium { border-left-color: #ffc107; }
.kanban-task.priority-low { border-left-color: #28a745; }

.kanban-task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-type-badge,
.task-priority-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.task-type-badge.type-feature { background: #28a745; }
.task-type-badge.type-bug { background: #dc3545; }
.task-type-badge.type-improvement { background: #007bff; }
.task-type-badge.type-documentation { background: #17a2b8; }
.task-type-badge.type-research { background: #6c757d; }

.task-priority-badge.priority-urgent { background: #dc3545; }
.task-priority-badge.priority-high { background: #fd7e14; }
.task-priority-badge.priority-medium { background: #ffc107; }
.task-priority-badge.priority-low { background: #28a745; }

.kanban-task-title {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.kanban-task-description {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 12px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #666;
}

.kanban-assignee,
.kanban-due-date {
  font-size: 10px;
}

.kanban-due-date.overdue {
  color: #dc3545;
  font-weight: 600;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.task-modal,
.task-detail-modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.task-detail-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.task-detail-header {
  flex: 1;
}

.task-detail-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.task-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.type-feature { background: #e7f5e7; color: #2d6a2d; }
.type-badge.type-bug { background: #f8d7da; color: #721c24; }
.type-badge.type-improvement { background: #d4edda; color: #155724; }
.type-badge.type-documentation { background: #d1ecf1; color: #0c5460; }
.type-badge.type-research { background: #e2e3e5; color: #383d41; }

.status-badge.status-todo { background: #e2e3e5; color: #383d41; }
.status-badge.status-in_progress { background: #cce5ff; color: #004085; }
.status-badge.status-review { background: #fff3cd; color: #856404; }
.status-badge.status-done { background: #d4edda; color: #155724; }
.status-badge.status-blocked { background: #f8d7da; color: #721c24; }

.priority-badge.priority-urgent { background: #dc3545; color: white; }
.priority-badge.priority-high { background: #fd7e14; color: white; }
.priority-badge.priority-medium { background: #ffc107; color: #212529; }
.priority-badge.priority-low { background: #28a745; color: white; }

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.task-form {
  padding: 20px;
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
.form-select,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.save-btn {
  background: #007bff;
  color: white;
}

.save-btn:hover {
  background: #0056b3;
}

.task-detail-content {
  padding: 20px;
}

.task-info {
  margin-bottom: 24px;
}

.task-description {
  margin-bottom: 16px;
  color: #333;
  line-height: 1.6;
}

.task-metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.metadata-item {
  font-size: 14px;
  color: #666;
}

.metadata-item strong {
  color: #333;
}

.tag {
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 4px;
}

.task-actions-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn.edit {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.action-btn.edit:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.action-btn.delete:hover {
  background: #c82333;
  border-color: #bd2130;
}

.task-comments h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.add-comment {
  margin-bottom: 24px;
}

.comment-input {
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.add-comment-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-comment-btn:hover:not(:disabled) {
  background: #0056b3;
}

.add-comment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-header strong {
  color: #333;
  font-size: 14px;
}

.comment-date {
  color: #666;
  font-size: 12px;
}

.comment-content {
  margin: 0;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    gap: 12px;
  }

  .task-filters {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .filter-select,
  .search-input {
    min-width: auto;
  }

  .kanban-board {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .task-metadata {
    grid-template-columns: 1fr;
  }
}
</style>