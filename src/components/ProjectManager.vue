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

    <div class="projects-grid">
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
import { ref, computed, reactive } from 'vue';
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
</style>