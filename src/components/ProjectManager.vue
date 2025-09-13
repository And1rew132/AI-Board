<template>
  <div class="project-manager">
    <div class="header">
      <h2>Projects</h2>
      <UIButton @click="showCreateDialog = true">
        New Project
      </UIButton>
    </div>
    
    <div class="filters">
      <UISelect 
        v-model="selectedStatus" 
        placeholder="All Projects"
        class="filter-select"
      >
        <option value="">All Projects</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </UISelect>
    </div>

    <!-- Projects Grid -->
    <div class="projects-grid" v-if="filteredProjects.length > 0">
      <UICard 
        v-for="project in filteredProjects" 
        :key="project.id"
        variant="elevated"
        :class="{ active: currentProject?.id === project.id }"
        @click="selectProject(project)"
        class="project-card"
      >
        <template #header>
          <div class="project-header">
            <h3>{{ project.name }}</h3>
            <UIBadge :variant="getStatusVariant(project.status)">
              {{ project.status }}
            </UIBadge>
          </div>
        </template>
        
        <p class="project-description">{{ project.description }}</p>
        
        <div class="project-stats">
          <UIStatCard 
            :value="project.content.length"
            label="Content"
            icon="📄"
            variant="primary"
          />
          <UIStatCard 
            :value="project.agents.length"
            label="Agents"
            icon="🤖"
            variant="success"
          />
        </div>
        
        <template #footer>
          <div class="project-actions">
            <UIButton @click.stop="viewProject(project)" variant="ghost" size="sm">
              View
            </UIButton>
            <UIButton @click.stop="editProject(project)" variant="secondary" size="sm">
              Edit
            </UIButton>
            <UIButton @click.stop="deleteProject(project.id)" variant="danger" size="sm">
              Delete
            </UIButton>
          </div>
        </template>
      </UICard>
    </div>

    <!-- Enhanced Empty State -->
    <div class="empty-state" v-else>
      <div class="empty-content">
        <div class="empty-icon">📁</div>
        <h3 class="empty-title">No Projects Found</h3>
        <p class="empty-description" v-if="selectedStatus">
          No projects match the "{{ getStatusDisplayName(selectedStatus) }}" filter.
          <UIButton @click="clearFilter" variant="ghost" size="sm" class="clear-filter-btn">
            Clear filter
          </UIButton>
        </p>
        <p class="empty-description" v-else>
          Start your AI-powered project management journey by creating your first project.
        </p>
        
        <div class="empty-actions" v-if="!selectedStatus">
          <UIButton @click="showCreateDialog = true" size="lg" class="create-project-btn">
            <span class="btn-icon">➕</span>
            Create Project
          </UIButton>
        </div>

        <div class="empty-suggestions" v-if="!selectedStatus">
          <h4>Getting Started Tips:</h4>
          <ul class="suggestions-list">
            <li>
              <span class="suggestion-icon">💡</span>
              Start with a clear project name and description
            </li>
            <li>
              <span class="suggestion-icon">🤖</span>
              Assign AI agents to automate repetitive tasks
            </li>
            <li>
              <span class="suggestion-icon">📋</span>
              Break down work into manageable tasks and milestones
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Create/Edit Project Dialog -->
    <UIModal 
      v-model="showCreateDialog" 
      :title="editingProject ? 'Edit Project' : 'Create New Project'"
      size="md"
    >
      <form @submit.prevent="saveProject">
        <div class="form-fields">
          <UIInput 
            v-model="projectForm.name"
            label="Name"
            required
          />
          
          <UITextarea 
            v-model="projectForm.description"
            label="Description"
            :rows="3"
          />
          
          <UISelect 
            v-model="projectForm.status"
            label="Status"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </UISelect>
        </div>
      </form>
      
      <template #footer>
        <UIButton @click="closeDialog" variant="secondary">
          Cancel
        </UIButton>
        <UIButton @click="saveProject">
          {{ editingProject ? 'Update' : 'Create' }}
        </UIButton>
      </template>
    </UIModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/projects';
import { UIButton, UICard, UIModal, UIInput, UITextarea, UISelect, UIBadge, UIStatCard } from '@/ui';
import type { Project } from '@/types';

