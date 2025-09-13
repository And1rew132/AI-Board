import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Agent, AgentTask, AgentPrompt, MCPEndpoint, AgentOpenAIConfig } from '@/types';
import { openAIService } from '@/services/openai';

export const useAgentStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([]);
  const tasks = ref<AgentTask[]>([]);
  const prompts = ref<AgentPrompt[]>([]);
  const mcpEndpoints = ref<MCPEndpoint[]>([]);

  const activeAgents = computed(() => 
    agents.value.filter((a: Agent) => a.status === 'active')
  );

  const busyAgents = computed(() => 
    agents.value.filter((a: Agent) => a.status === 'busy')
  );

  const autonomousAgents = computed(() =>
    agents.value.filter((a: Agent) => a.type === 'autonomous' && a.status === 'active')
  );

  function createAgent(agentData: Omit<Agent, 'id' | 'createdAt' | 'lastActivity'>) {
    const newAgent: Agent = {
      ...agentData,
      id: generateId(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    
    agents.value.push(newAgent);
    return newAgent;
  }

  function updateAgent(id: string, updates: Partial<Agent>) {
    const index = agents.value.findIndex((a: Agent) => a.id === id);
    if (index !== -1) {
      agents.value[index] = {
        ...agents.value[index],
        ...updates,
        lastActivity: new Date(),
      };
    }
  }

  function deleteAgent(id: string) {
    const index = agents.value.findIndex((a: Agent) => a.id === id);
    if (index !== -1) {
      agents.value.splice(index, 1);
    }
  }

  function createTask(taskData: Omit<AgentTask, 'id' | 'createdAt'>) {
    const newTask: AgentTask = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
    };
    
    tasks.value.push(newTask);
    return newTask;
  }

  function updateTask(id: string, updates: Partial<AgentTask>) {
    const index = tasks.value.findIndex((t: AgentTask) => t.id === id);
    if (index !== -1) {
      tasks.value[index] = {
        ...tasks.value[index],
        ...updates,
      };
    }
  }

  function getTasksForAgent(agentId: string) {
    return tasks.value.filter((t: AgentTask) => t.agentId === agentId);
  }

  function getPendingTasks() {
    return tasks.value.filter((t: AgentTask) => t.status === 'pending');
  }

  function createPrompt(promptData: Omit<AgentPrompt, 'id' | 'generatedAt'>) {
    const newPrompt: AgentPrompt = {
      ...promptData,
      id: generateId(),
      generatedAt: new Date(),
    };
    
    prompts.value.push(newPrompt);
    return newPrompt;
  }

  function addMCPEndpoint(endpoint: Omit<MCPEndpoint, 'id'>) {
    const newEndpoint: MCPEndpoint = {
      ...endpoint,
      id: generateId(),
    };
    
    mcpEndpoints.value.push(newEndpoint);
    return newEndpoint;
  }

  function updateMCPEndpoint(id: string, updates: Partial<MCPEndpoint>) {
    const index = mcpEndpoints.value.findIndex((e: MCPEndpoint) => e.id === id);
    if (index !== -1) {
      mcpEndpoints.value[index] = {
        ...mcpEndpoints.value[index],
        ...updates,
      };
    }
  }

  function getActiveMCPEndpoints() {
    return mcpEndpoints.value.filter((e: MCPEndpoint) => e.isActive);
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Autonomous agent functions
  function triggerAutonomousActions() {
    const autonomous = autonomousAgents.value;
    
    autonomous.forEach((agent: Agent) => {
      if (agent.config.autonomyLevel === 'high') {
        generateAutonomousPrompt(agent);
      }
    });
  }

  async function generateAutonomousPrompt(agent: Agent) {
    // Generate context-aware prompts for autonomous agents
    const recentTasks = getTasksForAgent(agent.id).slice(-5);
    const context = {
      projectId: agent.projects[0], // Primary project
      previousTasks: recentTasks.map((t: AgentTask) => t.id),
      availableResources: getActiveMCPEndpoints().map((e: MCPEndpoint) => e.name),
    };

    let promptContent: string;
    
    // Check if OpenAI is configured and agent has OpenAI capability
    const hasOpenAI = agent.capabilities.some(cap => cap.type === 'ai_generation');
    const openAIConfig = agent.config as any;
    
    if (hasOpenAI && openAIConfig.openai?.enabled && openAIService.isConfigured()) {
      try {
        // Generate autonomous prompt using OpenAI
        const projectContext = `Agent: ${agent.name}, Projects: ${agent.projects.join(', ')}`;
        const previousActions = recentTasks.map(t => t.description);
        
        promptContent = await openAIService.generateAutonomousPrompt(
          agent.id,
          projectContext,
          previousActions
        );
      } catch (error) {
        console.error('Failed to generate OpenAI prompt for agent:', error);
        promptContent = generatePromptBasedOnStrategy(agent, context);
      }
    } else {
      promptContent = generatePromptBasedOnStrategy(agent, context);
    }
    
    return createPrompt({
      agentId: agent.id,
      content: promptContent,
      context,
    });
  }

  async function executeTaskWithOpenAI(task: AgentTask): Promise<void> {
    const agent = agents.value.find(a => a.id === task.agentId);
    if (!agent) return;

    const openAIConfig = agent.config as any;
    const hasOpenAI = agent.capabilities.some(cap => cap.type === 'ai_generation');
    
    if (!hasOpenAI || !openAIConfig.openai?.enabled || !openAIService.isConfigured()) {
      throw new Error('OpenAI not configured for this agent');
    }

    updateTask(task.id, { status: 'in_progress', startedAt: new Date() });
    updateAgent(agent.id, { status: 'busy' });

    try {
      const context = `Project: ${task.projectId}, Agent: ${agent.name}`;
      const response = await openAIService.generateForAgent(
        agent.id,
        context,
        task.description,
        {
          model: openAIConfig.openai.model,
          temperature: openAIConfig.openai.temperature,
          maxTokens: openAIConfig.openai.maxTokens
        }
      );

      updateTask(task.id, {
        status: 'completed',
        completedAt: new Date(),
        result: {
          success: true,
          data: response.content,
          artifacts: []
        }
      });
    } catch (error: any) {
      updateTask(task.id, {
        status: 'failed',
        completedAt: new Date(),
        result: {
          success: false,
          error: error?.message || 'Unknown error'
        }
      });
    } finally {
      updateAgent(agent.id, { status: 'active' });
    }
  }

  async function generateCodeForAgent(
    agentId: string,
    requirements: string,
    language: string = 'typescript'
  ): Promise<string> {
    const agent = agents.value.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const openAIConfig = agent.config as any;
    const hasCodeGen = agent.capabilities.some(cap => cap.type === 'code_generation');
    
    if (!hasCodeGen || !openAIConfig.openai?.enabled || !openAIService.isConfigured()) {
      throw new Error('Code generation not configured for this agent');
    }

    const context = `Agent: ${agent.name}, Capabilities: ${agent.capabilities.map(c => c.type).join(', ')}`;
    const response = await openAIService.generateCode(requirements, language, context);
    
    return response.content;
  }

  // Project task integration functions
  async function createProjectTaskForAgent(
    agentId: string,
    projectId: string,
    taskData: {
      title: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      tags?: string[];
    }
  ) {
    const agent = agents.value.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    // Import the project store
    const { useProjectStore } = await import('@/stores/projects');
    const projectStore = useProjectStore();

    const task = projectStore.createTask(projectId, {
      title: taskData.title,
      description: taskData.description,
      status: 'todo',
      priority: taskData.priority || 'medium',
      type: 'feature',
      assigneeId: agentId,
      assigneeName: agent.name,
      tags: taskData.tags || [],
      attachments: [],
      createdBy: agent.name,
      estimatedHours: 0
    });

    // Create an agent task for tracking
    createTask({
      agentId,
      projectId,
      description: `Created project task: ${taskData.title}`,
      status: 'completed',
      type: 'create_content',
      priority: 'medium',
      dependencies: []
    });

    return task;
  }

  async function analyzeProjectAndCreateTasks(agentId: string, projectId: string) {
    const agent = agents.value.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const openAIConfig = agent.config as any;
    const hasAI = agent.capabilities.some(cap => cap.type === 'ai_generation');
    
    if (!hasAI || !openAIConfig.openai?.enabled || !openAIService.isConfigured()) {
      throw new Error('AI analysis not configured for this agent');
    }

    updateAgent(agentId, { status: 'busy' });

    try {
      // Import the project store
      const { useProjectStore } = await import('@/stores/projects');
      const projectStore = useProjectStore();
      
      const project = projectStore.getProjectById(projectId);
      if (!project) throw new Error('Project not found');

      // Analyze project content and existing tasks
      const projectContext = {
        name: project.name,
        description: project.description,
        contentItems: project.content.length,
        existingTasks: project.tasks?.length || 0,
        agents: project.agents.length
      };

      const response = await openAIService.chatCompletion([
        {
          role: 'system',
          content: `You are an AI project manager. Analyze the project and suggest 2-3 specific, actionable tasks that would help advance the project. 
          
          Respond with a JSON array of tasks in this format:
          [
            {
              "title": "Task title (max 50 chars)",
              "description": "Detailed description of what needs to be done",
              "priority": "low|medium|high|urgent", 
              "tags": ["tag1", "tag2"]
            }
          ]
          
          Focus on practical, specific tasks that can be completed. Avoid vague or overly broad tasks.`
        },
        {
          role: 'user',
          content: `Project: ${project.name}
          Description: ${project.description || 'No description'}
          Current content items: ${projectContext.contentItems}
          Existing tasks: ${projectContext.existingTasks}
          
          Please suggest tasks that would help advance this project.`
        }
      ], {
        temperature: 0.7,
        maxTokens: 1000
      });

      // Parse the AI response
      let suggestedTasks;
      try {
        // Extract JSON from response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestedTasks = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI task suggestions:', parseError);
        // Fallback to a default task
        suggestedTasks = [{
          title: 'Review and organize project',
          description: 'Review current project status and organize existing content for better structure.',
          priority: 'medium',
          tags: ['organization', 'review']
        }];
      }

      // Create the suggested tasks
      const createdTasks = [];
      for (const taskData of suggestedTasks.slice(0, 3)) { // Limit to 3 tasks
        try {
          const task = await createProjectTaskForAgent(agentId, projectId, taskData);
          createdTasks.push(task);
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }

      // Log the analysis activity
      createTask({
        agentId,
        projectId,
        description: `Analyzed project and created ${createdTasks.length} task(s)`,
        status: 'completed',
        type: 'analyze_data',
        priority: 'medium',
        dependencies: []
      });

      return createdTasks;

    } catch (error) {
      console.error('Failed to analyze project:', error);
      throw error;
    } finally {
      updateAgent(agentId, { status: 'active' });
    }
  }

  function configureAgentOpenAI(agentId: string, config: AgentOpenAIConfig) {
    const agent = agents.value.find(a => a.id === agentId);
    if (!agent) return;

    // Add AI generation capability if not present
    const hasAICapability = agent.capabilities.some(cap => cap.type === 'ai_generation');
    if (!hasAICapability && config.enabled) {
      agent.capabilities.push({
        type: 'ai_generation',
        description: 'Generate content using OpenAI',
        enabled: true
      });
    }

    // Update agent config
    const updatedConfig = {
      ...agent.config,
      openai: config
    };

    updateAgent(agentId, { config: updatedConfig });
  }

  function getAgentOpenAIConfig(agentId: string): AgentOpenAIConfig | null {
    const agent = agents.value.find(a => a.id === agentId);
    if (!agent) return null;

    const config = agent.config as any;
    return config.openai || null;
  }

  function generatePromptBasedOnStrategy(agent: Agent, _context: any): string {
    switch (agent.config.promptingStrategy) {
      case 'goal_oriented':
        return `Based on the project goals and current progress, what should be the next action to advance the project?`;
      case 'task_driven':
        return `Review the pending tasks and dependencies. Which task should be prioritized and executed next?`;
      case 'exploratory':
        return `Analyze the current project state and identify opportunities for improvement or new features to implement.`;
      default:
        return `Continue working on the assigned project tasks.`;
    }
  }

  return {
    agents,
    tasks,
    prompts,
    mcpEndpoints,
    activeAgents,
    busyAgents,
    autonomousAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    createTask,
    updateTask,
    getTasksForAgent,
    getPendingTasks,
    createPrompt,
    addMCPEndpoint,
    updateMCPEndpoint,
    getActiveMCPEndpoints,
    triggerAutonomousActions,
    generateAutonomousPrompt,
    executeTaskWithOpenAI,
    generateCodeForAgent,
    configureAgentOpenAI,
    getAgentOpenAIConfig,
    createProjectTaskForAgent,
    analyzeProjectAndCreateTasks,
  };
}, {
  persist: {
    storage: localStorage,
    pick: ['agents', 'tasks', 'mcpEndpoints']
  }
});