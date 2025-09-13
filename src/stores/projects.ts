import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Project, ProjectContent, ProjectTask, TaskComment } from '@/types';
import { GitHubProjectIntegrationService } from '@/services/github-project-integration';

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const githubIntegrationService = new GitHubProjectIntegrationService();

  const activeProjects = computed(() => 
    projects.value.filter((p: Project) => p.status === 'active')
  );

  const archivedProjects = computed(() => 
    projects.value.filter((p: Project) => p.status === 'archived')
  );

  function createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'content' | 'tasks'>) {
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      content: [],
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    projects.value.push(newProject);
    return newProject;
  }

  function updateProject(id: string, updates: Partial<Project>) {
    const index = projects.value.findIndex((p: Project) => p.id === id);
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: new Date(),
      };
    }
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex((p: Project) => p.id === id);
    if (index !== -1) {
      projects.value.splice(index, 1);
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
    }
  }

  function addProjectContent(projectId: string, content: Omit<ProjectContent, 'id' | 'createdAt' | 'updatedAt'>) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const newContent: ProjectContent = {
        ...content,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      project.content.push(newContent);
      project.updatedAt = new Date();
    }
  }

  function updateProjectContent(projectId: string, contentId: string, updates: Partial<ProjectContent>) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const contentIndex = project.content.findIndex((c: ProjectContent) => c.id === contentId);
      if (contentIndex !== -1) {
        project.content[contentIndex] = {
          ...project.content[contentIndex],
          ...updates,
          updatedAt: new Date(),
        };
        project.updatedAt = new Date();
      }
    }
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project;
  }

  function getProjectById(id: string) {
    return projects.value.find((p: Project) => p.id === id);
  }

  // Task management functions
  function createTask(projectId: string, taskData: Omit<ProjectTask, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'comments'>) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const newTask: ProjectTask = {
        ...taskData,
        id: generateId(),
        projectId,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      project.tasks.push(newTask);
      project.updatedAt = new Date();
      return newTask;
    }
    return null;
  }

  function updateTask(projectId: string, taskId: string, updates: Partial<ProjectTask>) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const taskIndex = project.tasks.findIndex((t: ProjectTask) => t.id === taskId);
      if (taskIndex !== -1) {
        const updatedTask = {
          ...project.tasks[taskIndex],
          ...updates,
          updatedAt: new Date(),
        };

        // Set completedAt when status changes to 'done'
        if (updates.status === 'done' && project.tasks[taskIndex].status !== 'done') {
          updatedTask.completedAt = new Date();
        } else if (updates.status !== 'done') {
          updatedTask.completedAt = undefined;
        }

        project.tasks[taskIndex] = updatedTask;
        project.updatedAt = new Date();
        return updatedTask;
      }
    }
    return null;
  }

  function deleteTask(projectId: string, taskId: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const taskIndex = project.tasks.findIndex((t: ProjectTask) => t.id === taskId);
      if (taskIndex !== -1) {
        project.tasks.splice(taskIndex, 1);
        project.updatedAt = new Date();
        return true;
      }
    }
    return false;
  }

  function addTaskComment(projectId: string, taskId: string, commentData: Omit<TaskComment, 'id' | 'taskId' | 'createdAt'>) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      const task = project.tasks.find((t: ProjectTask) => t.id === taskId);
      if (task) {
        const newComment: TaskComment = {
          ...commentData,
          id: generateId(),
          taskId,
          createdAt: new Date(),
        };
        
        task.comments.push(newComment);
        task.updatedAt = new Date();
        project.updatedAt = new Date();
        return newComment;
      }
    }
    return null;
  }

  function getTasksByStatus(projectId: string, status: ProjectTask['status']) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    return project ? project.tasks.filter((t: ProjectTask) => t.status === status) : [];
  }

  function getTasksByAssignee(projectId: string, assigneeId: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    return project ? project.tasks.filter((t: ProjectTask) => t.assigneeId === assigneeId) : [];
  }

  function getTasksByPriority(projectId: string, priority: ProjectTask['priority']) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    return project ? project.tasks.filter((t: ProjectTask) => t.priority === priority) : [];
  }

  function getTaskStatistics(projectId: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (!project) return null;

    if (!project.tasks) project.tasks = []; 
    const tasks = project.tasks;
    const total = tasks.length;
    const completed = tasks.filter((t: ProjectTask) => t.status === 'done').length;
    const inProgress = tasks.filter((t: ProjectTask) => t.status === 'in_progress').length;
    const blocked = tasks.filter((t: ProjectTask) => t.status === 'blocked').length;
    const todo = tasks.filter((t: ProjectTask) => t.status === 'todo').length;
    const review = tasks.filter((t: ProjectTask) => t.status === 'review').length;

    const byPriority = {
      urgent: tasks.filter((t: ProjectTask) => t.priority === 'urgent').length,
      high: tasks.filter((t: ProjectTask) => t.priority === 'high').length,
      medium: tasks.filter((t: ProjectTask) => t.priority === 'medium').length,
      low: tasks.filter((t: ProjectTask) => t.priority === 'low').length,
    };

    const byType = {
      feature: tasks.filter((t: ProjectTask) => t.type === 'feature').length,
      bug: tasks.filter((t: ProjectTask) => t.type === 'bug').length,
      improvement: tasks.filter((t: ProjectTask) => t.type === 'improvement').length,
      documentation: tasks.filter((t: ProjectTask) => t.type === 'documentation').length,
      research: tasks.filter((t: ProjectTask) => t.type === 'research').length,
    };

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      blocked,
      todo,
      review,
      completionRate,
      byPriority,
      byType,
    };
  }

  // GitHub Integration functions
  async function connectProjectToGitHub(projectId: string, repositoryUrl: string, accessToken: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      const integration = await githubIntegrationService.connectProjectToRepository(
        project, 
        repositoryUrl, 
        accessToken
      );

      updateProject(projectId, { 
        githubIntegration: integration 
      });

      return integration;
    } catch (error) {
      console.error('Failed to connect project to GitHub:', error);
      throw error;
    }
  }

  async function syncProjectWithGitHub(projectId: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (!project || !project.githubIntegration) {
      throw new Error('Project not found or not connected to GitHub');
    }

    try {
      const syncedTasks = await githubIntegrationService.syncIssues(
        project, 
        project.githubIntegration
      );

      // Update or add tasks
      syncedTasks.forEach(task => {
        const existingTaskIndex = project.tasks.findIndex(t => t.id === task.id);
        if (existingTaskIndex !== -1) {
          project.tasks[existingTaskIndex] = task;
        } else {
          project.tasks.push(task);
        }
      });

      // Update last sync time
      updateProject(projectId, {
        githubIntegration: {
          ...project.githubIntegration,
          lastSync: new Date()
        }
      });

      return syncedTasks;
    } catch (error) {
      console.error('Failed to sync with GitHub:', error);
      throw error;
    }
  }

  async function createGitHubIssueFromTask(projectId: string, taskId: string) {
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (!project || !project.githubIntegration) {
      throw new Error('Project not found or not connected to GitHub');
    }

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    try {
      const issue = await githubIntegrationService.createIssueFromTask(
        task, 
        project.githubIntegration
      );

      // Update task with GitHub issue link
      updateTask(projectId, taskId, {
        githubIssue: {
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          lastSyncAt: new Date(),
          syncDirection: 'project_to_github'
        }
      });

      return issue;
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      throw error;
    }
  }

  function disconnectProjectFromGitHub(projectId: string) {
    updateProject(projectId, { 
      githubIntegration: undefined 
    });
  }

  function getProjectsWithGitHubIntegration() {
    return projects.value.filter((p: Project) => p.githubIntegration);
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  return {
    projects,
    currentProject,
    activeProjects,
    archivedProjects,
    createProject,
    updateProject,
    deleteProject,
    addProjectContent,
    updateProjectContent,
    setCurrentProject,
    getProjectById,
    // Task management
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    getTasksByStatus,
    getTasksByAssignee,
    getTasksByPriority,
    getTaskStatistics,
    // GitHub integration
    connectProjectToGitHub,
    syncProjectWithGitHub,
    createGitHubIssueFromTask,
    disconnectProjectFromGitHub,
    getProjectsWithGitHubIntegration,
  };
}, {
  persist: true
});