const router = useRouter();
const projectStore = useProjectStore();

const selectedStatus = ref('');
const showCreateDialog = ref(false);
const editingProject = ref<Project | null>(null);

const projectForm = reactive({
  name: '',
  description: '',
  status: 'active' as Project['status'],
});

const filteredProjects = computed(() => {
  if (!selectedStatus.value) {
    return projectStore.projects;
  }
  return projectStore.projects.filter(p => p.status === selectedStatus.value);
});

const currentProject = computed(() => projectStore.currentProject);

function getStatusVariant(status: Project['status']) {
  switch (status) {
    case 'active': return 'success'
    case 'paused': return 'warning'
    case 'completed': return 'primary'
    case 'archived': return 'gray'
    default: return 'gray'
  }
}

function getStatusDisplayName(status: string) {
  switch (status) {
    case 'active': return 'Active'
    case 'paused': return 'Paused'
    case 'completed': return 'Completed'
    case 'archived': return 'Archived'
    default: return status
  }
}

function clearFilter() {
  selectedStatus.value = '';
}

function selectProject(project: Project) {
  projectStore.setCurrentProject(project);
}

function viewProject(project: Project) {
  router.push(`/project/${project.id}`);
}

function editProject(project: Project) {
  editingProject.value = project;
  projectForm.name = project.name;
  projectForm.description = project.description;
  projectForm.status = project.status;
  showCreateDialog.value = true;
}

function saveProject() {
  if (editingProject.value) {
    projectStore.updateProject(editingProject.value.id, {
      name: projectForm.name,
      description: projectForm.description,
      status: projectForm.status,
    });
  } else {
    projectStore.createProject({
      name: projectForm.name,
      description: projectForm.description,
      status: projectForm.status,
      agents: [],
    });
  }
  
  closeDialog();
}

function deleteProject(id: string) {
  if (confirm('Are you sure you want to delete this project?')) {
    projectStore.deleteProject(id);
  }
}

function closeDialog() {
  showCreateDialog.value = false;
  editingProject.value = null;
  projectForm.name = '';
  projectForm.description = '';
  projectForm.status = 'active';
}

// Listen for create project event from Home.vue
function handleCreateProjectEvent(event: CustomEvent) {
  showCreateDialog.value = true;
  if (event.detail?.isFirstProject) {
    // Could add special handling for first project
    projectForm.name = '';
    projectForm.description = '';
  }
}

onMounted(() => {
  window.addEventListener('create-project', handleCreateProjectEvent as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('create-project', handleCreateProjectEvent as EventListener);
});
</script>

<style scoped>
.project-manager {
  padding: var(--spacing-lg);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.header h2 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.filters {
  margin-bottom: var(--spacing-xl);
}

.filter-select {
  max-width: 200px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
}

.project-card.active {
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.project-header h3 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.project-description {
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
}

.project-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.project-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .project-stats {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .project-actions {
    flex-direction: column;
  }
}

/* Empty State Styles */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--spacing-3xl);
}

.empty-content {
  text-align: center;
  max-width: 500px;
}

.empty-icon {
  font-size: var(--font-size-5xl);
  margin-bottom: var(--spacing-xl);
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.empty-description {
  margin: 0 0 var(--spacing-2xl) 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}

.clear-filter-btn {
  margin-left: var(--spacing-sm);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.empty-actions {
  margin-bottom: var(--spacing-2xl);
}

.create-project-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.create-project-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-icon {
  margin-right: var(--spacing-sm);
}

.empty-suggestions {
  text-align: left;
  background: var(--color-gray-50);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
}

.empty-suggestions h4 {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-800);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.suggestions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestions-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--color-primary);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  line-height: var(--line-height-normal);
}

.suggestions-list li:last-child {
  margin-bottom: 0;
}

.suggestion-icon {
  font-size: var(--font-size-base);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Responsive empty state */
@media (max-width: 768px) {
  .empty-state {
    padding: var(--spacing-2xl);
    min-height: 300px;
  }
  
  .empty-content {
    max-width: 100%;
  }
  
  .empty-suggestions {
    padding: var(--spacing-lg);
  }
  
  .suggestions-list li {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}
</style>