import OpenAI from 'openai'
import type { OpenAIConfig, OpenAIResponse, ChatMessage, GenerationOptions } from '@/types'

export class OpenAIService {
  private client: OpenAI | null = null
  private config: OpenAIConfig | null = null

  constructor() {
    // Initialize with stored config if available
    this.loadConfig()
  }

  /**
   * Configure OpenAI client with API key and settings
   */
  async configure(config: OpenAIConfig): Promise<void> {
    try {
      this.config = config
      this.client = new OpenAI({
        apiKey: config.apiKey,
        organization: config.organization,
        dangerouslyAllowBrowser: true // Required for client-side usage
      })

      // Save config to localStorage (without API key for security)
      const configToSave = { ...config }
      localStorage.setItem('openai-config', JSON.stringify(configToSave))
      
      // Store API key separately (consider more secure storage in production)
      localStorage.setItem('openai-api-key', config.apiKey)
    } catch (error) {
      console.error('Failed to configure OpenAI:', error)
      throw new Error('Failed to configure OpenAI client')
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('openai-config')
      const savedApiKey = localStorage.getItem('openai-api-key')
      
      if (savedConfig && savedApiKey) {
        const config = JSON.parse(savedConfig)
        config.apiKey = savedApiKey
        this.configure(config)
      }
    } catch (error) {
      console.warn('Failed to load OpenAI config:', error)
    }
  }

  /**
   * Test the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('OpenAI client not configured')
    }

    try {
      // Simple test with a minimal request
      await this.client.chat.completions.create({
        model: this.config?.defaultModel || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      })
      return true
    } catch (error) {
      console.error('OpenAI connection test failed:', error)
      return false
    }
  }

  /**
   * Generate chat completion
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): Promise<OpenAIResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not configured')
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.config?.defaultModel || 'gpt-4',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        // stream: options.stream || false
      })

      const choice = response.choices[0]
      return {
        content: choice.message?.content || '',
        role: choice.message?.role || 'assistant',
        finishReason: choice.finish_reason,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined,
        model: response.model,
        created: response.created
      }
    } catch (error: any) {
      console.error('OpenAI chat completion failed:', error)
      throw new Error(`OpenAI request failed: ${error.message}`)
    }
  }

  /**
   * Generate streaming chat completion
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('OpenAI client not configured')
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.config?.defaultModel || 'gpt-4',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error: any) {
      console.error('OpenAI streaming failed:', error)
      throw new Error(`OpenAI streaming failed: ${error.message}`)
    }
  }

  /**
   * Generate content for autonomous agents
   */
  async generateForAgent(
    agentId: string,
    context: string,
    task: string,
    options: GenerationOptions = {}
  ): Promise<OpenAIResponse> {
    const systemPrompt = `You are an autonomous AI agent (ID: ${agentId}) working on a project management board.
Your role is to generate content, code, and manage projects based on the given context and task.
You should be proactive, creative, and focused on delivering high-quality results.

Context: ${context}
Task: ${task}

Please provide a detailed response that addresses the task thoroughly.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please complete this task: ${task}` }
    ]

    return this.chatCompletion(messages, options)
  }

  /**
   * Generate autonomous prompts for self-directed agents
   */
  async generateAutonomousPrompt(
    agentId: string,
    projectContext: string,
    previousActions: string[] = []
  ): Promise<string> {
    const systemPrompt = `You are an autonomous AI agent (ID: ${agentId}) that needs to generate your next task.
Based on the project context and your previous actions, determine what you should work on next.
Be specific and actionable in your task generation.

Project Context: ${projectContext}
Previous Actions: ${previousActions.join(', ')}

Generate a specific, actionable task that you should work on next. Respond with just the task description.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'What should I work on next?' }
    ]

    const response = await this.chatCompletion(messages, { maxTokens: 200, temperature: 0.8 })
    return response.content
  }

  /**
   * Analyze code and suggest improvements
   */
  async analyzeCode(code: string, language: string = 'typescript'): Promise<OpenAIResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a code analysis expert. Analyze the provided ${language} code and provide suggestions for improvements, potential bugs, and best practices.`
      },
      {
        role: 'user',
        content: `Please analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``
      }
    ]

    return this.chatCompletion(messages, { maxTokens: 1500 })
  }

  /**
   * Generate code based on requirements
   */
  async generateCode(
    requirements: string,
    language: string = 'typescript',
    context: string = ''
  ): Promise<OpenAIResponse> {
    const systemPrompt = `You are an expert ${language} developer. Generate clean, well-documented, and efficient code based on the requirements.
${context ? `Additional context: ${context}` : ''}

Provide only the code with appropriate comments. Ensure the code follows best practices and is production-ready.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Requirements: ${requirements}` }
    ]

    return this.chatCompletion(messages, { maxTokens: 2000 })
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenAIConfig | null {
    return this.config
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.config !== null
  }

  /**
   * Clear configuration and disconnect
   */
  disconnect(): void {
    this.client = null
    this.config = null
    localStorage.removeItem('openai-config')
    localStorage.removeItem('openai-api-key')
  }
}

// Export singleton instance
export const openAIService = new OpenAIService()