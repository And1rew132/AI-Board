import type { Project, Agent } from '@/types';
import { GitHubProjectIntegrationService } from './github-project-integration';
import { useProjectStore } from '@/stores/projects';
import { useAgentStore } from '@/stores/agents';

interface IssueCreationPrompt {
  projectName: string;
  projectDescription: string;
  existingTasks: string[];
  repositoryReadme: string;
}

export class GitHubIssueAgentService {
  private githubIntegration: GitHubProjectIntegrationService;
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.githubIntegration = new GitHubProjectIntegrationService();
  }

  /**
   * Start automated issue creation for all projects with GitHub integration
   */
  startAutomatedIssueCreation(): void {
    const projectStore = useProjectStore();
    const projects = projectStore.getProjectsWithGitHubIntegration();

    projects.forEach(project => {
      if (project.githubIntegration?.autoCreateIssues) {
        this.scheduleIssueCreationForProject(project);
      }
    });
  }

  /**
   * Stop automated issue creation for all projects
   */
  stopAutomatedIssueCreation(): void {
    this.intervalIds.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.intervalIds.clear();
  }

  /**
   * Schedule issue creation for a specific project
   */
  scheduleIssueCreationForProject(project: Project): void {
    if (!project.githubIntegration?.autoCreateIssues || !project.githubIntegration.agentInterval) {
      return;
    }

    // Clear existing interval if any
    const existingInterval = this.intervalIds.get(project.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up new interval
    const intervalMs = project.githubIntegration.agentInterval * 60 * 1000; // Convert minutes to milliseconds
    const intervalId = setInterval(async () => {
      try {
        await this.createIssueForProject(project);
      } catch (error) {
        console.error(`Failed to create issue for project ${project.name}:`, error);
      }
    }, intervalMs);

    this.intervalIds.set(project.id, intervalId);
  }

  /**
   * Stop issue creation for a specific project
   */
  stopIssueCreationForProject(projectId: string): void {
    const intervalId = this.intervalIds.get(projectId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(projectId);
    }
  }

  /**
   * Create a new issue for a project using AI agent
   */
  async createIssueForProject(project: Project): Promise<void> {
    if (!project.githubIntegration) {
      throw new Error('Project is not connected to GitHub');
    }

    // Get appropriate agent for issue creation
    const agent = this.getIssueCreationAgent();
    if (!agent) {
      throw new Error('No suitable agent found for issue creation');
    }

    // Prepare context for AI agent
    const prompt = this.buildIssueCreationPrompt(project);
    
    // Generate issue using AI (simplified - in real implementation would use OpenAI service)
    const issueData = await this.generateIssueWithAI(prompt, agent);
    
    // Add the task to the project first
    const projectStore = useProjectStore();
    const newTask = projectStore.createTask(project.id, {
      title: issueData.task.title,
      description: issueData.task.description,
      status: 'todo',
      priority: issueData.task.priority,
      type: issueData.task.type,
      assigneeId: agent.id,
      assigneeName: agent.name,
      tags: issueData.task.tags,
      attachments: [],
      createdBy: agent.id
    });

    if (!newTask) {
      throw new Error('Failed to create task');
    }
    
    // Create the issue in GitHub using the created task
    const issue = await this.githubIntegration.createIssueFromTask(
      newTask,
      project.githubIntegration
    );

    // Link to GitHub issue
    projectStore.updateTask(project.id, newTask.id, {
      githubIssue: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        lastSyncAt: new Date(),
        syncDirection: 'project_to_github'
      }
    });

    console.log(`Created GitHub issue #${issue.number} for project ${project.name}`);
  }

  /**
   * Get an agent capable of creating issues
   */
  private getIssueCreationAgent(): Agent | null {
    const agentStore = useAgentStore();
    const agents = agentStore.agents;

    // Look for agents with code generation or content creation capabilities
    const suitableAgent = agents.find(agent => 
      agent.status === 'active' && 
      agent.capabilities.some(cap => 
        cap.type === 'code_generation' || 
        cap.type === 'content_creation' ||
        cap.type === 'analysis'
      )
    );

    return suitableAgent || null;
  }

  /**
   * Build a context prompt for AI issue generation
   */
  private buildIssueCreationPrompt(project: Project): IssueCreationPrompt {
    const existingTasks = project.tasks.map(task => 
      `${task.title} (${task.type}, ${task.status})`
    );

    return {
      projectName: project.name,
      projectDescription: project.description,
      existingTasks,
      repositoryReadme: project.githubIntegration?.readme || 'No README available'
    };
  }

  /**
   * Generate issue using AI agent (simplified implementation)
   * In a real implementation, this would use the OpenAI service
   */
  private async generateIssueWithAI(prompt: IssueCreationPrompt, agent: Agent): Promise<{
    task: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      type: 'feature' | 'bug' | 'improvement' | 'documentation' | 'research';
      tags: string[];
    }
  }> {
    // This is a simplified implementation that generates predefined issues
    // In a real implementation, this would use OpenAI to generate contextual issues
    
    const issueTemplates = [
      {
        title: 'Improve code documentation',
        description: `## Task Description\nEnhance code documentation for better maintainability.\n\n## Context\nProject: ${prompt.projectName}\n\nGenerated by AI Agent: ${agent.name}`,
        priority: 'medium' as const,
        type: 'documentation' as const,
        tags: ['documentation', 'maintenance', 'ai-generated']
      },
      {
        title: 'Add unit tests for core functionality',
        description: `## Task Description\nImplement comprehensive unit tests to improve code reliability.\n\n## Context\nProject: ${prompt.projectName}\n\nGenerated by AI Agent: ${agent.name}`,
        priority: 'high' as const,
        type: 'improvement' as const,
        tags: ['testing', 'quality', 'ai-generated']
      },
      {
        title: 'Performance optimization review',
        description: `## Task Description\nReview and optimize performance bottlenecks in the application.\n\n## Context\nProject: ${prompt.projectName}\n\nGenerated by AI Agent: ${agent.name}`,
        priority: 'medium' as const,
        type: 'improvement' as const,
        tags: ['performance', 'optimization', 'ai-generated']
      },
      {
        title: 'Security audit and improvements',
        description: `## Task Description\nConduct security audit and implement necessary improvements.\n\n## Context\nProject: ${prompt.projectName}\n\nGenerated by AI Agent: ${agent.name}`,
        priority: 'high' as const,
        type: 'improvement' as const,
        tags: ['security', 'audit', 'ai-generated']
      },
      {
        title: 'Feature enhancement analysis',
        description: `## Task Description\nAnalyze potential feature enhancements based on project goals.\n\n## Context\nProject: ${prompt.projectName}\nDescription: ${prompt.projectDescription}\n\nGenerated by AI Agent: ${agent.name}`,
        priority: 'low' as const,
        type: 'research' as const,
        tags: ['research', 'features', 'ai-generated']
      }
    ];

    // Filter out issues that might already exist based on existing task titles
    const availableTemplates = issueTemplates.filter(template =>
      !prompt.existingTasks.some(existingTask => 
        existingTask.toLowerCase().includes(template.title.toLowerCase().split(' ')[0])
      )
    );

    // Select a random template
    const selectedTemplate = availableTemplates.length > 0 
      ? availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
      : issueTemplates[Math.floor(Math.random() * issueTemplates.length)];

    return {
      task: selectedTemplate
    };
  }

  /**
   * Get status of automated issue creation
   */
  getAutomationStatus(): { [projectId: string]: boolean } {
    const status: { [projectId: string]: boolean } = {};
    
    this.intervalIds.forEach((_, projectId) => {
      status[projectId] = true;
    });

    return status;
  }

  /**
   * Update automation for a project based on its settings
   */
  updateProjectAutomation(project: Project): void {
    if (project.githubIntegration?.autoCreateIssues) {
      this.scheduleIssueCreationForProject(project);
    } else {
      this.stopIssueCreationForProject(project.id);
    }
  }
}