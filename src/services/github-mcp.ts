import type { MCPEndpoint } from '@/types';
import { MCPService } from './mcp';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  private: boolean;
  language: string;
  updated_at: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

export class GitHubMCPService extends MCPService {
  private githubEndpoint: MCPEndpoint | null = null;

  async connectToGitHub(mcpServerUrl: string, token?: string): Promise<boolean> {
    const endpoint: MCPEndpoint = {
      id: 'github-mcp',
      name: 'GitHub MCP Server',
      url: mcpServerUrl,
      type: 'api_gateway',
      auth: token ? {
        type: 'bearer',
        credentials: { token }
      } : undefined,
      capabilities: [
        'repository_list',
        'file_read',
        'file_write',
        'commit_history',
        'branch_management',
        'issue_management',
        'pull_request_management'
      ],
      isActive: true
    };

    try {
      this.addEndpoint(endpoint);
      // Test connection
      
      await this.callEndpoint(endpoint.id, 'ping');
      this.githubEndpoint = endpoint;
      
      return true;
    } catch (error) {
      console.error('Failed to connect to GitHub MCP:', error);
      return false;
    }
  }

  async listRepositories(org?: string): Promise<GitHubRepository[]> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/repositories/list',
        { org }
      );
      return result.repositories || [];
    } catch (error) {
      console.error('Failed to list repositories:', error);
      throw error;
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/repository/get',
        { owner, repo }
      );
      return result.repository;
    } catch (error) {
      console.error('Failed to get repository:', error);
      throw error;
    }
  }

  async listFiles(owner: string, repo: string, path: string = '', ref?: string): Promise<GitHubFile[]> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/contents/list',
        { owner, repo, path, ref }
      );
      return result.files || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/contents/get',
        { owner, repo, path, ref }
      );
      
      // Decode base64 content if needed
      if (result.encoding === 'base64') {
        return atob(result.content.replace(/\s/g, ''));
      }
      
      return result.content || '';
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw error;
    }
  }

  async createFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string,
    branch?: string
  ): Promise<GitHubCommit> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/contents/create',
        { 
          owner, 
          repo, 
          path, 
          content: btoa(content), // Base64 encode
          message,
          branch 
        }
      );
      return result.commit;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async updateFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string,
    sha: string,
    branch?: string
  ): Promise<GitHubCommit> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/contents/update',
        { 
          owner, 
          repo, 
          path, 
          content: btoa(content), // Base64 encode
          message,
          sha,
          branch 
        }
      );
      return result.commit;
    } catch (error) {
      console.error('Failed to update file:', error);
      throw error;
    }
  }

  async deleteFile(
    owner: string, 
    repo: string, 
    path: string, 
    message: string,
    sha: string,
    branch?: string
  ): Promise<GitHubCommit> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/contents/delete',
        { 
          owner, 
          repo, 
          path, 
          message,
          sha,
          branch 
        }
      );
      return result.commit;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async getCommitHistory(owner: string, repo: string, path?: string, limit: number = 30): Promise<GitHubCommit[]> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/commits/list',
        { owner, repo, path, per_page: limit }
      );
      return result.commits || [];
    } catch (error) {
      console.error('Failed to get commit history:', error);
      throw error;
    }
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main'): Promise<boolean> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      await this.callEndpoint(
        this.githubEndpoint.id,
        'github/git/refs/create',
        { 
          owner, 
          repo, 
          ref: `refs/heads/${branchName}`,
          sha: fromBranch
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw error;
    }
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    if (!this.githubEndpoint) {
      throw new Error('GitHub MCP not connected');
    }

    try {
      const result = await this.callEndpoint(
        this.githubEndpoint.id,
        'github/branches/list',
        { owner, repo }
      );
      return result.branches?.map((b: any) => b.name) || [];
    } catch (error) {
      console.error('Failed to list branches:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.githubEndpoint !== null && this.githubEndpoint.isActive;
  }

  getConnectionInfo(): MCPEndpoint | null {
    return this.githubEndpoint;
  }
}