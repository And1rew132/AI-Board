import type { Project, ProjectTask, GitHubIssue, GitHubProjectIntegration } from '@/types';
import { GitHubMCPService } from './github-mcp';

export class GitHubProjectIntegrationService {
  private githubService: GitHubMCPService;

  constructor() {
    this.githubService = new GitHubMCPService();
  }

  /**
   * Connect a project to a GitHub repository
   */
  async connectProjectToRepository(
    _project: Project, 
    repositoryUrl: string, 
    accessToken: string
  ): Promise<GitHubProjectIntegration> {
    // Parse repository URL to extract owner and repo
    const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);
    
    // Test connection
    await this.githubService.connectToGitHub(accessToken);
    
    // Verify repository exists and is accessible
    const repository = await this.githubService.getRepository(owner, repo);
    
    // Get README
    let readme = '';
    try {
      readme = await this.githubService.getRepositoryReadme(owner, repo);
    } catch (error) {
      console.warn('Could not fetch README:', error);
      readme = 'README not available or accessible.';
    }

    const integration: GitHubProjectIntegration = {
      repositoryUrl,
      owner,
      repo,
      branch: repository.default_branch,
      accessToken,
      syncEnabled: true,
      lastSync: new Date(),
      readme,
      issuesSyncEnabled: true,
      autoCreateIssues: false,
      agentInterval: 60 // Default to 60 minutes
    };

    return integration;
  }

  /**
   * Sync GitHub issues to project tasks
   */
  async syncIssues(
    project: Project, 
    integration: GitHubProjectIntegration
  ): Promise<ProjectTask[]> {
    if (!integration.issuesSyncEnabled) {
      return [];
    }

    // Connect to GitHub
    if (integration.accessToken) {
      await this.githubService.connectToGitHub(integration.accessToken);
    }

    // Get GitHub issues
    const issues = await this.githubService.listIssues(
      integration.owner, 
      integration.repo, 
      'all'
    );

    // Convert GitHub issues to project tasks
    const syncedTasks: ProjectTask[] = [];

    for (const issue of issues) {
      // Check if task already exists for this issue
      const existingTask = project.tasks.find(
        task => task.githubIssue?.issueNumber === issue.number
      );

      if (existingTask) {
        // Update existing task
        const updatedTask = this.updateTaskFromIssue(existingTask, issue);
        syncedTasks.push(updatedTask);
      } else {
        // Create new task from issue
        const newTask = this.createTaskFromIssue(project.id, issue);
        syncedTasks.push(newTask);
      }
    }

    return syncedTasks;
  }

  /**
   * Create a GitHub issue from a project task
   */
  async createIssueFromTask(
    task: ProjectTask, 
    integration: GitHubProjectIntegration
  ): Promise<GitHubIssue> {
    if (integration.accessToken) {
      await this.githubService.connectToGitHub(integration.accessToken);
    }

    // Determine labels based on task properties
    const labels = this.getLabelsFromTask(task);

    // Create the issue
    const issue = await this.githubService.createIssue(
      integration.owner,
      integration.repo,
      task.title,
      this.formatTaskDescriptionForGitHub(task),
      labels
    );

    return issue;
  }

  /**
   * Parse repository URL to extract owner and repo
   */
  private parseRepositoryUrl(url: string): { owner: string; repo: string } {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com[\/:]([^\/]+)\/([^\/\.]+)/, // https://github.com/owner/repo or git@github.com:owner/repo
      /github\.com\/([^\/]+)\/([^\/]+)\.git/, // https://github.com/owner/repo.git
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2]
        };
      }
    }

    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  /**
   * Create a project task from a GitHub issue
   */
  private createTaskFromIssue(projectId: string, issue: GitHubIssue): ProjectTask {
    return {
      id: this.generateId(),
      projectId,
      title: issue.title,
      description: issue.body,
      status: issue.state === 'closed' ? 'done' : 'todo',
      priority: this.getPriorityFromLabels(issue.labels),
      type: this.getTypeFromLabels(issue.labels),
      assigneeId: issue.assignee || undefined,
      assigneeName: issue.assignee || undefined,
      tags: issue.labels,
      comments: [],
      attachments: [],
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      createdBy: 'github-sync',
      completedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
      githubIssue: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        lastSyncAt: new Date(),
        syncDirection: 'github_to_project'
      }
    };
  }

  /**
   * Update an existing task from a GitHub issue
   */
  private updateTaskFromIssue(task: ProjectTask, issue: GitHubIssue): ProjectTask {
    return {
      ...task,
      title: issue.title,
      description: issue.body,
      status: issue.state === 'closed' ? 'done' : task.status,
      tags: issue.labels,
      updatedAt: new Date(issue.updated_at),
      completedAt: issue.closed_at ? new Date(issue.closed_at) : task.completedAt,
      githubIssue: {
        ...task.githubIssue!,
        lastSyncAt: new Date()
      }
    };
  }

  /**
   * Get priority from GitHub issue labels
   */
  private getPriorityFromLabels(labels: string[]): ProjectTask['priority'] {
    const lowerLabels = labels.map(l => l.toLowerCase());
    
    if (lowerLabels.some(l => l.includes('urgent') || l.includes('critical'))) {
      return 'urgent';
    }
    if (lowerLabels.some(l => l.includes('high'))) {
      return 'high';
    }
    if (lowerLabels.some(l => l.includes('low'))) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Get task type from GitHub issue labels
   */
  private getTypeFromLabels(labels: string[]): ProjectTask['type'] {
    const lowerLabels = labels.map(l => l.toLowerCase());
    
    if (lowerLabels.some(l => l.includes('bug') || l.includes('error'))) {
      return 'bug';
    }
    if (lowerLabels.some(l => l.includes('feature') || l.includes('enhancement'))) {
      return 'feature';
    }
    if (lowerLabels.some(l => l.includes('documentation') || l.includes('docs'))) {
      return 'documentation';
    }
    if (lowerLabels.some(l => l.includes('research') || l.includes('investigation'))) {
      return 'research';
    }
    return 'improvement';
  }

  /**
   * Get labels for GitHub issue from project task
   */
  private getLabelsFromTask(task: ProjectTask): string[] {
    const labels = [...task.tags];
    
    // Add type as label
    labels.push(task.type);
    
    // Add priority as label
    if (task.priority !== 'medium') {
      labels.push(`priority:${task.priority}`);
    }
    
    return labels;
  }

  /**
   * Format task description for GitHub issue
   */
  private formatTaskDescriptionForGitHub(task: ProjectTask): string {
    let body = task.description;
    
    if (task.estimatedHours) {
      body += `\n\n**Estimated Hours:** ${task.estimatedHours}`;
    }
    
    if (task.dueDate) {
      body += `\n**Due Date:** ${task.dueDate.toLocaleDateString()}`;
    }
    
    body += `\n\n---\n*Created from AI-Board Project Task*`;
    
    return body;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}