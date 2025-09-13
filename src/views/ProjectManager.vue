<template>
  <div class="project-manager-view">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Manage and track your AI-powered projects</p>
      </div>
      <div class="header-actions">
        <UIButton @click="showCreateDialog = true" size="lg">
          + New Project
        </UIButton>
      </div>
    </div>

    <div class="filters-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search projects..."
            class="search-input"
            @input="handleSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search"
            aria-label="Clear search"
          >
            ×
          </button>
        </div>
      </div>

      <div class="filter-controls">
        <UISelect 
          v-model="selectedStatus" 
          placeholder="All Statuses"
          class="filter-select"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </UISelect>

        <UISelect 
          v-model="sortBy" 
          class="filter-select"
          aria-label="Sort projects"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Date Created</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </UISelect>

        <button
          @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'"
          class="view-toggle"
          :aria-label="`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`"
        >
          {{ viewMode === 'grid' ? '📋' : '⊞' }}
        </button>
      </div>
    </div>

    <!-- Projects Grid/List -->
    <div class="projects-container">
      <div v-if="filteredProjects.length === 0" class="empty-state">
        <div class="empty-state-content">
          <div class="empty-icon">📋</div>
          <h3>{{ searchQuery || selectedStatus ? 'No projects found' : 'No projects yet' }}</h3>
          <p v-if="searchQuery || selectedStatus">
            Try adjusting your search or filters
          </p>
          <p v-else>
            Create your first project to get started with AI-powered collaboration
          </p>
          <UIButton 
            v-if="!searchQuery && !selectedStatus"
            @click="showCreateDialog = true"
            variant="primary"
            size="lg"
          >
            Create Your First Project
          </UIButton>
        </div>
      </div>

      <div v-else :class="['projects-container', `projects-${viewMode}`]">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          :view-mode="viewMode"
          :is-selected="currentProject?.id === project.id"
          @select="selectProject"
          @view="viewProject"
          @edit="editProject"
          @delete="deleteProject"
        />
      </div>
    </div>

    <!-- Create/Edit Project Dialog -->
    <UIModal 
      v-model="showCreateDialog" 
      :title="editingProject ? 'Edit Project' : 'Create New Project'"
      size="lg"
      @close="closeDialog"
    >
      <ProjectForm
        :project="editingProject"
        @save="handleSaveProject"
        @cancel="closeDialog"
      />
    </UIModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import { UIButton, UISelect, UIModal } from '@/ui'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectForm from '@/components/ProjectForm.vue'
import type { Project } from '@/types'

const router = useRouter()
const projectStore = useProjectStore()

// State
const searchQuery = ref('')
const selectedStatus = ref('')
const sortBy = ref('updated')
const viewMode = ref<'grid' | 'list'>('grid')
const showCreateDialog = ref(false)
const editingProject = ref<Project | null>(null)

// Computed
const currentProject = computed(() => projectStore.currentProject)

const filteredProjects = computed(() => {
  let projects = [...projectStore.projects]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    projects = projects.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    projects = projects.filter(project => project.status === selectedStatus.value)
  }

  // Sort projects
  projects.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  return projects
})

// Methods
function handleSearch() {
  // Debouncing handled by v-model
}

function clearSearch() {
  searchQuery.value = ''
}

function selectProject(project: Project) {
  projectStore.setCurrentProject(project)
}

function viewProject(project: Project) {
  router.push(`/project/${project.id}`)
}

function editProject(project: Project) {
  editingProject.value = project
  showCreateDialog.value = true
}

function deleteProject(projectId: string) {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    projectStore.deleteProject(projectId)
  }
}

function handleSaveProject(projectData: Partial<Project>) {
  if (editingProject.value) {
    projectStore.updateProject(editingProject.value.id, projectData)
  } else {
    projectStore.createProject({
      ...projectData,
      agents: [],
    } as Project)
  }
  closeDialog()
}

function closeDialog() {
  showCreateDialog.value = false
  editingProject.value = null
}

// Watchers
watch(searchQuery, () => {
  // Auto-clear status filter when searching
  if (searchQuery.value && selectedStatus.value) {
    selectedStatus.value = ''
  }
})
</script>

<style scoped>
.project-manager-view {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-gray-900);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.page-subtitle {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
}

.header-actions {
  flex-shrink: 0;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-gray-400);
  font-size: var(--font-size-sm);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 2.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search {
  position: absolute;
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  font-size: var(--font-size-lg);
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: color 0.2s ease;
}

.clear-search:hover {
  color: var(--color-gray-600);
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.filter-select {
  min-width: 150px;
}

.view-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--border-radius-md);
  background: var(--color-white);
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: all 0.2s ease;
}

.view-toggle:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.projects-container {
  min-height: 400px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--spacing-xl);
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-gray-700);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.empty-state p {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-gray-500);
  line-height: var(--line-height-relaxed);
}

/* Responsive Design */
@media (max-width: 768px) {
  .project-manager-view {
    padding: var(--spacing-lg);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .filter-controls {
    justify-content: space-between;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }

  .filter-select {
    min-width: auto;
    flex: 1;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: var(--font-size-2xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
  }

  .search-input {
    padding-left: 2rem;
  }

  .search-icon {
    left: var(--spacing-sm);
  }
}
</style>