<template>
  <UICard 
    :class="[
      'project-card',
      `project-card--${viewMode}`,
      { 'project-card--selected': isSelected }
    ]"
    variant="elevated"
    @click="$emit('select', project)"
  >
    <template #header>
      <div class="project-header">
        <div class="project-title-section">
          <h3 class="project-title">{{ project.name }}</h3>
          <UIBadge 
            :variant="getStatusVariant(project.status)"
            class="status-badge"
          >
            {{ formatStatus(project.status) }}
          </UIBadge>
        </div>
        <div class="project-actions">
          <button
            @click.stop="$emit('view', project)"
            class="action-btn action-btn--view"
            aria-label="View project"
            title="View project"
          >
            👁️
          </button>
          <button
            @click.stop="$emit('edit', project)"
            class="action-btn action-btn--edit"
            aria-label="Edit project"
            title="Edit project"
          >
            ✏️
          </button>
          <button
            @click.stop="$emit('delete', project.id)"
            class="action-btn action-btn--delete"
            aria-label="Delete project"
            title="Delete project"
          >
            🗑️
          </button>
        </div>
      </div>
    </template>

    <div class="project-content">
      <p class="project-description">
        {{ project.description || 'No description provided' }}
      </p>

      <div class="project-stats">
        <UIStatCard 
          :value="project.content.length"
          label="Content"
          icon="📄"
          variant="primary"
          size="sm"
        />
        <UIStatCard 
          :value="project.agents.length"
          label="Agents"
          icon="🤖"
          variant="success" 
          size="sm"
        />
        <UIStatCard 
          :value="taskStatistics?.total || 0"
          label="Tasks"
          icon="📋"
          variant="primary"
          size="sm"
        />
        <UIStatCard 
          v-if="taskStatistics?.total"
          :value="`${taskStatistics.completionRate}%`"
          label="Complete"
          icon="✅"
          variant="success"
          size="sm"
        />
      </div>

      <!-- Task Progress Bar -->
      <div v-if="taskStatistics?.total" class="task-progress">
        <div class="progress-header">
          <span class="progress-label">Task Progress</span>
          <span class="progress-text">{{ taskStatistics.completed }}/{{ taskStatistics.total }}</span>
        </div>
        <UIProgressBar 
          :value="taskStatistics.completionRate"
          :max="100"
          variant="primary"
          size="sm"
        />
      </div>

      <!-- Agent Avatars -->
      <div v-if="assignedAgents.length > 0" class="assigned-agents">
        <span class="agents-label">Assigned Agents:</span>
        <div class="agent-avatars">
          <div
            v-for="agent in assignedAgents.slice(0, 3)"
            :key="agent.id"
            class="agent-avatar"
            :title="agent.name"
          >
            {{ agent.name.charAt(0).toUpperCase() }}
          </div>
          <div
            v-if="assignedAgents.length > 3"
            class="agent-avatar agent-avatar--more"
            :title="`+${assignedAgents.length - 3} more agents`"
          >
            +{{ assignedAgents.length - 3 }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="project-footer">
        <div class="project-dates">
          <span class="date-item">
            <span class="date-label">Updated:</span>
            <span class="date-value">{{ formatDate(project.updatedAt) }}</span>
          </span>
          <span class="date-item">
            <span class="date-label">Created:</span>
            <span class="date-value">{{ formatDate(project.createdAt) }}</span>
          </span>
        </div>
        <div class="footer-actions">
          <UIButton 
            @click.stop="$emit('view', project)" 
            variant="primary" 
            size="sm"
          >
            View Details
          </UIButton>
        </div>
      </div>
    </template>
  </UICard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import { useAgentStore } from '@/stores/agents'
import { UICard, UIBadge, UIStatCard, UIButton, UIProgressBar } from '@/ui'
import type { Project } from '@/types'

interface Props {
  project: Project
  viewMode: 'grid' | 'list'
  isSelected?: boolean
}

interface Emits {
  (e: 'select', project: Project): void
  (e: 'view', project: Project): void
  (e: 'edit', project: Project): void
  (e: 'delete', projectId: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const projectStore = useProjectStore()
const agentStore = useAgentStore()

// Computed
const taskStatistics = computed(() => 
  projectStore.getTaskStatistics(props.project.id)
)

const assignedAgents = computed(() => 
  agentStore.agents.filter(agent => 
    props.project.agents.includes(agent.id)
  )
)

// Methods
function getStatusVariant(status: Project['status']) {
  switch (status) {
    case 'active': return 'success'
    case 'paused': return 'warning'
    case 'completed': return 'primary'
    case 'archived': return 'gray'
    default: return 'gray'
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.project-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* List view specific styles */
.project-card--list {
  cursor: pointer;
}

.project-card--list .project-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.project-card--list .project-description {
  flex: 1;
  margin: 0;
}

.project-card--list .project-stats {
  flex-shrink: 0;
  grid-template-columns: repeat(4, 1fr);
  min-width: 300px;
}

.project-card--list .task-progress,
.project-card--list .assigned-agents {
  display: none;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.project-title-section {
  flex: 1;
  min-width: 0;
}

.project-title {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  word-wrap: break-word;
}

.status-badge {
  margin-top: var(--spacing-xs);
}

.project-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
  background: var(--color-gray-100);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn--view:hover {
  background: var(--color-primary-100);
}

.action-btn--edit:hover {
  background: var(--color-yellow-100);
}

.action-btn--delete:hover {
  background: var(--color-red-100);
}

.project-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.project-description {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.task-progress {
  margin-top: var(--spacing-sm);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.assigned-agents {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.agents-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  font-weight: var(--font-weight-medium);
}

.agent-avatars {
  display: flex;
  gap: var(--spacing-xs);
}

.agent-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border: 2px solid var(--color-white);
  margin-left: -4px;
}

.agent-avatar:first-child {
  margin-left: 0;
}

.agent-avatar--more {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.project-dates {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.date-item {
  display: flex;
  gap: var(--spacing-xs);
}

.date-label {
  color: var(--color-gray-500);
  font-weight: var(--font-weight-medium);
}

.date-value {
  color: var(--color-gray-700);
}

.footer-actions {
  flex-shrink: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .project-card--list .project-content {
    flex-direction: column;
    align-items: stretch;
  }

  .project-card--list .project-stats {
    min-width: auto;
    grid-template-columns: repeat(2, 1fr);
  }

  .project-actions {
    opacity: 1; /* Always show on mobile */
  }

  .project-footer {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .project-dates {
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .project-stats {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .assigned-agents {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .project-header {
    flex-direction: column;
    align-items: stretch;
  }

  .project-actions {
    align-self: flex-end;
  }
}
</style>