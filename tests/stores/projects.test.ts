import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '@/stores/projects'
import { createMockProject } from '../utils/test-helpers'

describe('Project Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates a project with correct data', () => {
    const store = useProjectStore()
    const projectData = {
      name: 'Test Project',
      description: 'A test project',
      status: 'active' as const,
      agents: []
    }

    const project = store.createProject(projectData)
    
    expect(project).toBeDefined()
    expect(project.name).toBe('Test Project')
    expect(project.id).toBeDefined()
    expect(project.createdAt).toBeInstanceOf(Date)
    expect(project.updatedAt).toBeInstanceOf(Date)
    expect(project.content).toEqual([])
    expect(project.tasks).toEqual([])
    expect(store.projects).toHaveLength(1)
  })

  it('updates a project correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    store.updateProject(project.id, { name: 'Updated Project', status: 'paused' })

    const updatedProject = store.projects.find(p => p.id === project.id)
    expect(updatedProject?.name).toBe('Updated Project')
    expect(updatedProject?.status).toBe('paused')
    expect(updatedProject?.updatedAt).toBeInstanceOf(Date)
  })

  it('deletes a project correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)
    store.setCurrentProject(project)

    expect(store.projects).toHaveLength(1)
    expect(store.currentProject?.id).toBe(project.id)
    
    store.deleteProject(project.id)
    
    expect(store.projects).toHaveLength(0)
    expect(store.currentProject).toBe(null)
  })

  it('filters active projects correctly', () => {
    const store = useProjectStore()
    const activeProject = createMockProject({ status: 'active' })
    const archivedProject = createMockProject({ id: 'project-2', status: 'archived' })
    
    store.projects.push(activeProject, archivedProject)
    
    expect(store.activeProjects).toHaveLength(1)
    expect(store.activeProjects[0].id).toBe(activeProject.id)
  })

  it('gets project by id', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)
    
    const foundProject = store.getProjectById(project.id)
    expect(foundProject?.id).toBe(project.id)
    
    const notFound = store.getProjectById('non-existent')
    expect(notFound).toBeUndefined()
  })

  it('creates tasks correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    const taskData = {
      title: 'Test Task',
      description: 'A test task',
      status: 'todo' as const,
      priority: 'medium' as const,
      type: 'feature' as const,
      tags: ['test'],
      attachments: [],
      createdBy: 'user'
    }

    const task = store.createTask(project.id, taskData)
    
    expect(task).toBeDefined()
    expect(task?.title).toBe('Test Task')
    expect(task?.id).toBeDefined()
    expect(task?.projectId).toBe(project.id)
    expect(task?.createdAt).toBeInstanceOf(Date)
    expect(project.tasks).toHaveLength(1)
  })

  it('updates tasks correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    const task = store.createTask(project.id, {
      title: 'Test Task',
      description: 'A test task',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    expect(task?.completedAt).toBeUndefined()

    // Update task to done
    const updatedTask = store.updateTask(project.id, task!.id, { status: 'done' })
    
    expect(updatedTask?.status).toBe('done')
    expect(updatedTask?.completedAt).toBeInstanceOf(Date)
  })

  it('deletes tasks correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    const task = store.createTask(project.id, {
      title: 'Test Task',
      description: 'A test task',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    expect(project.tasks).toHaveLength(1)
    
    const deleted = store.deleteTask(project.id, task!.id)
    
    expect(deleted).toBe(true)
    expect(project.tasks).toHaveLength(0)
  })

  it('filters tasks by status', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    store.createTask(project.id, {
      title: 'Todo Task',
      description: 'A todo task',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    store.createTask(project.id, {
      title: 'Done Task',
      description: 'A done task',
      status: 'done',
      priority: 'medium',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    const todoTasks = store.getTasksByStatus(project.id, 'todo')
    const doneTasks = store.getTasksByStatus(project.id, 'done')
    
    expect(todoTasks).toHaveLength(1)
    expect(doneTasks).toHaveLength(1)
    expect(todoTasks[0].title).toBe('Todo Task')
    expect(doneTasks[0].title).toBe('Done Task')
  })

  it('calculates task statistics correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    // Create tasks with different statuses and priorities
    store.createTask(project.id, {
      title: 'Todo Task',
      description: 'A todo task',
      status: 'todo',
      priority: 'high',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    store.createTask(project.id, {
      title: 'Done Task',
      description: 'A done task',
      status: 'done',
      priority: 'medium',
      type: 'bug',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    const stats = store.getTaskStatistics(project.id)
    
    expect(stats).toBeDefined()
    expect(stats?.total).toBe(2)
    expect(stats?.completed).toBe(1)
    expect(stats?.todo).toBe(1)
    expect(stats?.completionRate).toBe(50)
    expect(stats?.byPriority.high).toBe(1)
    expect(stats?.byPriority.medium).toBe(1)
    expect(stats?.byType.feature).toBe(1)
    expect(stats?.byType.bug).toBe(1)
  })

  it('adds task comments correctly', () => {
    const store = useProjectStore()
    const project = createMockProject()
    store.projects.push(project)

    const task = store.createTask(project.id, {
      title: 'Test Task',
      description: 'A test task',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      tags: [],
      attachments: [],
      createdBy: 'user'
    })

    const commentData = {
      author: 'Test User',
      content: 'This is a test comment',
      attachments: []
    }

    const comment = store.addTaskComment(project.id, task!.id, commentData)
    
    expect(comment).toBeDefined()
    expect(comment?.content).toBe('This is a test comment')
    expect(comment?.author).toBe('Test User')
    expect(comment?.id).toBeDefined()
    expect(comment?.createdAt).toBeInstanceOf(Date)
    expect(task?.comments).toHaveLength(1)
  })
})