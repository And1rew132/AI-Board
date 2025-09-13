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
  private githubToken: string | null = null;
  private connected: boolean = false;

  async connectToGitHub(token: string): Promise<boolean> {
    this.githubToken = token;
    
    try {
      // Test the token by making a simple API call to GitHub
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (response.ok) {
        this.connected = true;
        return true;
      } else {
        console.error('GitHub API authentication failed:', response.status, response.statusText);
        this.connected = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to GitHub:', error);
      this.connected = false;
      return false;
    }
  }

  async listRepositories(org?: string): Promise<GitHubRepository[]> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    try {
      let url = 'https://api.github.com/user/repos?type=all&sort=updated&per_page=50';
      if (org) {
        url = `https://api.github.com/orgs/${org}/repos?sort=updated&per_page=50`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repos = await response.json();
      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        default_branch: repo.default_branch,
        private: repo.private,
        language: repo.language || 'Unknown',
        updated_at: repo.updated_at
      }));
    } catch (error) {
      console.error('Failed to list repositories:', error);
      throw error;
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repoData = await response.json();
      return {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description || '',
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
        ssh_url: repoData.ssh_url,
        default_branch: repoData.default_branch,
        private: repoData.private,
        language: repoData.language || 'Unknown',
        updated_at: repoData.updated_at
      };
    } catch (error) {
      console.error('Failed to get repository:', error);
      throw error;
    }
  }

  async listFiles(owner: string, repo: string, path: string = '', ref?: string): Promise<GitHubFile[]> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    try {
      let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      if (ref) {
        url += `?ref=${ref}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const contents = await response.json();
      
      // Handle both single file and directory responses
      const items = Array.isArray(contents) ? contents : [contents];
      
      return items.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size || 0,
        url: item.url,
        download_url: item.download_url,
        type: item.type === 'dir' ? 'dir' : 'file',
        content: item.content // Available if it's a file and small enough
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    try {
      let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      if (ref) {
        url += `?ref=${ref}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const fileData = await response.json();
      
      // Decode base64 content if needed
      if (fileData.encoding === 'base64' && fileData.content) {
        return atob(fileData.content.replace(/\s/g, ''));
      }
      
      return fileData.content || '';
    } catch (error) {
      console.error('Failed to get file content:', error);
      throw error;
    }
  }

  async createFile(
    _owner: string, 
    _repo: string, 
    _path: string, 
    _content: string, 
    _message: string,
    _branch?: string
  ): Promise<GitHubCommit> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    // TODO: Implement direct GitHub API call for file creation
    throw new Error('File creation not yet implemented in simplified GitHub integration');
  }

  async updateFile(
    _owner: string, 
    _repo: string, 
    _path: string, 
    _content: string, 
    _message: string,
    _sha: string,
    _branch?: string
  ): Promise<GitHubCommit> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    // TODO: Implement direct GitHub API call for file update
    throw new Error('File update not yet implemented in simplified GitHub integration');
  }

  async deleteFile(
    _owner: string, 
    _repo: string, 
    _path: string, 
    _message: string,
    _sha: string,
    _branch?: string
  ): Promise<GitHubCommit> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    // TODO: Implement direct GitHub API call for file deletion
    throw new Error('File deletion not yet implemented in simplified GitHub integration');
  }

  async getCommitHistory(_owner: string, _repo: string, _path?: string, _limit: number = 30): Promise<GitHubCommit[]> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    // TODO: Implement direct GitHub API call for commit history
    throw new Error('Commit history not yet implemented in simplified GitHub integration');
  }

  async createBranch(_owner: string, _repo: string, _branchName: string, _fromBranch: string = 'main'): Promise<boolean> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    // TODO: Implement direct GitHub API call for branch creation
    throw new Error('Branch creation not yet implemented in simplified GitHub integration');
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    if (!this.connected || !this.githubToken) {
      throw new Error('GitHub not connected. Please provide a valid token.');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Board'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const branches = await response.json();
      return branches.map((branch: any) => branch.name);
    } catch (error) {
      console.error('Failed to list branches:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected && this.githubToken !== null;
  }

  getConnectionInfo(): MCPEndpoint | null {
    if (!this.connected || !this.githubToken) {
      return null;
    }
    
    return {
      id: 'github-integration',
      name: 'GitHub Integration',
      url: 'https://api.github.com',
      type: 'api_gateway',
      auth: {
        type: 'bearer',
        credentials: { token: this.githubToken }
      },
      capabilities: [
        'repository_list',
        'file_read',
        'file_write',
        'commit_history',
        'branch_management'
      ],
      isActive: true
    };
  }
}