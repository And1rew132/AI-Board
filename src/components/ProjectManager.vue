<template>
  <div class="project-manager">
    <div class="header">
      <h2>Projects</h2>
      <button @click="showCreateDialog = true" class="btn-primary">
        New Project
      </button>
    </div>
    
    <div class="filters">
      <select v-model="selectedStatus" class="filter-select">
        <option value="">All Projects</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <div class="projects-grid">
      <div 
        v-for="project in filteredProjects" 
        :key="project.id"
        class="project-card"
        :class="{ active: currentProject?.id === project.id }"
        @click="selectProject(project)"
      >
        <div class="project-header">
          <h3>{{ project.name }}</h3>
          <span class="status-badge" :class="project.status">
            {{ project.status }}
          </span>
        </div>
        
        <p class="project-description">{{ project.description }}</p>
        
        <div class="project-stats">
          <div class="stat">
            <span class="label">Content:</span>
            <span class="value">{{ project.content.length }}</span>
          </div>
          <div class="stat">
            <span class="label">Agents:</span>
            <span class="value">{{ project.agents.length }}</span>
          </div>
        </div>
        
        <div class="project-actions">
          <button @click.stop="viewProject(project)" class="btn-view">
            View
          </button>
          <button @click.stop="editProject(project)" class="btn-secondary">
            Edit
          </button>
          <button @click.stop="deleteProject(project.id)" class="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Project Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click="closeDialog">
      <div class="modal" @click.stop>
        <h3>{{ editingProject ? 'Edit Project' : 'Create New Project' }}</h3>
        
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label for="projectName">Name:</label>
            <input 
              id="projectName"
              v-model="projectForm.name" 
              type="text" 
              required 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="projectDescription">Description:</label>
            <textarea 
              id="projectDescription"
              v-model="projectForm.description" 
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="projectStatus">Status:</label>
            <select 
              id="projectStatus"
              v-model="projectForm.status" 
              class="form-select"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeDialog" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingProject ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/projects';
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
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  margin-bottom: 1rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.project-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.project-card.active {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.project-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.paused {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-badge.archived {
  background-color: #e2e3e5;
  color: #383d41;
}

.project-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.project-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  font-size: 0.85rem;
}

.stat .label {
  color: #666;
}

.stat .value {
  font-weight: 500;
  margin-left: 0.25rem;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary, .btn-secondary, .btn-danger, .btn-view {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
}
</style>